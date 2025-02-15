'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { registerCategory } from '@/app/actions/category';

export default function CategoryRegister() {
  const [part, setPart] = useState('');
  const [theme, setTheme] = useState('');
  const [period, setPeriod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await registerCategory({ part, theme, period });
      // Reset form
      setPart('');
      setTheme('');
      setPeriod('');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to register category',
      );
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-2xl font-bold text-gray-900">
              Category Register
            </h1>
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mx-auto w-full max-w-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="part"
                  className="block text-sm font-medium text-gray-700"
                >
                  Part
                </label>
                <input
                  id="part"
                  type="text"
                  value={part}
                  onChange={(e) => setPart(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="theme"
                  className="block text-sm font-medium text-gray-700"
                >
                  Theme
                </label>
                <input
                  id="theme"
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="period"
                  className="block text-sm font-medium text-gray-700"
                >
                  Period
                </label>
                <input
                  id="period"
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !part || !theme || !period}
            >
              {isSubmitting ? 'Registering...' : 'Register Category'}
            </Button>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </form>
        </Card>
      </main>
    </div>
  );
}
