import { Metadata } from "next";
import request from "@/lib/request";
import { redirect } from "next/navigation";
import UploadForm from "../components/UploadForm";

export const metadata: Metadata = {
  title: "主页 - LVJ Images - 免费图片上传不限量不限速",
};

export default async function Home() {
  const profile = await request.Get<{ success: boolean }>("/auth/profile");

  if (!profile.success) {
    redirect("/login");
  }

  return (
    <div>
      <UploadForm
        TurnstileKey={process.env.CLOUDFLARE_TURNSTILE_SITE_KEY || ""}
      />
    </div>
  );
}
