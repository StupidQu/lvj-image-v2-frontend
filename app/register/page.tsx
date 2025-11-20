import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "注册 - LVJ Images - 免费图片上传不限量不限速",
  description: "注册账号后，享受我们提供的免费服务。",
};

type Props = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function Register({ searchParams }: Props) {
  const error = (await searchParams).error as string | undefined;
  const decodedError = error ? decodeURIComponent(error) : undefined;

  return (
    <div className="w-[600px] mx-auto mt-[300px]">
      <Card>
        <CardHeader>
          <CardTitle>注册 LVJ Images 账号</CardTitle>
          <CardDescription>
            注册账号后，享受我们提供的免费服务。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {decodedError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>注册错误</AlertTitle>
              <AlertDescription>{decodedError}</AlertDescription>
            </Alert>
          )}
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
