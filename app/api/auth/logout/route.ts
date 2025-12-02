import { auth } from "@/firebase/config";
import { signOut } from "firebase/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL("/login", request.url);
  const res = NextResponse.redirect(url);

  await signOut(auth);
  res.cookies.delete("token");
  return res;
}
