# Data Layer (`src/data`)

Camada central de comunicação do frontend com o backend.

## Estrutura

- `api/`
  - infraestrutura HTTP (`axios`) e rotas (`endpoints`)
  - não conhece tela, estado de UI nem React Query

- `query/`
  - infraestrutura do React Query (client, keys, helpers de erro/invalidation)
  - não conhece regras de domínio específicas (GitHub/Jira/etc.)

- `modules/`
  - organiza cada domínio/fonte (`github`, `jira`, `stackoverflow`, `jobs`)
  - expõe:
    - `*Service` (HTTP por domínio) -> Responsável por buscar ou enviar dados para o backend de cada domínio.
    - `*Queries` (hooks `useQuery`) -> Permite buscar e manter dados atualizados automaticamente na interface.
    - `*Mutations` (hooks `useMutation`) -> Permite enviar ou alterar dados no backend a partir da interface.

## Fluxo com o backend

`Componente` -> `*Queries e *Mutations (React Query)` -> `*Service ` -> `api/endpoints + apiClient` -> `Backend`

## Como criar um novo módulo (ex.: `reddit`)

1. Adicione rotas/tipos em `api/endpoints.ts` (se necessário).
2. Crie `src/data/modules/reddit/` com:
   - `redditService.ts`
   - `redditQueries.ts`
   - `redditMutations.ts`
3. Replique o padrão de comentários curtos explicando cada função pública.
4. Adicione as `queryKeys` do módulo em `src/data/query/keys.ts` (para cache e invalidação consistentes).
5. Exporte no `src/data/index.ts`.
6. Consuma nas páginas via hooks (`useReddit...Query`, `useReddit...Mutation`).

## Observação importante

Os services podem retornar payload já “desembrulhado” (`res.data`) porque `apiClient.ts` usa interceptor de resposta.
Se a tipagem do Axios divergir disso, corrija no service (não na página).
