import { AdminHome } from "@/components/admin-home";
import { requireAdmin } from "@/app/actions/auth";
import { listAppUsers } from "@/lib/auth/app-users";

export default async function Home() {
  const user = await requireAdmin();
  const users = await listAppUsers();
  return <AdminHome user={user} users={users} />;
}
