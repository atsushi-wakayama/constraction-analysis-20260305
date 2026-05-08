import { cookies } from "next/headers";
import { currentFiscalYear } from "./storage";

export const ACTIVE_YEAR_COOKIE = "active_fy";

export async function getActiveYear(): Promise<number> {
  const c = await cookies();
  const v = Number(c.get(ACTIVE_YEAR_COOKIE)?.value);
  return Number.isFinite(v) && v > 0 ? v : currentFiscalYear();
}
