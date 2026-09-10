# Antiquário de Relíquias Mágicas de Bragança

Catálogo web de itens mágicos para uma campanha de D&D, alimentado por uma planilha do
Google Sheets que o mestre mantém como fonte da verdade. O app (Next.js, App Router) lê a
planilha em tempo de build/revalidação, transforma cada linha em um item de catálogo, valida
consistência (IDs únicos, RD sem duplicidade, preços válidos) e renderiza uma vitrine
pesquisável e filtrável com dois sistemas de moeda (Economia de Bragança e Padrão D&D).

## Configuração

Copie `.env.example` para `.env.local` e preencha as quatro variáveis obrigatórias:

| Variável | Descrição |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | E-mail da service account do Google Cloud usada para ler a planilha. |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Chave privada (PEM) da mesma service account. |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ID da planilha do Google Sheets (retirado da URL da planilha). |
| `REVALIDATE_SECRET` | Segredo usado para autorizar a revalidação manual (veja abaixo). |

**A planilha do Google Sheets precisa ser compartilhada com o e-mail da service account
(`GOOGLE_SERVICE_ACCOUNT_EMAIL`) com permissão de "Leitor" (viewer).** Sem isso, a leitura da
planilha falha com erro de permissão.

## Revalidação (ISR)

A página inicial usa Incremental Static Regeneration com `revalidate = 300`, ou seja, o
catálogo é automaticamente revalidado a cada 5 minutos — qualquer alteração feita na planilha
aparece no site em até esse intervalo, sem necessidade de novo deploy.

Para forçar a revalidação imediatamente (por exemplo, logo após editar a planilha), chame:

```
GET /api/revalidate?secret=<REVALIDATE_SECRET>
```

usando o valor configurado em `REVALIDATE_SECRET`. A resposta é `{ ok: true, revalidated: true }`
em caso de sucesso, ou `401` se o segredo estiver incorreto ou não configurado.

## Comandos

```bash
npm install       # instala as dependências
npm run dev       # inicia o servidor de desenvolvimento em http://localhost:3000
npm test          # roda a suíte de testes (vitest)
npm run build     # gera o build de produção
```
