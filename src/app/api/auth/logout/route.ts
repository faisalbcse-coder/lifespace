import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, deleteSession } from "@/lib/auth";
import { apiSuccess } from "@/lib/api-response";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await deleteSession(token);
  }

  const response = apiSuccess({ message: "Logged out successfully" });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
