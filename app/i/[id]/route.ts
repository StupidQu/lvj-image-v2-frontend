import request from "@/lib/request";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const response = await request.Get<{ url?: string }>(`/i/${id}`);

  redirect(response.url ? response.url : "/");
}
