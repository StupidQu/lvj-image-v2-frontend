import Link from "next/link";
import { Fira_Code } from "next/font/google";
import { Button } from "@/components/ui/button";
import request from "@/lib/request";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type Profile =
  | {
      success: true;
      name: string;
      email: string;
    }
  | { success: false };

export default async function Nav() {
  const profile = await request.Get<Profile>("/auth/profile");

  const logout = async () => {
    "use server";

    (await cookies()).delete("accessToken");
    redirect("/login");
  };

  return (
    <header className="border-b border-dashed py-2 sticky top-0 bg-background mb-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              className={`${firaCode.className} text-2xl font-bold`}
              href="/"
            >
              LVJ Images
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {!profile.success ? (
              <>
                <Link href="/login">
                  <Button variant="outline" className="cursor-pointer">
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="cursor-pointer">注册</Button>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/user"
                  className={`${firaCode.className} font-semibold hover:text-cyan-800`}
                >
                  {profile.name}
                </Link>
                <Button onClick={logout} size="sm" variant="outline">
                  退出
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
