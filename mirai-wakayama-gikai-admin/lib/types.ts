export type ExpenseCategory =
  | "調査研究費"
  | "研修費"
  | "広報広聴費"
  | "会議費"
  | "資料作成費"
  | "資料購入費"
  | "要請陳情活動費"
  | "事務所費"
  | "事務費"
  | "人件費";

export interface PaymentEntry {
  id: string;
  date: string; // YYYY-MM-DD
  totalYen: number;
  payee: string;
  description: string;
  allocatedYen: number;
  note: string;
}

export interface PaymentCertificate {
  id: string;
  fiscalYear: number;
  category: ExpenseCategory;
  certifiedDate: string; // YYYY-MM-DD
  signerName: string;
  factionName: string;
  representativeName: string;
  entries: PaymentEntry[];
  /** 自動車使用簿等から自動生成された場合のソース識別子。例 "vehicle:2025-07" */
  sourceKey?: string;
  /** 紐付け先の活動記録ID（県外調査用） */
  linkedActivityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  fiscalYear: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory | ""; // 収入のみの行は空
  content: string;
  payee: string;
  incomeYen: number;
  expenseYen: number;
  allocationRatio: number; // 0-1
  allocatedYen: number;
  note: string;
  /** 取り込み元（重複防止用）: "activity:<id>:<expenseId>", "payment:<certId>:<entryId>" など */
  sourceKey?: string;
}

export interface VehicleTrip {
  id: string;
  fiscalYear: number;
  month: number; // 1-12 (calendar month)
  date: string; // YYYY-MM-DD
  purpose: string;
  totalKm: number;
  businessKm: number;
  /** 経費種別: 通常は 調査研究費 / 研修費 のいずれか */
  category: ExpenseCategory;
  note: string;
}

export interface ActivityExpense {
  id: string;
  category: string;
  description: string;
  totalYen: number;
  allocatedYen: number;
  note: string;
  /** 支払先（任意・支払証明書転記用） */
  payee?: string;
  /** 支払証明書（県外調査用）に転記するかどうか */
  addToCert?: boolean;
}

export interface Receipt {
  id: string;
  fiscalYear: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  payee: string;
  totalYen: number;
  allocatedYen: number;
  description: string;
  note: string;
  imageFile: string; // filename under data/receipt-images/
  sourcePdf?: string; // optional original PDF filename
  pageNumber?: number; // page in source PDF (1-indexed)
  mimeType: string;
  /** リンクされた活動記録ID（県外調査などで紐付けたい場合） */
  linkedActivityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRecord {
  id: string;
  fiscalYear: number;
  factionMemberName: string;
  implementationDate: string;
  location: string;
  participants: string;
  purposeContent: string;
  expenses: ActivityExpense[];
  /** 県外調査フラグ。trueの場合、支払証明書・領収書を別ファイル管理する */
  outOfPrefecture?: boolean;
  /** リンクされた領収書ID（同じ調査に紐づく領収書） */
  linkedReceiptIds?: string[];
  createdAt: string;
  updatedAt: string;
}
