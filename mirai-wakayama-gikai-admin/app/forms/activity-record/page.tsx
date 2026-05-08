import { listActivitiesByYear } from "@/lib/storage";
import { getActiveYear } from "@/lib/active-year";
import { CombinedActivityEditor } from "@/components/combined-activity-editor";
import { PageHeader } from "@/components/ui";
import { saveAllActivitiesAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CombinedActivityPage() {
  const year = await getActiveYear();
  const records = await listActivitiesByYear(year);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/activity-record", label: "活動記録簿" },
        ]}
        title={
          <>
            活動記録簿
            <span className="font-display mirai-gradient-text ml-2">{year}</span>
            <span className="text-xl ml-1">年度</span>
          </>
        }
        description={`参考様式4 ・ ${year}/4〜${year + 1}/3 の記録 全 ${records.length}件。編集後「全記録を保存」で当年度のみ上書きされます。`}
      />
      <CombinedActivityEditor
        key={year}
        initial={records}
        fiscalYear={year}
        action={saveAllActivitiesAction}
      />
    </div>
  );
}
