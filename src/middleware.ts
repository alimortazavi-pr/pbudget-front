import { NextRequest, NextResponse } from "next/server";

//Tools
import api from "./api";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.split(".").length > 1) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname !== "/get-started") {
    const response = NextResponse.next();
    const userAuthorization = response.cookies.get("userAuthorization");
    if (userAuthorization) {
      const transformedData = JSON.parse(userAuthorization.value);
      const token = transformedData.token;
      try {
        await api.get("/auth/check", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err: any) {
        if (err.response?.status === 401) {
          response.cookies.delete("userAuthorization");
        } else {
          console.log(err);
        }
        return NextResponse.redirect(`${request.nextUrl.origin}/get-started`);
      }
    } else {
      return NextResponse.redirect(`${request.nextUrl.origin}/get-started`);
    }
  } else {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/:path*"],
};
