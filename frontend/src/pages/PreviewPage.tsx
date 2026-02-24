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
    <div>
      {stackPreviewQuery.isPending && <p>Carregando preview...</p>}

      {stackPreviewQuery.isError && (
        <p>{getQueryErrorMessage(stackPreviewQuery.error, "Erro ao carregar preview.")}</p>
      )}

      {stackPreviewQuery.isSuccess && (
        <pre>{JSON.stringify(stackPreviewQuery.data, null, 2)}</pre>
      )}
    </div>
  );
}
