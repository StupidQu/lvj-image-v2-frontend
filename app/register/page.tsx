import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Metadata } from "next";
import EmailCodeField from "./EmailCodeField";
import { register } from "./actions";

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
      <form action={register}>
        <Card>
          <CardHeader>
            <CardTitle>注册 LVJ Images 账号</CardTitle>
            <CardDescription>
              注册账号后，享受我们提供的免费服务。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {decodedError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>注册错误</AlertTitle>
                <AlertDescription>{decodedError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label>用户名</Label>
              <Input type="text" placeholder="用户名" name="name" />
            </div>
            <EmailCodeField />
            <div className="space-y-1.5">
              <Label>密码</Label>
              <Input type="password" placeholder="密码" name="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              注册
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
