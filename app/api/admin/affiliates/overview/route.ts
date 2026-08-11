import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/lib/affiliate/data-layer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const overview = await getDashboardOverview();
    return NextResponse.json({ success: true, ...overview });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch overview metrics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
