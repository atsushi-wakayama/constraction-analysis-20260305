"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Users2, Search, X, ArrowRight, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Member } from "@/data/mock";

type AgeBand = "all" | "20-30s" | "40s" | "50s" | "60s" | "70s+";

const ageBands: { value: AgeBand; label: string }[] = [
  { value: "all", label: "すべての年代" },
  { value: "20-30s", label: "20〜30代" },
  { value: "40s", label: "40代" },
  { value: "50s", label: "50代" },
  { value: "60s", label: "60代" },
  { value: "70s+", label: "70代以上" },
];

function inAgeBand(age: number, band: AgeBand) {
  if (band === "all") return true;
  if (band === "20-30s") return age >= 20 && age < 40;
  if (band === "40s") return age >= 40 && age < 50;
  if (band === "50s") return age >= 50 && age < 60;
  if (band === "60s") return age >= 60 && age < 70;
  return age >= 70;
}

type Props = {
  members: Member[];
  parties: string[];
  districts: string[];
};

export function MembersExplorer({ members, parties, districts }: Props) {
  const [query, setQuery] = useState("");
  const [party, setParty] = useState<string>("all");
  const [district, setDistrict] = useState<string>("all");
  const [age, setAge] = useState<AgeBand>("all");

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = query.trim();
      if (q && !m.name.includes(q)) return false;
      if (party !== "all" && m.party !== party) return false;
      if (district !== "all" && m.district !== district) return false;
      if (!inAgeBand(m.age, age)) return false;
      return true;
    });
  }, [members, query, party, district, age]);

  const anyFilter =
    query !== "" || party !== "all" || district !== "all" || age !== "all";

  return (
    <div>
      {/* Filter panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Users2 size={16} className="text-wakayama-blue" />
          <p className="text-sm font-semibold text-slate-900">絞り込み</p>
          {anyFilter && (
            <button
              onClick={() => {
                setQuery("");
                setParty("all");
                setDistrict("all");
                setAge("all");
              }}
              className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 hover:text-wakayama-orange"
            >
              <X size={12} /> クリア
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative">
            <span className="sr-only">氏名で検索</span>
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="氏名を入力"
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm placeholder:text-slate-400 focus:border-wakayama-blue focus:outline-none focus:ring-2 focus:ring-wakayama-blue/20"
            />
          </label>

          <select
            value={party}
            onChange={(e) => setParty(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-wakayama-blue focus:outline-none focus:ring-2 focus:ring-wakayama-blue/20"
          >
            <option value="all">すべての会派</option>
            {parties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-wakayama-blue focus:outline-none focus:ring-2 focus:ring-wakayama-blue/20"
          >
            <option value="all">すべての選挙区</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={age}
            onChange={(e) => setAge(e.target.value as AgeBand)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-wakayama-blue focus:outline-none focus:ring-2 focus:ring-wakayama-blue/20"
          >
            {ageBands.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          該当 <span className="font-bold text-slate-900">{filtered.length}</span> 名 / 全{" "}
          {members.length} 名
        </p>
      </div>

      {/* Member grid */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          条件に合う議員が見つかりませんでした。フィルターを調整してください。
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <Link
              key={m.id}
              href={`/members/${m.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-wakayama-orange/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.photoUrl}
                  alt={m.name}
                  className="h-16 w-16 rounded-full border-2 border-slate-100 object-cover bg-slate-50"
                />
                <div className="flex-1 min-w-0">
                  {m.role && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-wakayama-orange-dark">
                      <Crown size={10} /> {m.role}
                    </span>
                  )}
                  <p className="text-lg font-bold text-slate-900 group-hover:text-wakayama-orange transition-colors leading-tight">
                    {m.name}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                    <MapPin size={11} />
                    <span>{m.district}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{m.party}</Badge>
                <Badge variant="outline">{m.age}歳</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-1">
                {m.tags.slice(0, 3).map((t) => (
                  <span
                    key={t.label}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-wakayama-blue-soft text-wakayama-blue-dark"
                  >
                    #{t.label}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-end gap-1 text-xs font-semibold text-wakayama-blue group-hover:text-wakayama-orange transition-colors">
                詳細を見る <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
