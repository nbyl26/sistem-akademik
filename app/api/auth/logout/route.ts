import { NextResponse } from "next/server";

export async function GET( request : Request){
    const url = new URL("/login", request.url);
    const res = NextResponse.redirect(url);

    res.cookies.delete("token");
    return res;
}