import { PageHeader } from "@/components/page-header";

export default function CollectPage() {
  const sources = ["GitHub", "Jira", "Stack Overflow", "Docs internos"];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Collect"
        subtitle="Configure e dispare coletas nas fontes integradas."
      />
    </section>
  );
}
