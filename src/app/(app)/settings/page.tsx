import { PageHeader } from "@/components/page-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/lib/db";
import { SettingsSections } from "./settings-sections";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  if (!user) return <p>Error getting a user</p>;

  const result = await db.query(
    `SELECT currency, "inflationRateAssumption", "incomeDropScenario"
     FROM user_financial_settings WHERE "userId" = $1`,
    [user.id]
  );
  const financialSettings = result.rows[0] ?? null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Settings"
        description="Manage your account, portfolio preferences, and integrations"
      />
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <SettingsSections user={user} financialSettings={financialSettings} />
      </main>
    </div>
  );
}
