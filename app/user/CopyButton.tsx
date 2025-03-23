"use client";

import { Button } from "@/components/ui/button";
import { buildLink } from "@/lib/buildLink";
import { UploadRecord } from "@/type/UploadRecord";
import { toast } from "sonner";

export default function CopyButton({
  record,
  tab,
}: {
  record: UploadRecord;
  tab: "markdown" | "link" | "shortMarkdown" | "shortLink";
}) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(
          buildLink(record, tab, window.location.origin)
        );
        toast("链接已复制");
      }}
    >
      复制
    </Button>
  );
}
