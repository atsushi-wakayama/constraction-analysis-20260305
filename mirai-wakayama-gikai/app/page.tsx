import Link from "next/link";
import {
  CalendarDays,
  Radio,
  FileText,
  ExternalLink,
  ArrowRight,
  PieChart as PieChartIcon,
  BarChart3,
  Users,
  Sparkles,
  Newspaper,
  ChevronDown,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BudgetPieChart } from "@/components/charts/budget-pie-chart";
import { PriorityBarChart } from "@/components/charts/priority-bar-chart";
import {
  assemblyStatus,
  schedule,
  budgetPicks,
  budgetBreakdown,
  priorityPolicies,
  recentMovements,
} from "@/data/mock";

const categoryColor: Record<string, string> = {
  本会議: "bg-wakayama-orange",
  常任委員会: "bg-wakayama-blue",
  特別委員会: "bg-wakayama-green",
  議会運営委員会: "bg-slate-500",
  その他: "bg-slate-400",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return {
    month: d.getMonth() + 1,
    day: d.getDate(),
    weekday,
  };
}

export default function HomePage() {
  const totalBudget = budgetBreakdown.reduce((s, b) => s + b.value, 0);

  const isInSession = assemblyStatus.status === "in_session";
  const statusLabel =
    assemblyStatus.status === "in_session"
      ? "ただいま 本会議中"
      : assemblyStatus.status === "recess"
      ? "休会中"
      : "閉会中";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-grid-faint opacity-60" aria-hidden />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-wakayama-orange/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-wakayama-blue/10 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {isInSession ? (
              <Badge variant="live" className="gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                {statusLabel}
              </Badge>
            ) : (
              <Badge variant="muted">{statusLabel}</Badge>
            )}
            <Badge variant="outline">直近：{assemblyStatus.sessionName}</Badge>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
            和歌山県議会を、<br className="sm:hidden" />
            <span className="text-wakayama-orange">みんなのもの</span>に。
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            議会の日程、予算の使い道、議員一人ひとりの活動を
            やさしく可視化するシビックテック・ポータル。
            県民の暮らしに直結する議論を、スマホからでも追いかけられます。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/members"
              className="inline-flex items-center gap-2 rounded-md bg-wakayama-orange px-6 h-11 text-sm font-semibold text-white hover:bg-wakayama-orange/90 shadow-sm transition-colors"
            >
              <Users size={16} />
              議員を探す（41名）
              <ArrowRight size={16} />
            </Link>
            <a
              href={assemblyStatus.liveStreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-6 h-11 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Radio size={16} />
              議会中継・会議録
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Status cards */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold text-slate-500">会期ステータス</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {assemblyStatus.term}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold text-slate-500">次回</p>
              <p className="mt-1 text-sm font-semibold text-wakayama-orange">
                {assemblyStatus.todayAgenda}
              </p>
            </div>
            <div className="rounded-xl border border-wakayama-blue/30 bg-wakayama-blue-soft p-5">
              <p className="text-xs font-semibold text-wakayama-blue-dark">
                直近の審議概要
              </p>
              <p className="mt-1 text-sm text-slate-800 leading-relaxed">
                {assemblyStatus.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent movements */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-wakayama-blue-dark">
            <Newspaper size={18} />
            <p className="text-sm font-semibold tracking-wider uppercase">
              Recent Movements
            </p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            県政の最近の動き
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            令和8年2月定例会 知事説明要旨より、県政トピックスをピックアップ。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentMovements.map((n) => (
            <Card key={n.title} className="flex flex-col">
              <CardHeader className="pb-2">
                <Badge variant="secondary" className="w-fit">
                  {n.category}
                </Badge>
                <CardTitle className="text-base leading-snug mt-2">
                  {n.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {n.summary}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Schedule timeline */}
      <section
        id="schedule"
        className="bg-white border-y border-slate-200"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-wakayama-blue-dark">
                <CalendarDays size={18} />
                <p className="text-sm font-semibold tracking-wider uppercase">
                  Schedule
                </p>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                議会日程
              </h2>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              令和8年2月定例会の振り返り＋次回予定
            </p>
          </div>

          {(() => {
            const PREVIEW_COUNT = 3;
            const previewItems = schedule.slice(0, PREVIEW_COUNT);
            const restItems = schedule.slice(PREVIEW_COUNT);
            const renderItem = (item: (typeof schedule)[number]) => {
              const d = formatDate(item.date);
              const color = categoryColor[item.category] ?? "bg-slate-400";
              return (
                <li key={item.date + item.title} className="pl-6 relative">
                  <span
                    className={`absolute -left-[9px] top-2 h-4 w-4 rounded-full border-2 border-white ring-2 ${
                      item.isToday
                        ? "ring-wakayama-orange"
                        : item.past
                          ? "ring-slate-200"
                          : "ring-slate-300"
                    } ${item.past ? "bg-slate-300" : color}`}
                  />
                  <div
                    className={`rounded-xl border p-4 sm:p-5 transition-colors ${
                      item.isToday
                        ? "border-wakayama-orange/40 bg-wakayama-orange-soft"
                        : item.past
                          ? "border-slate-200 bg-slate-50/70"
                          : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {d.month}月{d.day}日
                            <span className="text-xs font-medium text-slate-500 ml-1">
                              ({d.weekday})
                            </span>
                          </span>
                          <Badge
                            variant={
                              item.category === "本会議"
                                ? "default"
                                : item.category === "常任委員会"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {item.category}
                          </Badge>
                          {item.isToday && <Badge variant="live">本日</Badge>}
                          {item.past && !item.isToday && (
                            <Badge variant="muted">済</Badge>
                          )}
                        </div>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            };

            return (
              <>
                <ol className="relative border-l-2 border-slate-200 ml-2 space-y-5">
                  {previewItems.map(renderItem)}
                </ol>

                {restItems.length > 0 && (
                  <details className="group mt-5">
                    <summary className="list-none cursor-pointer inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 text-sm font-semibold text-slate-700 hover:border-wakayama-orange hover:text-wakayama-orange-dark transition-colors select-none">
                      <ChevronDown
                        size={16}
                        className="transition-transform group-open:rotate-180"
                      />
                      <span className="group-open:hidden">
                        残り{restItems.length}件の日程を表示
                      </span>
                      <span className="hidden group-open:inline">
                        折りたたむ
                      </span>
                    </summary>
                    <ol className="relative border-l-2 border-slate-200 ml-2 mt-5 space-y-5">
                      {restItems.map(renderItem)}
                    </ol>
                  </details>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {/* Budget picks */}
      <section id="budget" className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-wakayama-orange-dark">
            <Sparkles size={18} />
            <p className="text-sm font-semibold tracking-wider uppercase">
              Budget Pickup
            </p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            令和8年度当初予算 6本の政策の柱
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            新総合計画の初年度予算。一般会計 6,499億円（対前年度+360億円、当初予算として過去最大規模）のうち、新総合計画で掲げる6本の政策の柱を紹介します。
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {budgetPicks.map((pick) => (
            <Card
              key={pick.id}
              className="flex flex-col hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <Badge variant="default" className="w-fit mb-2">
                  {pick.category}
                </Badge>
                <CardTitle className="text-lg leading-snug">
                  {pick.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <CardDescription className="text-slate-700 leading-relaxed">
                  {pick.summary}
                </CardDescription>
                <ul className="mt-4 space-y-1.5">
                  {pick.highlights.map((h) => (
                    <li
                      key={h}
                      className="text-xs text-slate-600 flex items-start gap-2"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-wakayama-orange" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <a
                  href={pick.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-wakayama-blue hover:text-wakayama-blue-dark"
                >
                  <FileText size={14} />
                  議案・関連資料を見る
                  <ExternalLink size={12} />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Infographics */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-wakayama-blue-dark">
              <PieChartIcon size={18} />
              <p className="text-sm font-semibold tracking-wider uppercase">
                Infographic
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              予算のゆくえ / 重点施策
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              知事の提案理由説明から、予算の使い道と重点施策を可視化しました。
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon size={18} className="text-wakayama-orange" />
                  一般会計 歳出の内訳
                </CardTitle>
                <CardDescription>
                  人件費・公債費・投資的経費・社会保障関係経費ほか（億円）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetPieChart data={budgetBreakdown} />
                <p className="text-center text-sm text-slate-600 mt-2">
                  令和8年度 一般会計{" "}
                  <span className="font-bold text-slate-900">
                    {totalBudget.toLocaleString()}
                  </span>{" "}
                  億円
                  <span className="block text-[11px] text-slate-400 mt-1">
                    ※ 令和8年度当初予算（案）の概要より
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-wakayama-orange" />
                  政策の柱別 配分イメージ
                </CardTitle>
                <CardDescription>
                  新総合計画「6本の柱」の配分イメージ（億円・概算）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PriorityBarChart data={priorityPolicies} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
