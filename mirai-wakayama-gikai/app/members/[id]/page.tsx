import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Crown,
  Sparkles,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { members, type Member, type ActivityItem } from "@/data/mock";

export function generateStaticParams() {
  return members.map((m) => ({ id: m.id }));
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const member = members.find((m) => m.id === id);
  if (!member) return { title: "議員が見つかりません" };
  return {
    title: `${member.name}（${member.district}） | みらいのわかやま県議会`,
    description: `${member.name}議員（${member.party}・${member.age}歳）の基本情報・発言傾向・活動サマリー。`,
  };
}

const activityTypeStyle: Record<ActivityItem["type"], string> = {
  発言: "bg-slate-100 text-slate-700",
  質問: "bg-wakayama-orange/15 text-wakayama-orange-dark",
  討論: "bg-wakayama-blue/15 text-wakayama-blue-dark",
  委員長報告: "bg-emerald-100 text-emerald-700",
};

function formatJpDate(iso: string) {
  const d = new Date(iso);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${weekday})`;
}

// 決定論的な疑似乱数（議員ごとに安定した配置にする）
function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hashString(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function WordCloud({
  tags,
  seed,
}: {
  tags: Member["tags"];
  seed: string;
}) {
  const sorted = [...tags].sort((a, b) => b.weight - a.weight);
  const maxW = Math.max(...sorted.map((t) => t.weight));
  const minW = Math.min(...sorted.map((t) => t.weight));
  const span = Math.max(1, maxW - minW);
  const rand = seededRand(hashString(seed));

  // 配色：ウエイト順に和歌山カラーのパレットから循環
  const palette = [
    "text-wakayama-orange-dark",
    "text-wakayama-blue-dark",
    "text-emerald-700",
    "text-rose-700",
    "text-amber-700",
    "text-indigo-700",
    "text-teal-700",
    "text-fuchsia-700",
  ];

  return (
    <div className="relative min-h-[220px] w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 py-4 leading-none">
      {sorted.map((t, i) => {
        const norm = (t.weight - minW) / span; // 0..1
        // 大きさ: 大ウエイトは 2.8rem まで、小は 0.95rem
        const fontSize = 0.95 + norm * 1.85;
        // 重要度で太さ
        const weightClass =
          norm > 0.7
            ? "font-black"
            : norm > 0.4
              ? "font-extrabold"
              : "font-semibold";
        // 軽い回転で雲感を出す（決定論的）
        const rot = (rand() - 0.5) * 10;
        // 垂直方向のブレ
        const ty = (rand() - 0.5) * 4;
        const color = palette[i % palette.length];
        return (
          <span
            key={t.label}
            className={`whitespace-nowrap tracking-tight ${weightClass} ${color}`}
            style={{
              fontSize: `${fontSize}rem`,
              transform: `translateY(${ty}px) rotate(${rot}deg)`,
              textShadow: "0 1px 0 rgba(255,255,255,0.6)",
              lineHeight: 1.05,
            }}
          >
            {t.label}
          </span>
        );
      })}
    </div>
  );
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const member = members.find((m) => m.id === id);
  if (!member) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <Link
        href="/members"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-wakayama-orange"
      >
        <ArrowLeft size={14} /> 議員一覧に戻る
      </Link>

      {/* Profile header */}
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={member.photoUrl}
            alt={member.name}
            className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-white ring-2 ring-slate-100 object-cover bg-slate-50 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {member.role && (
                <Badge variant="default" className="gap-1">
                  <Crown size={11} /> {member.role}
                </Badge>
              )}
              <Badge variant="secondary">{member.party}</Badge>
              <Badge variant="outline">{member.age}歳</Badge>
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {member.name}
            </h1>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-wakayama-orange" />
                <span>
                  選挙区：
                  <span className="font-semibold">{member.district}</span>
                </span>
              </div>
              {member.office && (
                <>
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <MapPin size={14} className="mt-0.5 text-slate-400" />
                    <span className="text-slate-600">
                      事務所：{member.office.area}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <a
                      href={`tel:${member.office.phone.replace(/-/g, "")}`}
                      className="text-wakayama-blue hover:underline"
                    >
                      {member.office.phone}
                    </a>
                  </div>
                </>
              )}
            </div>

            {member.bio && (
              <p className="mt-4 text-sm text-slate-600 leading-relaxed border-l-2 border-wakayama-orange/60 pl-3">
                {member.bio}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Data disclaimer */}
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 flex items-start gap-2">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <p>
          基本情報（氏名・年齢・選挙区・会派・事務所）は和歌山県議会議員名簿（令和8年4月1日現在）に基づく公開情報です。
          <strong>注力テーマ ワードクラウド／活動要約は、公開議事録をAI分析することを想定したサンプルデモデータ</strong>
          であり、実際の発言内容とは一致しません。
        </p>
      </div>

      {/* 注力テーマ ワードクラウド */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-wakayama-orange" />
              注力テーマ ワードクラウド（サンプル）
            </CardTitle>
            <CardDescription>
              この議員がどんな話題を取り上げているかを、大きさ・太さで視覚化（デモ）。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-wakayama-blue-soft/40 ring-1 ring-slate-200/70">
              <WordCloud tags={member.tags} seed={member.id} />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activities */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={18} className="text-wakayama-blue-dark" />
          <h2 className="text-xl font-bold text-slate-900">
            活動サマリー（サンプルAI要約）
          </h2>
        </div>
        <ol className="relative border-l-2 border-slate-200 ml-2 space-y-5">
          {member.activities.map((a) => (
            <li key={a.date + a.title} className="pl-6 relative">
              <span className="absolute -left-[9px] top-3 h-4 w-4 rounded-full border-2 border-white ring-2 ring-wakayama-orange/60 bg-wakayama-orange" />
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-900">
                    {formatJpDate(a.date)}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-700">{a.venue}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${activityTypeStyle[a.type]}`}
                  >
                    {a.type}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {a.title}
                </p>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                  {a.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[11px] text-slate-400">
          ※ 本セクションはサンプルデータです。実運用時は議事録検索システムにリンクします。
        </p>
      </section>
    </div>
  );
}
