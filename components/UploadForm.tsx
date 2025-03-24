"use client";

import { Button } from "@/components/ui/button";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UploadRecord } from "@/type/UploadRecord";
import { buildLink } from "@/lib/buildLink";
import Turnstile from "react-turnstile";
import { Loader2 } from "lucide-react";

type UploadResult = {
  file: File;
  status: "pending" | "success" | "error";
  message?: string;
  data?: UploadRecord;
};

type Props = {
  TurnstileKey: string;
};

// 创建一个工具函数来合并 classNames
const cn = (...inputs: Parameters<typeof clsx>) => {
  return twMerge(clsx(inputs));
};

export default function UploadForm({ TurnstileKey }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [containerHeight, setContainerHeight] = useState("h-[300px]");
  const [showResults, setShowResults] = useState(false);

  const tokenRef = useRef<string | null>(null);

  // 计算基于图片数量的容器高度
  useEffect(() => {
    if (selectedFiles.length === 0) {
      setContainerHeight("h-[300px]");
      return;
    }

    // 计算需要多少行来显示所有图片
    // 假设每行显示 5 个图片（基于 grid-cols-5），每个图片高度约 180px（包括图片和文件名）
    const itemsPerRow = 5;
    const itemHeight = 180; // 单个图片项的高度，包括图片和文件名（px）
    const rows = Math.ceil(selectedFiles.length / itemsPerRow);
    const padding = 32; // 考虑 padding，单位 px

    // 计算所需的总高度
    const calculatedHeight = Math.max(200, rows * itemHeight + padding);

    setContainerHeight(`h-[${calculatedHeight}px]`);
  }, [selectedFiles.length]);

  // 添加粘贴事件监听器
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;

      if (!items) return;

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );

      if (imageItems.length === 0) return;

      // 处理粘贴的图片
      imageItems.forEach((item) => {
        const file = item.getAsFile();
        if (file) {
          // 生成唯一的文件名
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

    // 添加全局粘贴事件监听
    window.addEventListener("paste", handlePaste);

    // 清理函数
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

    // 检查 Turnstile Token
    if (!tokenRef.current) {
      toast.error("请先完成人机验证");
      return;
    }

    // 设置上传状态为true
    setIsUploading(true);

    // 设置所有文件为上传中状态
    setUploadResults((prev) =>
      prev.map((result) => ({ ...result, status: "pending" as const }))
    );

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });

    // 添加 Turnstile Token
    formData.append("turnstileToken", tokenRef.current);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // 处理错误
        setUploadResults((prev) =>
          prev.map((result) => ({
            ...result,
            status: "error" as const,
            message: data.message || "上传失败",
          }))
        );
        return;
      }

      // 处理成功响应
      const uploadRecords = data as UploadRecord[];
      setUploadResults((prev) =>
        prev.map((result, index) => {
          // 确保我们有匹配的记录
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

      // 显示结果区域
      setShowResults(true);

      // 上传成功后清空拖拽区域内显示的图片
      setSelectedFiles([]);
      // 重置文件输入框的值
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      // 处理网络错误
      setUploadResults((prev) =>
        prev.map((result) => ({
          ...result,
          status: "error" as const,
          message: "网络错误，请重试",
        }))
      );
    } finally {
      // 无论成功或失败，都将上传状态设置为false
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    setShowResults(false);
    // 重置文件输入框的值
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadResults((prev) => prev.filter((_, i) => i !== index));
    // 重置文件输入框的值，以便可以再次选择相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 获取成功上传的结果
  const successResults = uploadResults.filter(
    (result) => result.status === "success" && result.data
  );

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "border border-dashed w-full flex flex-col items-center justify-center gap-2 cursor-pointer relative",
          containerHeight,
          // 只有在没有选择文件并且正在拖拽时才改变背景颜色
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
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    fill
                    className="object-contain"
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

      <Turnstile
        sitekey={TurnstileKey}
        onVerify={(token) => {
          tokenRef.current = token;
        }}
      />

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
                <Image
                  src={result.data?.url!}
                  alt={result.file.name}
                  width={100}
                  height={0}
                  style={{
                    width: "100px",
                    height: "auto",
                    marginTop: "auto",
                    marginBottom: "auto",
                  }}
                />
                <div className="grow">
                  <Tabs defaultValue="shortMarkdown">
                    <TabsList>
                      <TabsTrigger value="markdown">Markdown</TabsTrigger>
                      <TabsTrigger value="link">链接</TabsTrigger>
                      <TabsTrigger value="shortMarkdown">
                        短Markdown
                      </TabsTrigger>
                      <TabsTrigger value="shortLink">短链接</TabsTrigger>
                    </TabsList>
                    {(
                      [
                        "markdown",
                        "link",
                        "shortMarkdown",
                        "shortLink",
                      ] as const
                    ).map((tab) => (
                      <TabsContent key={tab} value={tab}>
                        <div className="flex gap-2">
                          <Input
                            className="w-full"
                            value={buildLink(
                              result.data!,
                              tab,
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
                                  tab,
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
