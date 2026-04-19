import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-sm text-slate-600">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            <p className="font-bold text-slate-900">みらいのわかやま県議会</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 max-w-sm">
              本サイトはシビックテックのプロトタイプです。掲載情報はダミーデータであり、
              和歌山県・県議会・議員個人とは一切関係ありません。
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
