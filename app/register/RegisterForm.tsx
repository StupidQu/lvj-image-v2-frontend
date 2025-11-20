"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EmailCodeField from "./EmailCodeField";
import { register } from "./actions";

export default function RegisterForm() {
  const [username, setUsername] = useState("");

  return (
    <form action={register}>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>用户名</Label>
          <Input
            type="text"
            placeholder="用户名"
            name="name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <EmailCodeField username={username} />
        <div className="space-y-1.5">
          <Label>密码</Label>
          <Input type="password" placeholder="密码" name="password" />
        </div>
      </div>
      <div className="mt-6">
        <Button type="submit" className="w-full">
          注册
        </Button>
      </div>
    </form>
  );
}

