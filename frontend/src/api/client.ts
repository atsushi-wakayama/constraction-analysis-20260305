// 本番環境では VITE_API_URL 環境変数でバックエンドURLを指定する
// 例: https://your-app.onrender.com/api
// 開発時はViteのプロキシ設定(/api → localhost:8000)を使用
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

export interface MunicipalityBudget {
  municipality: string;
  total_budget: number;
  item_count: number;
}

export interface SummaryResponse {
  fiscal_year: number | null;
  municipalities: MunicipalityBudget[];
  grand_total: number;
}

export interface ConstructionItem {
  id: number;
  fiscal_year: number;
  session: string | null;       // 当初/6月補正/9月補正/12月補正
  municipality: string;
  route_name: string | null;
  location: string | null;
  work_type: string | null;
  work_overview: string | null; // 按分注釈
  budget: number;
  department: string | null;
  source_file: string | null;
}

export interface ItemsResponse {
  total: number;
  items: ConstructionItem[];
}

export interface ComparisonData {
  municipality: string;
  budgets: Record<number, number>;
}

export interface ComparisonResponse {
  years: number[];
  data: ComparisonData[];
}

export interface CategoryItem {
  kuan: string;
  total_budget: number;
  item_count: number;
}

export interface DepartmentItem {
  department: string;
  kuan: string;
  total_budget: number;
  item_count: number;
}

export interface CategoriesResponse {
  fiscal_year: number | null;
  departments: DepartmentItem[];
  kuan: CategoryItem[];
}

export interface ProjectItem {
  work_type: string;
  total_budget: number;
  item_count: number;
}

export interface ProjectsResponse {
  fiscal_year: number | null;
  projects: ProjectItem[];
}

export interface UploadResponse {
  success: boolean;
  fiscal_year: number;
  filename: string;
  total_items: number;
  municipality_totals: Record<string, number>;
  total_budget: number;
  warnings: string[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "APIエラー");
  }
  return res.json();
}

export const api = {
  getYears: () => request<{ years: number[] }>("/years"),

  getMunicipalities: () => request<{ municipalities: string[] }>("/municipalities"),

  getSummary: (fiscalYear?: number) =>
    request<SummaryResponse>(
      "/summary" + (fiscalYear ? `?fiscal_year=${fiscalYear}` : "")
    ),

  getComparison: (municipalities?: string[]) => {
    const params = municipalities
      ? "?" + municipalities.map((m) => `municipalities=${encodeURIComponent(m)}`).join("&")
      : "";
    return request<ComparisonResponse>("/comparison" + params);
  },

  getSessions: (fiscalYear?: number) =>
    request<{ sessions: string[] }>(
      "/sessions" + (fiscalYear ? `?fiscal_year=${fiscalYear}` : "")
    ),

  getItems: (params?: {
    fiscal_year?: number;
    municipality?: string;
    session?: string;
    skip?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.fiscal_year) qs.set("fiscal_year", String(params.fiscal_year));
    if (params?.municipality) qs.set("municipality", params.municipality);
    if (params?.session) qs.set("session", params.session);
    if (params?.skip) qs.set("skip", String(params.skip));
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<ItemsResponse>("/items?" + qs.toString());
  },

  uploadPdf: (file: File, fiscalYear?: number) => {
    const form = new FormData();
    form.append("file", file);
    if (fiscalYear) form.append("fiscal_year", String(fiscalYear));
    return request<UploadResponse>("/upload", { method: "POST", body: form });
  },

  getCategories: (fiscalYear?: number) =>
    request<CategoriesResponse>(
      "/categories" + (fiscalYear ? `?fiscal_year=${fiscalYear}` : "")
    ),

  getProjects: (fiscalYear?: number, limit = 15) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (fiscalYear) qs.set("fiscal_year", String(fiscalYear));
    return request<ProjectsResponse>("/projects?" + qs.toString());
  },

  deleteYear: (year: number) =>
    request<{ success: boolean; deleted_count: number }>(
      `/data/${year}`,
      { method: "DELETE" }
    ),

  createItemManual: (item: {
    fiscal_year: number;
    municipality: string;
    route_name?: string;
    location?: string;
    work_type?: string;
    work_overview?: string;
    budget: number;
    department?: string;
  }) =>
    request<ConstructionItem>("/items/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }),
};
