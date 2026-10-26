import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function apiError(error: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error,
      details,
    },
    { status }
  );
}
