import fs from 'fs';
import path from 'path';
import os from 'os';

export function setupGoogleCredentials() {
  if (!process.env.SERVICE_ACCOUNT_JSON) {
    throw new Error('Missing SERVICE_ACCOUNT_JSON environment variable.');
  }

  // OS に応じた一時ディレクトリを設定
  const tempDir = os.tmpdir(); // Windows でも macOS でも適切なパスを取得
  const tempFilePath = path.join(tempDir, 'service-account.json');

  // すでにファイルが存在する場合はスキップ
  if (fs.existsSync(tempFilePath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempFilePath;
    return;
  }

  // 環境変数の Base64 をデコードして JSON に戻す
  const decodedJson = Buffer.from(
    process.env.SERVICE_ACCOUNT_JSON,
    'base64',
  ).toString('utf-8');

  // `/tmp/service-account.json` に書き込む
  fs.writeFileSync(tempFilePath, decodedJson);

  // Google Cloud SDK にファイルのパスを設定
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tempFilePath;
}
