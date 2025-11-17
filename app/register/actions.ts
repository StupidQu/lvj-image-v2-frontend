"use server";

import request from "@/lib/request";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type RegisterResponse =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      accessToken: string;
    };

export async function register(formData: FormData) {
  const name = formData.get("name")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim() || "";
  const password = formData.get("password")?.toString() || "";
  const code = formData.get("code")?.toString().trim() || "";

  const res = await request.Post<RegisterResponse>("/auth/register", {
    name,
    email,
    password,
    code,
  });

  if (!res.success) {
    redirect(`/register?error=${encodeURIComponent(res.message)}`);
  }

  (await cookies()).set("accessToken", res.accessToken, {
    httpOnly: true,
    path: "/",
  });

  redirect("/");
}


