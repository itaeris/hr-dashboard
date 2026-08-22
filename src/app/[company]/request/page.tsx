import { redirect } from "next/navigation";

export default async function RequestIndex({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  redirect(`/${company}/request/responses`);
}
