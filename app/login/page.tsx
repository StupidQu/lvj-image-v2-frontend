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
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import request from "@/lib/request";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "登录 - LVJ Images - 免费图片上传不限量不限速",
  description: "登录账号后，享受我们提供的免费服务。",
};

type LoginResponse =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      accessToken: string;
    };

type Props = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function Login({ searchParams }: Props) {
  const error = (await searchParams).error as string | undefined;
  const decodedError = error ? decodeURIComponent(error) : undefined;

  return (
    <div className="w-[600px] mx-auto mt-[300px]">
      <form action={login}>
        <Card>
          <CardHeader>
            <CardTitle>登录至 LVJ Images</CardTitle>
            <CardDescription>
              登陆账号后，享受我们提供的免费服务。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {decodedError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>登录错误</AlertTitle>
                <AlertDescription>{decodedError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label>邮箱或用户名</Label>
              <Input
                type="text"
                placeholder="请输入邮箱或用户名"
                name="nameOrEmail"
              />
            </div>
            <div className="space-y-1.5">
              <Label>密码</Label>
              <Input type="password" placeholder="请输入密码" name="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              登录
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

// 这是一个服务端函数，用于处理表单提交
async function login(formData: FormData) {
  "use server";

  const nameOrEmail = formData.get("nameOrEmail")?.toString().trim() || "";
  const password = formData.get("password")?.toString() || "";

  const buildError = (message: string) => {
    return encodeURIComponent(message);
  };

  if (!nameOrEmail || !password) {
    redirect(`/login?error=${buildError("请填写完整信息")}`);
  }

  let payload: { name?: string; email?: string; password: string } = {
    password,
  };
  if (nameOrEmail.includes("@")) {
    payload.email = nameOrEmail;
  } else {
    payload.name = nameOrEmail;
  }

  const res = await request.Post<LoginResponse>("/auth/login", payload);

  if (!res.success) {
    redirect(`/login?error=${buildError(res.message)}`);
  }

  (await cookies()).set("accessToken", res.accessToken, {
    httpOnly: true,
    path: "/",
  });

  redirect("/");
}
