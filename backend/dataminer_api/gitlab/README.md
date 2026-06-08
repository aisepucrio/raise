# GitLab Mining Module

Este app espelha a estrutura do app `github`, mas usando a API do GitLab.

Recursos suportados:
- Commits
- Issues
- Merge requests expostas na API como `pull-requests`
- Branches
- Metadata de projeto
- Dashboards e exportacao

Documentacao complementar:

- Modelagem de dados GitLab: [`docs/gitlab-data-model.md`](/c:/Users/alexa/stnl-dataminer-api/docs/gitlab-data-model.md)
- Fluxo de mineracao GitLab: [`docs/gitlab-mining-flow.md`](/c:/Users/alexa/stnl-dataminer-api/docs/gitlab-mining-flow.md)

Configuracao esperada no `.env`:

```env
GITLAB_TOKENS="token1,token2"
GITLAB_BASE_URL="https://gitlab.com/api/v4"
```

Se `GITLAB_BASE_URL` nao for definido, o default usado sera `https://gitlab.com/api/v4`.
