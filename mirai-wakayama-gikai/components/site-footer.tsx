import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-10">
        <div
          role="alert"
          className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 sm:p-5 flex items-start gap-3"
        >
          <AlertTriangle
            size={22}
            className="shrink-0 text-amber-600 mt-0.5"
          />
          <div className="text-sm leading-relaxed text-amber-900">
            <p className="font-bold text-base">
              ⚠️ ダミーデータに関するご注意
            </p>
            <p className="mt-1.5">
              本サイトは<strong>シビックテックのプロトタイプ</strong>です。掲載情報は<strong>すべてダミーデータ</strong>であり、
              <strong>和歌山県・和歌山県議会・議員個人とは一切関係ありません。</strong>
              実際の議会活動・発言内容を表すものではないため、ご利用の際はその点を十分ご理解ください。
            </p>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-sm text-slate-600">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            <p className="font-bold text-slate-900">みらいのわかやま県議会</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 max-w-sm">
              シビックテック×AIによる議会可視化プロトタイプ。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-semibold text-slate-900 mb-2">探す</p>
              <ul className="space-y-1.5">
                <li>
                  <Link
                    href="/members"
                    className="hover:text-wakayama-orange"
                  >
                    議員一覧
                  </Link>
                </li>
                <li>議会日程</li>
                <li>予算審議</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-2">公式情報</p>
              <ul className="space-y-1.5">
                <li>和歌山県議会 公式</li>
                <li>議会中継</li>
                <li>会議録検索</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
          © 2026 みらいのわかやま県議会 Project (prototype)
        </div>
      </div>
    </footer>
  );
}
