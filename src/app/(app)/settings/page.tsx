import { PageHeader } from "@/components/page-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SettingsSections } from "./settings-sections";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  if (!user) {
    return <p>Error getting a user</p>;
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Settings"
        description="Manage your account, portfolio preferences, and integrations"
      />
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <SettingsSections user={user} />
      </main>
    </div>
  );
}
