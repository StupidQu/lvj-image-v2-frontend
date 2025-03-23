import { UploadRecord } from "@/type/UploadRecord";

export const buildLink = (
  record: UploadRecord,
  type: "markdown" | "link" | "shortMarkdown" | "shortLink",
  baseUrl: string
) => {
  switch (type) {
    case "markdown":
      return `![](${record.url})`;
    case "link":
      return record.url;
    case "shortMarkdown":
      return `![](${baseUrl}/i/${record.id})`;
    case "shortLink":
      return `${baseUrl}/i/${record.id}`;
  }
};
