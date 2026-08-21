import { CompanyPicker } from "@/components/company-picker";
import { requireSession } from "@/app/actions/auth";

export default async function Home() {
  const user = await requireSession();
  return <CompanyPicker user={user} />;
}
