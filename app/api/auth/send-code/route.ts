import { NextRequest, NextResponse } from "next/server";
import request from "@/lib/request";

type SendCodeResponse = {
  success: boolean;
  message?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email) {
      return NextResponse.json(
        { success: false, message: "邮箱不能为空" satisfies string },
        { status: 400 }
      );
    }

    const response = await request.Post<SendCodeResponse>("/auth/send-code", {
      email,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("发送验证码时出错:", error);
    return NextResponse.json(
      { success: false, message: "服务器处理验证码请求时出错" },
      { status: 500 }
    );
  }
}


