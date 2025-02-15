CREATE TABLE IF NOT EXISTS questions (
  questionid uuid PRIMARY KEY DEFAULT gen_random_uuid(),  -- サーバー側で設定する場合も、デフォルト値として利用可能
  cardid uuid NOT NULL,          -- card テーブルの参照
  question text NOT NULL,        -- 例: "Do you work or are you a student?"
  questionaudio text,            -- Supabase Storage に保存されたMP3のURL
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_card_question
    FOREIGN KEY (cardid)
    REFERENCES cards(cardid)
    ON DELETE CASCADE
);