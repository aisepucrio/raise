import { PageHeader } from "@/components/page-header";

export default function OverviewPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Visão geral dos dados coletados e do status do pipeline."
      />
    </section>
  );
}
