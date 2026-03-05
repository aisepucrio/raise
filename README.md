# raise

## Como ligar e acessar o frontend (passo a passo)

1. Entre na pasta do frontend:

```bash
cd frontend
```

2. Instale as dependências:

```bash
npm install
```

3. Configure a variável de ambiente em `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000 (ou o local do backend)
```

4. Suba o servidor de desenvolvimento:

```bash
npm run dev
```

5. Acesse no navegador a URL mostrada no terminal (normalmente `http://localhost:5173`).

## Documentação detalhada do frontend

A documentação completa de arquitetura, módulos e fluxo está em:

- [README.md](frontend/README.md)
