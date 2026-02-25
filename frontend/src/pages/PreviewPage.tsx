import { PageHeader } from "@/components/page-header";
import { getQueryErrorMessage, stackoverflowModule } from "@/data";

export default function PreviewPage() {
  const stackPreviewQuery = stackoverflowModule.queries.useStackOverflowPreviewQuery(
    "questions",
    {
      page: 1,
      page_size: 10,
    },
  );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Preview"
        subtitle="Visualize uma amostra dos dados antes do processamento."
      />

      {stackPreviewQuery.isPending && <p>Carregando preview...</p>}

      {stackPreviewQuery.isError && (
        <p>{getQueryErrorMessage(stackPreviewQuery.error, "Erro ao carregar preview.")}</p>
      )}

      {stackPreviewQuery.isSuccess && (
        <pre>{JSON.stringify(stackPreviewQuery.data, null, 2)}</pre>
      )}
    </section>
  );
}
