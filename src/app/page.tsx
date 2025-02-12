'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, PauseCircle, SkipForward, Rotate3D } from 'lucide-react';
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import { Category } from '@/types/db';
import { mockCategories, mockQuestions, mockAnswers } from '@/lib/mock/data';

interface FlashCard {
  cardid: string;
  question: string;
  answer: string;
  questionAudio: string;
  answerAudio: string;
}

export default function Home() {
  const { isSignedIn } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  // const [audioMode, setAudioMode] = useState<'auto' | 'manual'>('manual');

  // Load mock data when signed in
  useEffect(() => {
    if (!isSignedIn) return;

    setCategories(mockCategories);

    // Transform mock data into FlashCard format
    const flashCards: FlashCard[] = mockQuestions.map((q) => {
      const answer = mockAnswers.find((a) => a.cardid === q.cardid);
      return {
        cardid: q.cardid,
        question: q.question,
        answer: answer?.answer || '',
        questionAudio: q.questionaudio,
        answerAudio: answer?.answeraudio || '',
      };
    });
    setCards(flashCards);
  }, [isSignedIn]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    // Play appropriate audio
    // const audio = isFlipped
    //   ? cards[currentCardIndex].questionAudio
    //   : cards[currentCardIndex].answerAudio;
    // TODO: Implement audio playback
  };

  const handleNext = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const togglePlayMode = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement auto-play functionality
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
          <h1 className="text-2xl font-bold text-gray-900">MyELTS</h1>
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
                <h2 className="text-xl font-semibold">{category.category}</h2>
                <p className="mt-2 text-gray-600">Click to view flashcards</p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-8 flex gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedCategory(null)}
              >
                Back to Categories
              </Button>
              <Button variant="outline" onClick={togglePlayMode}>
                {isPlaying ? (
                  <PauseCircle className="mr-2" />
                ) : (
                  <PlayCircle className="mr-2" />
                )}
                {isPlaying ? 'Pause' : 'Auto Play'}
              </Button>
            </div>

            <Card
              className={`min-h-[400px] w-full max-w-2xl p-8 ${isFlipped ? 'bg-blue-50' : 'bg-white'}`}
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
              <Button variant="outline" onClick={handleFlip}>
                <Rotate3D className="mr-2" />
                Flip
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentCardIndex === cards.length - 1}
              >
                <SkipForward className="mr-2" />
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
