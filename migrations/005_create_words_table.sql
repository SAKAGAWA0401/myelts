CREATE TABLE IF NOT EXISTS words (
  wordid uuid PRIMARY KEY DEFAULT gen_random_uuid(),  -- サーバー側またはDB側で設定可能
  answerid uuid NOT NULL,         -- answer テーブルの参照（answerのform入力から単語を抽出するため）
  word text NOT NULL,             -- 単語、例: "actually"
  ipa text NOT NULL,              -- 発音記号、例: "/ˈæk.tʃu.əli/"
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_answer_word
    FOREIGN KEY (answerid)
    REFERENCES answers(answerid)
    ON DELETE CASCADE
);