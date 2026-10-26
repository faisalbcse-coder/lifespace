import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message: "LifeSpace Android APK is currently under active development. Coming soon!",
      status: "coming_soon",
    },
    { status: 503 }
  );
}
