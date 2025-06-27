import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildLink } from "@/lib/buildLink";
import request from "@/lib/request";
import { UploadRecord } from "@/type/UploadRecord";
import { headers } from "next/headers";
import CopyButton from "./CopyButton";
import {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Pagination } from "@/components/ui/pagination";
import { redirect } from "next/navigation";

export const metadata = {
  title: "上传记录 - LVJ Images - 免费图片上传不限量不限速",
  description: "查看用户的上传记录。",
};

type Prop = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const COUNT_PER_PAGE = 10;

export default async function User({ searchParams }: Prop) {
  const profile = await request.Get<{ success: boolean; name?: string }>(
    "/auth/profile"
  );
  if (!profile.success) {
    redirect("/login");
  }

  let page = (await searchParams).page as string;
  if (!page || isNaN(parseInt(page)) || parseInt(page) < 1) {
    page = "1";
  }
  const history = await request.Get<{ uploads: UploadRecord[]; total: number }>(
    `/upload/history?skip=${
      (parseInt(page) - 1) * COUNT_PER_PAGE
    }&take=${COUNT_PER_PAGE}`,
    {
      hitSource: "uploadImages",
    }
  );

  const hd = await headers();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">
        {profile.name!} 的上传记录
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.uploads.map((record) => (
          <div
            key={record.id}
            className="border border-dashed p-2 md:flex md:gap-2"
          >
            <img
              src={record.url}
              alt={record.id.toString()}
              style={{
                width: "100px",
                height: "auto",
              }}
              className="mb-2 md:mt-auto md:mb-auto"
            />
            <div className="grow">
              <Tabs
                defaultValue={
                  record.useShortlink === false ? "markdown" : "shortMarkdown"
                }
              >
                <TabsList>
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  <TabsTrigger value="link">链接</TabsTrigger>
                  {(record.useShortlink === undefined ||
                    record.useShortlink === true) && (
                    <>
                      <TabsTrigger value="shortMarkdown">
                        短Markdown
                      </TabsTrigger>
                      <TabsTrigger value="shortLink">短链接</TabsTrigger>
                    </>
                  )}
                </TabsList>
                {(() => {
                  type TabType =
                    | "markdown"
                    | "link"
                    | "shortMarkdown"
                    | "shortLink";
                  const tabs: TabType[] = ["markdown", "link"];
                  if (
                    record.useShortlink === undefined ||
                    record.useShortlink === true
                  ) {
                    tabs.push("shortMarkdown", "shortLink");
                  }
                  return tabs.map((tab) => (
                    <TabsContent key={tab} value={tab}>
                      <div className="flex gap-2">
                        <Input
                          className="w-full"
                          value={buildLink(record, tab, hd.get("host")!)}
                          readOnly
                        />
                        <CopyButton record={record} tab={tab} />
                      </div>
                    </TabsContent>
                  ));
                })()}
              </Tabs>
            </div>
          </div>
        ))}
      </div>
      <Pagination className="mt-4">
        <PaginationContent>
          {parseInt(page) > 1 && (
            <PaginationItem>
              <PaginationPrevious href={`/user?page=${parseInt(page) - 1}`} />
            </PaginationItem>
          )}

          {(() => {
            const currentPage = parseInt(page);
            const totalPages = Math.ceil(history.total / COUNT_PER_PAGE);

            // 页码显示逻辑
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, startPage + 4);

            // 确保尽可能显示5个页码
            if (endPage - startPage < 4 && endPage >= 5) {
              startPage = Math.max(1, endPage - 4);
            }

            const pages = [];

            // 第一页
            if (startPage > 1) {
              pages.push(
                <PaginationItem key={1}>
                  <PaginationLink href={`/user?page=1`}>1</PaginationLink>
                </PaginationItem>
              );

              // 省略号
              if (startPage > 2) {
                pages.push(
                  <PaginationItem key="ellipsis1">
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
            }

            // 中间页码
            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <PaginationItem key={i}>
                  <PaginationLink
                    href={`/user?page=${i}`}
                    isActive={i === currentPage}
                  >
                    {i}
                  </PaginationLink>
                </PaginationItem>
              );
            }

            // 最后页
            if (endPage < totalPages) {
              // 省略号
              if (endPage < totalPages - 1) {
                pages.push(
                  <PaginationItem key="ellipsis2">
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              pages.push(
                <PaginationItem key={totalPages}>
                  <PaginationLink href={`/user?page=${totalPages}`}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              );
            }

            return pages;
          })()}

          {parseInt(page) < Math.ceil(history.total / COUNT_PER_PAGE) && (
            <PaginationItem>
              <PaginationNext href={`/user?page=${parseInt(page) + 1}`} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
