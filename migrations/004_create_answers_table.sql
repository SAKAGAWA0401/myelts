CREATE TABLE IF NOT EXISTS answers (
  answerid uuid PRIMARY KEY DEFAULT gen_random_uuid(),   -- サーバー側で設定する場合も、デフォルト値として利用可能
  cardid uuid NOT NULL,           -- card テーブルの参照
  answer text NOT NULL,           -- 例: "Right now, I’m actually neither working nor studying. Until March, I was in Australia on a working holiday, and now I’m in the process of job hunting. Before going to Australia, I worked as an IT consultant."
  answeraudio text,              -- Supabase Storage に保存されたMP3のURL
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_card_answer
    FOREIGN KEY (cardid)
    REFERENCES cards(cardid)
    ON DELETE CASCADE
);