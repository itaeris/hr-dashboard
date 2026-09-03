import { filterLarkUsers, isLarkConfigured, listLarkUsers } from "@/lib/lark/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!isLarkConfigured()) {
    return NextResponse.json(
      { error: "Lark is not configured. Add LARK_APP_ID and LARK_APP_SECRET." },
      { status: 503 },
    );
  }

  const query = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? "";

  try {
    const users = filterLarkUsers(await listLarkUsers(), query);
    return NextResponse.json(
      { users },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
        },
      },
    );
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not load Lark users.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
