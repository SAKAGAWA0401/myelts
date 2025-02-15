'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Link from 'next/link';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { registerQA } from '@/app/actions/qa';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface CategoryItem {
  categoryid: string;
  part: string;
  theme: string;
  period: string;
}

export default function QARegister() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CategoryItem[]>([]);
  const [selected, setSelected] = useState<CategoryItem | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const queryText = query.trim();
        let queryBuilder = supabase.from('categories').select('*');

        if (queryText) {
          queryBuilder = queryBuilder.or(
            `part.ilike.%${queryText}%,theme.ilike.%${queryText}%,period.ilike.%${queryText}%`,
          );
        }

        const { data, error } = await queryBuilder;
        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setResults([]);
      }
    };

    fetchCategories();
  }, [query]);

  const formatCategory = (item: CategoryItem) =>
    `${item.part} - ${item.theme} - ${item.period}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setIsSubmitting(true);
    try {
      await registerQA({
        question,
        answer,
        categoryId: selected.categoryid,
      });
      // Reset form
      setQuestion('');
      setAnswer('');
      setSelected(null);
      setOpen(false);
    } catch (error) {
      console.error('Failed to register QA:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateInput = (input: string) => {
    return /^[a-zA-Z0-9\s,.?!:;'’"\-]*$/.test(input);
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (validateInput(value)) {
      setQuestion(value);
    }
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (validateInput(value)) {
      setAnswer(value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/">Home</Link>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">QA Register</h1>
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mx-auto w-full max-w-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    {selected
                      ? formatCategory(selected)
                      : 'Search categories...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <div className="flex flex-col">
                    <div className="flex items-center border-b px-3 py-2">
                      <input
                        className="flex h-10 w-full rounded-md bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search categories..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {results.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">
                          No categories found.
                        </div>
                      ) : (
                        results.map((item) => (
                          <div
                            key={item.categoryid}
                            onClick={() => {
                              setSelected(item);
                              setOpen(false);
                            }}
                            className={cn(
                              'flex cursor-pointer items-center justify-between px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                              selected?.categoryid === item.categoryid &&
                                'bg-accent text-accent-foreground',
                            )}
                          >
                            {formatCategory(item)}
                            {selected?.categoryid === item.categoryid && (
                              <Check className="h-4 w-4" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label
                htmlFor="question"
                className="block text-sm font-medium text-gray-700"
              >
                Question
              </label>
              <textarea
                id="question"
                value={question}
                onChange={handleQuestionChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                rows={4}
                required
              />
            </div>

            <div>
              <label
                htmlFor="answer"
                className="block text-sm font-medium text-gray-700"
              >
                Answer
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={handleAnswerChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                rows={6}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !question || !answer}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
