import type { ActivityRecord } from "@/lib/types";

function fmtYen(n: number) {
  return n ? n.toLocaleString("ja-JP") : "";
}

export function ActivityRecordPrintView({ rec }: { rec: ActivityRecord }) {
  const totalSum = rec.expenses.reduce((s, e) => s + (e.totalYen || 0), 0);
  const allocSum = rec.expenses.reduce((s, e) => s + (e.allocatedYen || 0), 0);

  return (
    <div className="print-page bg-white text-black mx-auto" style={{ width: "190mm", padding: "4mm 0" }}>
      <div className="text-xs">参考様式4</div>
      <h1 className="text-center text-2xl font-bold tracking-[0.4em] my-2">活 動 記 録 簿</h1>
      <div className="text-sm mb-2">
        会派（議員）名
        <span className="border-b border-black px-2">{rec.factionMemberName}</span>
      </div>
      <table className="w-full border-collapse text-xs">
        <tbody>
          <tr>
            <th className="border border-black px-2 py-1 w-28 bg-gray-50 align-top">実施日</th>
            <td className="border border-black px-2 py-1 whitespace-pre-wrap">{rec.implementationDate}</td>
          </tr>
          <tr>
            <th className="border border-black px-2 py-1 bg-gray-50 align-top">実施場所</th>
            <td className="border border-black px-2 py-1 whitespace-pre-wrap">{rec.location}</td>
          </tr>
          <tr>
            <th className="border border-black px-2 py-1 bg-gray-50 align-top">参加者又は対象者</th>
            <td className="border border-black px-2 py-1 whitespace-pre-wrap">{rec.participants}</td>
          </tr>
          <tr>
            <th className="border border-black px-2 py-1 bg-gray-50 align-top">目的、内容及び結果等</th>
            <td className="border border-black px-2 py-1 whitespace-pre-wrap leading-relaxed">{rec.purposeContent}</td>
          </tr>
          <tr>
            <th className="border border-black px-2 py-1 bg-gray-50 align-top">活動に要した支出</th>
            <td className="border border-black p-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-black px-1 py-1 w-20">経費の種別</th>
                    <th className="border border-black px-1 py-1">主な支出内容</th>
                    <th className="border border-black px-1 py-1 w-20">総経費</th>
                    <th className="border border-black px-1 py-1 w-24">政務活動対象経費</th>
                    <th className="border border-black px-1 py-1 w-20">備考</th>
                  </tr>
                </thead>
                <tbody>
                  {rec.expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="border border-black px-1 py-1 align-top">{e.category}</td>
                      <td className="border border-black px-1 py-1 align-top whitespace-pre-wrap">{e.description}</td>
                      <td className="border border-black px-1 py-1 align-top text-right">{fmtYen(e.totalYen)}</td>
                      <td className="border border-black px-1 py-1 align-top text-right">{fmtYen(e.allocatedYen)}</td>
                      <td className="border border-black px-1 py-1 align-top">{e.note}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} className="border border-black px-1 py-1 text-right font-medium">計</td>
                    <td className="border border-black px-1 py-1 text-right">{fmtYen(totalSum)}</td>
                    <td className="border border-black px-1 py-1 text-right">{fmtYen(allocSum)}</td>
                    <td className="border border-black px-1 py-1"></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs mt-2">注 政務活動以外の活動を含む場合は、備考欄に按分率等を記載してください。</p>
    </div>
  );
}
