import type { PaymentCertificate, PaymentEntry } from "@/lib/types";

const ROWS_PER_PAGE = 12;

function chunk<T>(arr: T[], n: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${y}年${Number(m)}月${Number(day)}日`;
}

function fmtYen(n: number) {
  return n ? n.toLocaleString("ja-JP") : "";
}

function PrintPage({
  cert,
  rows,
  pageIndex,
  totalPages,
}: {
  cert: PaymentCertificate;
  rows: PaymentEntry[];
  pageIndex: number;
  totalPages: number;
}) {
  return (
    <div className="print-page bg-white text-black mx-auto" style={{ width: "190mm", padding: "4mm 0" }}>
      <div className="text-xs">別記第7号様式(第5条関係)</div>
      <h1 className="text-center text-2xl font-bold tracking-widest my-2">支払証明書</h1>
      <div className="flex items-center justify-between text-sm mb-2">
        <div>
          経費の種別
          <span className="border-b border-black px-2">{cert.category}</span>
        </div>
        <div>
          ({totalPages}枚中 {pageIndex + 1}枚目)
        </div>
      </div>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-black px-1 py-1 w-24">支払年月日</th>
            <th className="border border-black px-1 py-1 w-20">支払総額(円)</th>
            <th className="border border-black px-1 py-1 w-24">支払先</th>
            <th className="border border-black px-1 py-1">支払内容</th>
            <th className="border border-black px-1 py-1 w-24">政務活動費充当額(円)</th>
            <th className="border border-black px-1 py-1 w-24">備考(按分率等)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id}>
              <td className="border border-black px-1 py-1 align-top">{fmtDate(e.date)}</td>
              <td className="border border-black px-1 py-1 align-top text-right">{fmtYen(e.totalYen)}</td>
              <td className="border border-black px-1 py-1 align-top">{e.payee}</td>
              <td className="border border-black px-1 py-1 align-top whitespace-pre-wrap">{e.description}</td>
              <td className="border border-black px-1 py-1 align-top text-right">{fmtYen(e.allocatedYen)}</td>
              <td className="border border-black px-1 py-1 align-top">{e.note}</td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, ROWS_PER_PAGE - rows.length) }).map((_, i) => (
            <tr key={`pad-${i}`}>
              <td className="border border-black px-1 py-3">&nbsp;</td>
              <td className="border border-black px-1 py-3"></td>
              <td className="border border-black px-1 py-3"></td>
              <td className="border border-black px-1 py-3"></td>
              <td className="border border-black px-1 py-3"></td>
              <td className="border border-black px-1 py-3"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {pageIndex === totalPages - 1 && (
        <div className="text-sm mt-3 space-y-1">
          <div>　上記のとおり相違ないことを証明します。</div>
          <div className="text-right">{fmtDate(cert.certifiedDate)}</div>
          <div>氏名　　　{cert.signerName}</div>
          <div>会派名　　{cert.factionName}</div>
          <div>代表者名　{cert.representativeName}</div>
          <div className="text-xs mt-2">
            注1　経費の種別欄は、該当するものを○で囲むこと。
            <br />
            　2　一部充当又は按分の場合は、備考欄に按分率等を記載すること。
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentPrintView({ cert }: { cert: PaymentCertificate }) {
  const pages = chunk(cert.entries, ROWS_PER_PAGE);
  return (
    <div className="space-y-6">
      {pages.map((rows, i) => (
        <PrintPage key={i} cert={cert} rows={rows} pageIndex={i} totalPages={pages.length} />
      ))}
    </div>
  );
}
