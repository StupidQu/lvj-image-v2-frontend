import { NextRequest, NextResponse } from "next/server";
import request from "@/lib/request";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const response = await request.Post("/upload", formData, {
      name: "uploadImages",
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("上传文件时出错:", error);
    return NextResponse.json(
      { success: false, message: "服务器处理上传请求时出错" },
      { status: 500 }
    );
  }
}
