import { supabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { dataUrl, filename } = await req.json();
    if (!dataUrl?.startsWith("data:image/")) {
      return NextResponse.json(
        { ok: false, error: "invalid dataUrl" },
        { status: 400 }
      );
    }
    const sb = await supabaseServer();
    // extract bytes
    const base64 = dataUrl.split(",")[1];
    const bytes = Buffer.from(base64, "base64");
    const name = filename ?? `${Date.now()}.jpg`;
    // TODO: get real user id from auth cookie/session; fallback anon
    const userId = "anon";
    const path = `snaps/${userId}/${name}`;

    // try storage upload (if bucket is configured)
    const { error } = await sb.storage
      .from("snaps")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
    if (error) {
      // fall back to stub if storage/bucket missing
      return NextResponse.json({
        ok: true,
        mode: "stub",
        note: "storage upload skipped",
        reason: error.message,
      });
    }
    return NextResponse.json({ ok: true, mode: "live", path });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "failed" },
      { status: 500 }
    );
  }
}
