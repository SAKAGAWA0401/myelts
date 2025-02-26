'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  SkipForward,
  Rotate3D,
  Volume2,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import Link from 'next/link';
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import { Category } from '@/types/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface FlashCard {
  cardid: string;
  question: string;
  answer: string;
  questionAudio: string;
  answerAudio: string;
  words: Array<{
    word: string;
    ipa: string;
  }>;
}

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load categories and cards from Supabase
  useEffect(() => {
    if (!isSignedIn || !user) return;

    const fetchCategories = async () => {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      setCategories(categoriesData);
    };

    fetchCategories();
  }, [isSignedIn, user]);

  // Fetch cards when category is selected
  useEffect(() => {
    if (!selectedCategory || !user) return;

    const fetchCards = async () => {
      // Get cards for the selected category
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('cardid')
        .eq('categoryid', selectedCategory)
        .eq('userid', user.id);

      if (cardsError) {
        console.error('Error fetching cards:', cardsError);
        return;
      }

      if (!cardsData || cardsData.length === 0) {
        setCards([]);
        return;
      }

      // Get questions and answers for the cards
      const cardIds = cardsData.map((card) => card.cardid);

      // First get answers to get answerids
      const answersResponse = await supabase
        .from('answers')
        .select('*')
        .in('cardid', cardIds);

      if (answersResponse.error) {
        console.error('Error fetching answers:', answersResponse.error);
        return;
      }

      // Then get questions and words
      const [questionsResponse, wordsResponse] = await Promise.all([
        supabase.from('questions').select('*').in('cardid', cardIds),
        supabase
          .from('words')
          .select('*')
          .in(
            'answerid',
            answersResponse.data.map((a) => a.answerid),
          ),
      ]);

      if (questionsResponse.error) {
        console.error('Error fetching questions:', questionsResponse.error);
        return;
      }

      if (wordsResponse.error) {
        console.error('Error fetching words:', wordsResponse.error);
        return;
      }

      // Transform data into FlashCard format
      const flashCards: FlashCard[] = questionsResponse.data.map((q) => {
        const answer = answersResponse.data.find((a) => a.cardid === q.cardid);
        const words = answer
          ? wordsResponse.data.filter((w) => w.answerid === answer.answerid)
          : [];

        return {
          cardid: q.cardid,
          question: q.question,
          answer: answer?.answer || '',
          questionAudio: q.questionaudio,
          answerAudio: answer?.answeraudio || '',
          words: words.map((w) => ({
            word: w.word,
            ipa: w.ipa,
          })),
        };
      });

      setCards(flashCards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    };

    fetchCards();
  }, [selectedCategory, user]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, []);

  // Handle auto play sequence
  useEffect(() => {
    if (!isAutoPlaying) return;

    const playCurrentAudio = () => {
      if (audioRef.current) {
        audioRef.current.src = isFlipped
          ? cards[currentCardIndex].answerAudio
          : cards[currentCardIndex].questionAudio;
        audioRef.current.play();
        setIsPlaying(true);
      }
    };

    const handleAutoPlaySequence = () => {
      if (!isAutoPlaying) return;

      // Play current audio
      playCurrentAudio();

      // Set up the next action
      if (audioRef.current) {
        audioRef.current.onended = () => {
          setIsPlaying(false);

          // Wait a moment after audio finishes before next action
          autoPlayTimeoutRef.current = setTimeout(() => {
            if (!isFlipped) {
              // If showing front, flip to back
              setIsFlipped(true);
            } else if (currentCardIndex < cards.length - 1) {
              // If showing back and not last card, go to next card
              setCurrentCardIndex((prev) => prev + 1);
              setIsFlipped(false);
            } else {
              // If last card and showing back, stop auto play
              setIsAutoPlaying(false);
            }
          }, 1000); // 1 second delay between actions
        };
      }
    };

    handleAutoPlaySequence();
  }, [isAutoPlaying, currentCardIndex, isFlipped, cards]);

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      // Stop auto play
      setIsAutoPlaying(false);
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      // Start auto play from current state
      setIsAutoPlaying(true);
    }
  };

  const handleFlip = () => {
    if (isAutoPlaying) return; // Prevent manual flip during auto play
    setIsFlipped(!isFlipped);
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    if (isAutoPlaying) return; // Prevent manual next during auto play
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.src = isFlipped
          ? cards[currentCardIndex].answerAudio
          : cards[currentCardIndex].questionAudio;
        audioRef.current.play();
        setIsPlaying(true);

        // Add event listener for when audio finishes playing
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
    }
  };

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">MyELTS</h1>
            <p className="mb-8 text-gray-600">
              Learn IELTS speaking tasks with interactive flashcards
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="w-full">Sign In</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              MyELTS
            </h1>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                asChild
                className="h-auto whitespace-normal py-2 text-sm"
              >
                <Link href="/qa-register">Register QA</Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="h-auto whitespace-normal py-2 text-sm"
              >
                <Link href="/category-register">Register Category</Link>
              </Button>
            </div>
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!selectedCategory ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card
                key={category.categoryid}
                className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
                onClick={() => handleCategorySelect(category.categoryid)}
              >
                <h2 className="text-xl font-semibold">
                  {`${category.part} - ${category.theme}`}
                </h2>
                <p className="mt-2 text-gray-600">{category.period}</p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-8 flex gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedCategory(null)}
                disabled={isAutoPlaying}
              >
                Back to List
              </Button>
              <Button
                variant="outline"
                onClick={toggleAutoPlay}
                disabled={cards.length === 0}
              >
                {isAutoPlaying ? (
                  <>
                    <PauseCircle className="mr-2" />
                    Stop Auto Play
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2" />
                    Auto Play
                  </>
                )}
              </Button>
            </div>

            {cards.length > 0 ? (
              <>
                <Card
                  className={`min-h-[200px] w-full max-w-2xl p-8 ${isFlipped ? 'bg-blue-50' : 'bg-white'}`}
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="text-center">
                      <h3 className="mb-4 text-xl font-semibold">
                        {isFlipped ? 'Answer' : 'Question'}
                      </h3>
                      <p className="text-lg">
                        {isFlipped
                          ? cards[currentCardIndex].answer
                          : cards[currentCardIndex].question}
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="mt-8 flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handleFlip}
                    disabled={isAutoPlaying}
                  >
                    <Rotate3D className="mr-2" />
                    Flip
                  </Button>
                  <Button
                    variant="outline"
                    onClick={playAudio}
                    disabled={isAutoPlaying}
                  >
                    <Volume2
                      className={`mr-2 ${isPlaying ? 'text-primary' : ''}`}
                    />
                    {isPlaying ? 'Stop' : 'Play Audio'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={
                      isAutoPlaying || currentCardIndex === cards.length - 1
                    }
                  >
                    <SkipForward className="mr-2" />
                    Next
                  </Button>
                </div>

                {isFlipped && cards[currentCardIndex].words.length > 0 && (
                  <div className="mt-8 w-full max-w-2xl">
                    <Card className="p-6">
                      <h4 className="mb-4 text-center text-sm font-semibold text-gray-600">
                        Key Words and Pronunciations
                      </h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {cards[currentCardIndex].words.map((word, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                          >
                            <span className="font-medium">{word.word}</span>
                            <span className="text-gray-500">{word.ipa}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <Card className="w-full max-w-2xl p-8">
                <p className="text-center text-gray-600">
                  No flashcards found for this category
                </p>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Hidden audio element for playing sounds */}
      <audio ref={audioRef} />
    </div>
  );
}
