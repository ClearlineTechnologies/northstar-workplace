import { NextRequest, NextResponse } from "next/server";
import { commit, readState } from "../../../database/store";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await readState());
}
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.headers.get("host"))
      return NextResponse.json({ error: "Origin mismatch" }, { status: 403 });
    const body = await request.json();
    if (
      !body.command ||
      typeof body.command.type !== "string" ||
      !Number.isInteger(body.revision)
    )
      throw Error("Invalid workplace command");
    return NextResponse.json(await commit(body.command, body.revision));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to save workplace",
      },
      { status: 400 },
    );
  }
}
