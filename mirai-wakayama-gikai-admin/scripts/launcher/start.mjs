#!/usr/bin/env node
/**
 * 配布版アプリのランチャー。
 * 1) .env.local が無ければ自動生成
 * 2) Next.js standalone server を起動 (port 3001)
 * 3) 数秒後に既定ブラウザで http://localhost:3001 を開く
 */
import { spawn } from "node:child_process";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname);
process.chdir(APP_DIR);

const PORT = process.env.PORT || "3001";
const URL = `http://localhost:${PORT}`;

// 0) data ディレクトリ作成
mkdirSync("data", { recursive: true });
mkdirSync("data/receipt-images", { recursive: true });

// 1) .env.local 自動生成（初回のみ）
if (!existsSync(".env.local")) {
  const sessionSecret = randomBytes(32).toString("hex");
  writeFileSync(
    ".env.local",
    [
      "# 政務活動費 管理ツール ベータ版 - 設定ファイル",
      "# パスワードを変更したい場合は ADMIN_PASSWORD の値を編集して保存してください",
      "ADMIN_PASSWORD=beta1234",
      `SESSION_SECRET=${sessionSecret}`,
      "",
      "# Google Drive 連携を使う場合のみ設定（任意）",
      "# GOOGLE_CLIENT_ID=",
      "# GOOGLE_CLIENT_SECRET=",
      "# GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback",
      "# GOOGLE_DRIVE_FOLDER_ID=",
    ].join("\n"),
    "utf8",
  );
  console.log("✓ .env.local を作成しました（初回起動）");
  console.log("  パスワード: beta1234");
}

// 2) サーバ起動 (next standalone)
console.log("\n=================================================");
console.log("  政務活動費 管理ツール ベータ版");
console.log("  起動中...");
console.log("=================================================\n");

const server = spawn(process.execPath, ["server.js"], {
  stdio: "inherit",
  env: { ...process.env, PORT, HOSTNAME: "127.0.0.1" },
});

// 3) ブラウザ起動 (3秒後)
setTimeout(() => {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
      ? "cmd"
      : "xdg-open";
  const args =
    process.platform === "win32" ? ["/c", "start", "", URL] : [URL];
  spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();

  console.log("\n=================================================");
  console.log(`  ✓ ブラウザを開きました: ${URL}`);
  console.log("  パスワード: beta1234 (.env.local で変更可能)");
  console.log("");
  console.log("  終了するには、このウィンドウを閉じてください");
  console.log("=================================================\n");
}, 3000);

// 終了処理
const cleanup = () => {
  server.kill("SIGTERM");
  process.exit(0);
};
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
server.on("exit", (code) => process.exit(code ?? 0));
