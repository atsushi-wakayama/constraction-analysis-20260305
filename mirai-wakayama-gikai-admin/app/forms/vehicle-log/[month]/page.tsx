import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveYear } from "@/lib/active-year";
import { listVehicleTripsByYearMonth } from "@/lib/storage";
import { VehicleLogEditor } from "@/components/vehicle-log-editor";
import { PageHeader } from "@/components/ui";
import { regeneratePaymentCertsAction, saveVehicleTripsAction } from "../actions";

export const dynamic = "force-dynamic";

const FISCAL_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

type Props = { params: Promise<{ month: string }> };

export default async function VehicleLogMonthPage({ params }: Props) {
  const { month: monthStr } = await params;
  const month = Number(monthStr);
  if (!FISCAL_MONTHS.includes(month)) notFound();
  const year = await getActiveYear();
  const trips = await listVehicleTripsByYearMonth(year, month);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/vehicle-log", label: "自家用自動車使用簿" },
          { href: `/forms/vehicle-log/${month}`, label: `${month}月` },
        ]}
        title={
          <>
            <span className="font-display mirai-gradient-text">{year}</span>
            <span className="text-xl mx-1">年度</span>
            <span className="font-display mirai-gradient-text ml-1">{month}</span>
            <span className="text-xl ml-1">月</span>
          </>
        }
        description="日次の走行距離を入力。充当額は km×20円 で自動計算され、月単位で支払証明書を再生成できます。"
        actions={
          <div className="flex items-center gap-1 flex-wrap">
            {FISCAL_MONTHS.map((m) => (
              <Link
                key={m}
                href={`/forms/vehicle-log/${m}`}
                className={
                  m === month
                    ? "btn btn-primary btn-sm"
                    : "btn btn-secondary btn-sm"
                }
              >
                {m}
              </Link>
            ))}
          </div>
        }
      />

      <VehicleLogEditor
        key={`${year}-${month}`}
        initial={trips}
        fiscalYear={year}
        month={month}
        saveAction={saveVehicleTripsAction}
        regenAction={regeneratePaymentCertsAction}
      />
    </div>
  );
}
