import Link from "next/link";
import { ensureFreshToken, googleConfigured } from "@/lib/google-auth";
import { PageHeader, Pill } from "@/components/ui";
import { GoogleSyncPanel } from "@/components/google-sync-panel";
import {
  backupJsonAction,
  importLedgerXlsxAction,
  syncReceiptsAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function GoogleSyncPage() {
  const configured = googleConfigured();
  const token = configured ? await ensureFreshToken() : null;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID ?? "";

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/google-sync", label: "Google Drive 連携" },
        ]}
        title="Google Drive 連携"
        description="個人のGoogleアカウントでログインし、共有フォルダの領収書を自動取り込み・バックアップします。"
      />

      {!configured && (
        <div className="app-card p-5 bg-[--color-warning-soft] border-[--color-warning]/30">
          <div className="flex items-center gap-2 mb-2">
            <Pill tone="orange">設定が未完了です</Pill>
          </div>
          <p className="text-sm">
            <code className="bg-white/60 px-1 rounded">.env.local</code>{" "}
            に <code>GOOGLE_CLIENT_ID</code> と <code>GOOGLE_CLIENT_SECRET</code>{" "}
            を設定してください。
          </p>
          <ol className="text-xs text-[--color-muted] list-decimal ml-5 mt-2 space-y-1">
            <li>
              <Link
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                className="underline"
              >
                Google Cloud Console
              </Link>{" "}
              で OAuth 2.0 クライアントID（Webアプリ）を作成
            </li>
            <li>
              「承認済みのリダイレクトURI」に{" "}
              <code className="bg-white/60 px-1 rounded">
                http://localhost:3001/api/google/callback
              </code>{" "}
              を追加
            </li>
            <li>
              「OAuth同意画面」で Drive API のスコープ{" "}
              <code className="bg-white/60 px-1 rounded">
                .../auth/drive
              </code>{" "}
              を追加
            </li>
            <li>取得したClient IDとSecretを <code>.env.local</code> に貼り付け、サーバ再起動</li>
          </ol>
        </div>
      )}

      {configured && !token && (
        <div className="app-card p-6 text-center">
          <p className="text-sm text-[--color-muted] mb-4">
            Googleアカウントでログインして、Drive内の書類を取り込みます。
          </p>
          <a href="/api/google/login" className="btn btn-mint">
            Googleでログイン
          </a>
          {folderId && (
            <p className="text-xs text-[--color-faint] mt-3">
              対象フォルダID:{" "}
              <a
                href={`https://drive.google.com/drive/folders/${folderId}`}
                target="_blank"
                className="underline"
              >
                {folderId}
              </a>
            </p>
          )}
        </div>
      )}

      {configured && token && (
        <>
          <div className="app-card p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {token.picture && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={token.picture}
                  alt=""
                  className="w-10 h-10 rounded-full border border-[--color-border]"
                />
              )}
              <div>
                <div className="text-sm font-bold">
                  {token.name ?? "Googleアカウント"}
                </div>
                <div className="text-xs text-[--color-muted]">{token.email}</div>
                <div className="text-[10px] text-[--color-faint] mt-0.5">
                  期限: {new Date(token.expires_at).toLocaleString("ja-JP")}
                </div>
              </div>
            </div>
            <form action="/api/google/logout" method="post">
              <button className="btn btn-secondary btn-sm">Google からログアウト</button>
            </form>
          </div>

          <GoogleSyncPanel
            syncReceipts={syncReceiptsAction}
            backup={backupJsonAction}
            scanXlsx={importLedgerXlsxAction}
          />
        </>
      )}
    </div>
  );
}
