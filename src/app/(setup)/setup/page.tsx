import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { SetupWizard } from "./setup-wizard";

export default async function SetupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  // If already set up, send to dashboard
  const result = await db.query(
    `SELECT 1 FROM user_financial_settings WHERE "userId" = $1`,
    [session.user.id]
  );
  if (result.rows.length > 0) redirect("/dashboard");

  return <SetupWizard userName={session.user.name} />;
}
