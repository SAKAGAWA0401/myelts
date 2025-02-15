CREATE TABLE IF NOT EXISTS cards (
  cardid uuid PRIMARY KEY DEFAULT gen_random_uuid(),  -- サーバー処理内で設定する場合も、デフォルト値として利用可能
  userid text NOT NULL,         -- Clerkで認証したユーザーのID（文字列として保存）
  categoryid uuid,              -- category テーブルの参照。NULLを許容する。
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_category
    FOREIGN KEY (categoryid)
    REFERENCES categories(categoryid)
    ON DELETE SET NULL         -- カテゴリが削除された場合、card.categoryidをNULLにする
);