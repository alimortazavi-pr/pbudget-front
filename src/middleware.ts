import { NextRequest, NextResponse } from "next/server";

//Tools
import api from "./api";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.split(".").length > 1) {
    return NextResponse.next();
  }

  //Checking isAuth
  let isAuth: boolean = false;
  const userAuthorization = request.cookies.get("userAuthorization");
  if (userAuthorization) {
    const transformedData = JSON.parse(userAuthorization.value);
    const token = transformedData.token;
    try {
      const res = await fetch(
        "https://api-pbudget.alimortazavi.org/v1/auth/check",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.status === 200) {
        isAuth = true;
      } else if (res.status === 401) {
        throw new Error(res.statusText);
      } else {
        throw new Error(res.statusText);
      }
    } catch (err: any) {
      if (err.message === "Unauthorized") {
        request.cookies.delete("userAuthorization");
      } else {
        console.log(err);
      }
      isAuth = false;
    }
  } else {
    isAuth = false;
  }

  if (request.nextUrl.pathname !== "/get-started") {
    if (isAuth) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(`${request.nextUrl.origin}/get-started`);
    }
  } else if (request.nextUrl.pathname === "/get-started") {
    if (isAuth) {
      return NextResponse.redirect(`${request.nextUrl.origin}/`);
    } else {
      return NextResponse.next();
    }
  }
}

export const config = {
  matcher: ["/:path*"],
};
