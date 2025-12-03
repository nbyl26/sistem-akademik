import { db } from "@/firebase/config";
import { mapUserRole } from "@/lib/map";
import { BaseUser } from "@/types/user";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { adminAuth } from "@/firebase/adminConfig";

export async function POST(request: Request) {
  const { uid } = await request.json();

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return NextResponse.json({ message: "User tidak ada" }, { status: 404 });
  }

  const profile = await mapUserRole(snap.data() as BaseUser);
  if (!profile) {
    return NextResponse.json({ message: "Role ngawur" }, { status: 403 });
  }

  adminAuth.setCustomUserClaims(uid, { role: profile.role });  
  const token = jwt.sign(profile!, process.env.JWT_KEY!, { expiresIn: "1h" });
  const res = NextResponse.json({ message: "Sucess Login" }, { status: 200 });

  res.cookies.set({
    name: "token",
    value: token,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
  });

  return res
}
