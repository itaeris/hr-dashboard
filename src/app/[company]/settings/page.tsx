import { requireSession } from "@/app/actions/auth";
import { SettingsPage } from "@/components/settings-view";
import { getStoredUser } from "@/lib/auth/password-store";

export default async function SettingsRoute() {
  const user = await requireSession();
  const stored = await getStoredUser(user.email);
  return <SettingsPage user={user} hasPassword={Boolean(stored)} />;
}
