import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import db from "@/lib/db";

const AppLayout = async ({ children }: { children: ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const result = await db.query(
    `SELECT 1 FROM user_financial_settings WHERE "userId" = $1`,
    [session.user.id]
  );
  if (result.rows.length === 0) redirect("/setup");

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
