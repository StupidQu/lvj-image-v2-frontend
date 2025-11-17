"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type SendCodeResponse = {
  success: boolean;
  message?: string;
};

export default function EmailCodeField() {
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      setFeedback({
        type: "error",
        message: "请先输入有效的邮箱地址",
      });
      return;
    }

    if (sending || countdown > 0) {
      return;
    }

    try {
      setSending(true);
      setFeedback(null);

      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data: SendCodeResponse = await res.json();

      if (!data.success) {
        setFeedback({
          type: "error",
          message: data.message || "发送验证码失败，请稍后重试",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: data.message || "验证码已发送，请查收邮箱",
      });
      setCountdown(60);
    } catch (error) {
      setFeedback({
        type: "error",
        message: "网络错误，发送验证码失败，请稍后重试",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>邮箱</Label>
        <Input
          type="email"
          placeholder="邮箱"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>邮件验证码</Label>
        <div className="flex gap-2">
          <Input type="text" placeholder="请输入邮件验证码" name="code" />
          <Button
            type="button"
            variant="outline"
            onClick={handleSendCode}
            disabled={sending || countdown > 0}
          >
            {countdown > 0 ? `${countdown}s 后重试` : "发送验证码"}
          </Button>
        </div>
      </div>
      {feedback && (
        <p
          className={`text-sm ${
            feedback.type === "error" ? "text-red-500" : "text-green-500"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}


