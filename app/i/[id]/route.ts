import request from "@/lib/request";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const response = await request.Get<{ url?: string }>(`/i/${id}`);
  
  const redirectUrl = response.url || "/";
  
  // Return a response with cache-control header to cache for 1 day
  return NextResponse.redirect(redirectUrl, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
    status: 307
  });
}
