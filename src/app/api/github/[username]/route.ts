import { NextResponse } from "next/server";
import { GitHubError, getDevShowProfile } from "@/lib/github";
import { isValidUsername, parseYear } from "@/lib/parse-github-url";

/** GET /api/github/:username[?year=2024] — the full DevShow profile payload as JSON. */
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  if (!isValidUsername(username)) {
    return NextResponse.json({ error: "Invalid GitHub username.", code: "invalid" }, { status: 400 });
  }

  try {
    const year = parseYear(new URL(req.url).searchParams.get("year"));
    const profile = await getDevShowProfile(username, year);
    return NextResponse.json(profile, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" },
    });
  } catch (err) {
    if (err instanceof GitHubError) {
      return NextResponse.json(
        { error: err.message, code: err.kind, resetAt: err.resetAt },
        {
          status: err.status,
          headers: err.kind === "not-found" ? { "Cache-Control": "public, s-maxage=300" } : undefined,
        },
      );
    }
    console.error("[devshow] unexpected error", err);
    return NextResponse.json({ error: "Unexpected error.", code: "internal" }, { status: 500 });
  }
}
