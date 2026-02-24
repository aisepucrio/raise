# Services

Camada de serviços do frontend (requisições HTTP por domínio de uso).

## Estrutura atual

- `githubService.ts`, `jiraService.ts`, `stackoverflowService.ts`
  - Reúnem as chamadas por fonte: `overview`, `date-range`, `graph`, `preview`, `export`, `collect`.
- `jobsService.ts`
  - Rotas globais de jobs (não pertencem a uma fonte específica).
- `shared.ts`
  - Tipos/helpers compartilhados entre services.
- `index.ts`
  - Barrel + objeto `services` para consumo centralizado.

## Contexto de `src/api/*`

- `src/api/apiClient.ts`
  - Instância Axios compartilhada.
  - Define `baseURL`, headers e interceptors.
  - O interceptor já retorna o payload (`res.data`), então os services **não** usam `.data`.
- `src/api/endpoints.ts`
  - Fonte única das rotas.
  - Centraliza path params e tipos (`Source`, `Section`).

## Como adicionar um novo módulo/fonte

1. Adicione tipos/rotas em `src/api/endpoints.ts` (source/sections/endpoints).
2. Crie um novo `*Service.ts` em `src/services/` seguindo o padrão atual.
3. Use `api` + `endpoints` (sem string de rota hardcoded).
4. Extraia para `shared.ts` somente o que for realmente reutilizado por 2+ services.
5. Exporte em `src/services/index.ts`.
