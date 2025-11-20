"use client";

import { Button } from "@/components/ui/button";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UploadRecord } from "@/type/UploadRecord";
import { buildLink } from "@/lib/buildLink";
import Turnstile, { useTurnstile } from "react-turnstile";
import { Loader2, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type UploadResult = {
  file: File;
  status: "pending" | "success" | "error";
  message?: string;
  data?: UploadRecord;
};

type Props = {
  TurnstileKey: string;
};

const cn = (...inputs: Parameters<typeof clsx>) => {
  return twMerge(clsx(inputs));
};

export default function UploadForm({ TurnstileKey }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [useShortlink, setUseShortlink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [containerHeight, setContainerHeight] = useState("h-[300px]");
  const [showResults, setShowResults] = useState(false);

  const tokenRef = useRef<string | null>(null);
  const turnstile = useTurnstile();
  const [needsTurnstile, setNeedsTurnstile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkTurnstile = async () => {
      try {
        const res = await fetch("/api/upload/challenge");
        if (res.ok) {
          const data = await res.json();
          setNeedsTurnstile(data.turnstile);
        } else {
          setNeedsTurnstile(true);
        }
      } catch (error) {
        console.error("无法检查验证码状态:", error);
        setNeedsTurnstile(true);
      }
    };

    checkTurnstile();
  }, []);

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setContainerHeight("h-[300px]");
      return;
    }

    const itemsPerRow = 5;
    const itemHeight = 180;
    const rows = Math.ceil(selectedFiles.length / itemsPerRow);
    const padding = 32;

    const calculatedHeight = Math.max(200, rows * itemHeight + padding);

    setContainerHeight(`h-[${calculatedHeight}px]`);
  }, [selectedFiles.length]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;

      if (!items) return;

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );

      if (imageItems.length === 0) return;

      imageItems.forEach((item) => {
        const file = item.getAsFile();
        if (file) {
          const timestamp = new Date().getTime();
          const newFile = new File(
            [file],
            `粘贴图片_${timestamp}.${file.type.split("/")[1]}`,
            {
              type: file.type,
            }
          );

          setSelectedFiles((prev) => [...prev, newFile]);
          setUploadResults((prev) => [
            ...prev,
            { file: newFile, status: "pending" as const },
          ]);

          toast("已添加粘贴的图片");
        }
      });
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setUploadResults((prev) => [
      ...prev,
      ...newFiles.map((file) => ({ file, status: "pending" as const })),
    ]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    if (needsTurnstile === true && !tokenRef.current) {
      toast.error("请先完成人机验证");
      return;
    }

    setIsUploading(true);

    setUploadResults((prev) =>
      prev.map((result) => ({ ...result, status: "pending" as const }))
    );

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });

    formData.append("turnstileToken", tokenRef.current || "");

    formData.append("useShortlink", String(useShortlink));

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadResults((prev) =>
          prev.map((result) => ({
            ...result,
            status: "error" as const,
            message: data.message || "上传失败",
          }))
        );
        return;
      }

      const uploadRecords = data as UploadRecord[];
      setUploadResults((prev) =>
        prev.map((result, index) => {
          if (index < uploadRecords.length) {
            return {
              ...result,
              status: "success" as const,
              data: uploadRecords[index],
            };
          }
          return result;
        })
      );

      setShowResults(true);

      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadResults((prev) =>
        prev.map((result) => ({
          ...result,
          status: "error" as const,
          message: "网络错误，请重试",
        }))
      );
    } finally {
      setIsUploading(false);
      if (needsTurnstile && turnstile) {
        turnstile.reset();
      }
    }
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadResults((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const successResults = uploadResults.filter(
    (result) => result.status === "success" && result.data
  );

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "border border-dashed w-full flex flex-col items-center justify-center gap-2 cursor-pointer relative",
          containerHeight,
          selectedFiles.length === 0 && [
            "hover:bg-accent/80 transition-colors duration-100",
            isDragging && "bg-accent/60",
          ]
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedFiles.length === 0 ? (
          <>
            <CloudArrowUpIcon className="size-10" />
            <p className="text-sm">点击或拖拽图片</p>
          </>
        ) : (
          <div className="w-full h-full p-4 grid grid-cols-5 gap-3 auto-rows-max">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="relative group flex flex-col items-center"
              >
                <div className="w-full aspect-square max-h-[140px] relative overflow-hidden rounded-md">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -top-2 -right-2 p-1 h-auto w-auto min-h-0 min-w-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <XMarkIcon className="size-4" />
                </Button>
                <p className="text-xs mt-1 truncate w-full text-center">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          className="hidden"
          multiple
          accept="image/*"
        />
      </div>

      <div>
        {uploadResults.length > 0 && !showResults && (
          <div className="mt-2 text-sm">
            <ul className="space-y-1 mt-1">
              {uploadResults.map((result, index) => (
                <li key={index} className={cn("flex items-center gap-2")}>
                  <span className="truncate text-gray-600">
                    {result.file.name}
                  </span>
                  {result.status === "pending" && (
                    <span className="text-yellow-500">等待上传</span>
                  )}
                  {result.status === "success" && (
                    <span className="text-green-500">上传成功</span>
                  )}
                  {result.status === "error" && (
                    <span className="text-red-500">
                      上传失败: {result.message}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 mt-2">
        <Checkbox
          id="useShortlink"
          checked={useShortlink}
          onCheckedChange={(checked) => setUseShortlink(checked === true)}
        />
        <label
          htmlFor="useShortlink"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          启用短链访问（图片可能会被其他人看到）
        </label>
      </div>

      {needsTurnstile === null && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在检查安全环境...
        </div>
      )}

      {needsTurnstile === true && (
        <Turnstile
          sitekey={TurnstileKey}
          onVerify={(token) => {
            tokenRef.current = token;
          }}
        />
      )}

      {needsTurnstile === false && (
        <Alert className="bg-green-50 border-green-200 text-green-900">
          <ShieldCheck className="size-4 !text-green-600" />
          <AlertTitle>无需验证</AlertTitle>
          <AlertDescription className="text-green-700">
            根据你的历史行为分析，本次上传无需验证码。
          </AlertDescription>
        </Alert>
      )}

      <div className="flex mt-4 gap-2">
        <Button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              上传中...
            </>
          ) : (
            "确认上传"
          )}
        </Button>
        <Button variant="outline" onClick={handleClear} disabled={isUploading}>
          清空
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {successResults &&
          successResults
            .filter((result) => result.data?.url)
            .map((result) => (
              <div
                key={result.data?.id!}
                className="border border-dashed p-2 flex gap-2"
              >
                <img
                  src={result.data?.url!}
                  alt={result.file.name}
                  style={{
                    width: "100px",
                    height: "auto",
                    marginTop: "auto",
                    marginBottom: "auto",
                  }}
                />
                <div className="grow">
                  <Tabs
                    defaultValue={
                      result.data?.useShortlink ?? true
                        ? "shortMarkdown"
                        : "markdown"
                    }
                  >
                    <TabsList>
                      <TabsTrigger value="markdown">Markdown</TabsTrigger>
                      <TabsTrigger value="link">链接</TabsTrigger>
                      {result.data?.useShortlink && (
                        <>
                          <TabsTrigger value="shortMarkdown">
                            短Markdown
                          </TabsTrigger>
                          <TabsTrigger value="shortLink">短链接</TabsTrigger>
                        </>
                      )}
                    </TabsList>
                    {[
                      "markdown",
                      "link",
                      ...(result.data?.useShortlink
                        ? ["shortMarkdown", "shortLink"]
                        : []),
                    ].map((tab) => (
                      <TabsContent key={tab} value={tab}>
                        <div className="flex gap-2">
                          <Input
                            className="w-full"
                            value={buildLink(
                              result.data!,
                              tab as any,
                              window.location.origin
                            )}
                            readOnly
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                buildLink(
                                  result.data!,
                                  tab as any,
                                  window.location.origin
                                )
                              );
                              toast("链接已复制");
                            }}
                          >
                            复制
                          </Button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
