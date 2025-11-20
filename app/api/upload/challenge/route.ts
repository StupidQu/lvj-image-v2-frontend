import { NextRequest, NextResponse } from "next/server";
import request from "@/lib/request";

export async function GET(req: NextRequest) {
  try {
    const response = await request.Get<{ turnstile: boolean }>(
      "/upload/challenge"
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("检查 Turnstile 状态时出错:", error);
    return NextResponse.json(
      { success: false, message: "服务器处理请求时出错" },
      { status: 500 }
    );
  }
}

