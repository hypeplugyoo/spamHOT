import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json({ status: "ok", mode: process.env.DEMO_MODE === "false" ? "REAL_ADAPTER_DISABLED" : "DEMO", services: { instagram: "not_connected", metrics: "demo_data_only" }, timestamp: new Date().toISOString() });
}
