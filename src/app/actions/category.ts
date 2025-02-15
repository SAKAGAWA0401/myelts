'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
);

interface CategoryInput {
  part: string;
  theme: string;
  period: string;
}

export async function registerCategory({ part, theme, period }: CategoryInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  // Check if category already exists
  const { data: existingCategory } = await supabase
    .from('categories')
    .select('categoryid')
    .eq('part', part)
    .eq('theme', theme)
    .eq('period', period)
    .single();

  if (existingCategory) {
    throw new Error('Category already exists');
  }

  // Create new category
  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert({
      part,
      theme,
      period,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create category');
  if (!newCategory) throw new Error('Failed to create category');

  return newCategory;
}
