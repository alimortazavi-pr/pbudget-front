import { NextResponse } from "next/server";

const CALENDAR_API = "https://api.persian-calendar.ir/api/v1/calendar/get-year";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ year: string }> },
) {
  const { year: rawYear } = await params;
  const year = Number(rawYear);

  if (!Number.isInteger(year) || year < 1200 || year > 1600) {
    return NextResponse.json({ error: "Invalid Persian year" }, { status: 400 });
  }

  try {
    const response = await fetch(`${CALENDAR_API}/${year}`, {
      next: { revalidate: 86_400 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Calendar provider unavailable" },
        { status: 502 },
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return NextResponse.json(
      { error: "Calendar provider unavailable" },
      { status: 502 },
    );
  }
}
