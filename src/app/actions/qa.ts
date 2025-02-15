'use server';

import textToSpeech from '@google-cloud/text-to-speech';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

// GOOGLE_APPLICATION_CREDENTIALSで自動認証、初期化
const ttsClient = new textToSpeech.TextToSpeechClient();

// OpenAI クライアントを初期化、自動認証
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
);

interface QAInput {
  question: string;
  answer: string;
  categoryId: string;
}

interface Word {
  word: string;
  ipa: string;
}

async function generateSpeech(text: string): Promise<string> {
  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Wavenet-D',
      ssmlGender: 'MALE',
    },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 0.8 },
  });

  // 音声データの取得に失敗した場合
  if (!response.audioContent) {
    throw new Error('音声データの取得に失敗しました');
  }

  // 一時ファイルの作成
  const tmpDir = os.tmpdir();
  const fileName = `${uuidv4()}.mp3`; // 一意なファイル名を作成
  const filePath = path.join(tmpDir, fileName); // 一時ファイルパス

  // 一時ファイルに MP3 データを書き込み
  await fs.writeFile(filePath, response.audioContent as Uint8Array, 'binary');

  // Supabase Storage に MP3 をアップロード
  const fileBuffer = await fs.readFile(filePath);
  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET_NAME!)
    .upload(`tts/${fileName}`, fileBuffer, {
      contentType: 'audio/mpeg', // MP3 ファイル
    });

  // 一時ファイルを削除（不要なメモリ消費を防ぐ）
  await fs.unlink(filePath);

  // エラーハンドリング
  if (error) {
    console.error('Supabase へのアップロードエラー:', error);
    throw new Error('Supabase に保存できませんでした');
  }

  // 保存した音声ファイルの公開 URL を作成
  const audioUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET_NAME}/tts/${fileName}`;

  return audioUrl;
}

async function analyzeWords(text: string): Promise<Word[]> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [
      {
        role: 'system',
        content:
          'Extract CEFR B1 or higher level words from the user content and provide their American English pronunciations in IPA format. Return as JSON array with "word" and "ipa" properties.',
      },
      { role: 'user', content: text },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  return result.words || [];
}

export async function registerQA({ question, answer, categoryId }: QAInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  if (!question || !answer || !categoryId) {
    throw new Error('All fields are required');
  }
  console.log(userId);

  // Generate audio for question and answer
  const [questionAudio, answerAudio, words] = await Promise.all([
    generateSpeech(question),
    generateSpeech(answer),
    analyzeWords(answer),
  ]);
  console.log(questionAudio);
  console.log(answerAudio);
  console.log(words);

  // Insert card
  const { data: card } = await supabase
    .from('cards')
    .insert({
      userid: userId,
      categoryid: categoryId,
    })
    .select()
    .single();

  if (!card) throw new Error('Failed to create card');

  // Insert question
  const { data: questionRecord } = await supabase
    .from('questions')
    .insert({
      cardid: card.cardid,
      question: question,
      questionaudio: questionAudio,
    })
    .select()
    .single();

  // Insert answer
  const { data: answerRecord } = await supabase
    .from('answers')
    .insert({
      cardid: card.cardid,
      answer: answer,
      answeraudio: answerAudio,
    })
    .select()
    .single();

  if (!answerRecord) throw new Error('Failed to create answer');

  // Insert words
  if (words.length > 0) {
    await supabase.from('words').insert(
      words.map((word) => ({
        answerid: answerRecord.answerid,
        word: word.word,
        ipa: word.ipa,
      })),
    );
  }

  return { success: true };
}
