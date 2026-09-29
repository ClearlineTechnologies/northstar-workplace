import { notFound } from "next/navigation";
import { Workbench } from "../../../components/workbench";
import { categories, definition } from "../../../minigames/catalog";
export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}
export default async function SimulationPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ assignment?: string }>;
}) {
  const { category } = await params;
  const def = definition(category);
  if (!def) notFound();
  return (
    <Workbench
      category={def.id}
      assignmentId={(await searchParams).assignment}
    />
  );
}
