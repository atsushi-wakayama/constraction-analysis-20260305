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

      {/* 注力テーマ ハッシュタグ */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-wakayama-orange" />
              注力テーマ（サンプル）
            </CardTitle>
            <CardDescription>
              この議員がよく取り上げる話題のハッシュタグ（デモ）。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {[...member.tags]
                .sort((a, b) => b.weight - a.weight)
                .map((t) => (
                  <li
                    key={t.label}
                    className="inline-flex items-center rounded-full bg-wakayama-blue-soft/60 px-3 py-1 text-sm font-semibold text-wakayama-blue-dark ring-1 ring-wakayama-blue/20"
                  >
                    #{t.label}
                  </li>
                ))}
            </ul>
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
