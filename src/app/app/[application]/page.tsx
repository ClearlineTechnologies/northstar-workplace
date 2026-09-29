import { notFound } from "next/navigation";
import { Application } from "../../../components/applications";
import { applications } from "../../../minigames/catalog";
export function generateStaticParams() {
  return applications
    .filter((v) => v !== "Dashboard")
    .map((v) => ({ application: v.toLowerCase() }));
}
export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ application: string }>;
}) {
  const { application } = await params;
  const name = applications.find((a) => a.toLowerCase() === application);
  if (!name) notFound();
  return <Application name={name} />;
}
