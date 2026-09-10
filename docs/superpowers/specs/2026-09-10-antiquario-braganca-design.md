# Antiquário de Relíquias Mágicas de Bragança — Design

> Consolida as decisões tomadas em brainstorming (2026-09-10) a partir do plano inicial
> (`plano-antiquario-braganca.md`, anexado pelo usuário) e das iterações de mockup visual.
> Substitui o MD original como fonte de verdade — o MD segue como contexto histórico.

## 1. O que é

Catálogo web, somente leitura, dos itens mágicos à venda no "Antiquário de Relíquias
Mágicas de Bragança" — usado por um mestre de D&D para apresentar itens aos jogadores.
Tema visual: relicário imperial luso-brasileiro.

## 2. Arquitetura

```
Google Sheets (só o mestre edita)
        │  service account (leitura)
        ▼
Pipeline de sincronização → JSON validado
        │
        ▼
Next.js (Vercel) — ISR, revalida a cada 5 min + endpoint de revalidação manual
        │
        ▼
Jogadores navegam, buscam e filtram (desktop)
```

- **Sem CRUD, sem tela de login.** Controle de acesso = compartilhamento da planilha do
  Google. O site nunca escreve na planilha.
- **Planilha = dado bruto do mestre. Site = toda apresentação** (incluindo formatação de
  preço/moeda — ver seção 6). Nenhuma lógica de exibição vive na planilha.
- Excel original (`Antiquário de relíquias mágicas Bragança V4.xlsx`) mantido como
  backup histórico; Google Sheets é a única fonte de verdade daqui em diante.

## 3. Modelo de dados

### 3.1 Planilha (já migrada, ver `Antiquario-Braganca-migrado.xlsx`)

5 abas por raridade (`Common`, `Uncommon`, `Rare`, `Very Rare`, `Legendary`), cada uma
**uma única tabela** (não mais 5 tabelas lado a lado por categoria — mudança feita
propositalmente para eliminar duplicação de itens entre categorias). Colunas:

| Coluna | Tipo | Observação |
|---|---|---|
| `ID` | texto | `{RARIDADE}-{seq:03d}`, ex. `COM-001`. Estável, não deriva do nome. |
| `Name` | texto | |
| `Arcana` / `Armamentos` / `Implementos` / `Relíquias` / `Consumíveis` | booleano | Um item pode marcar mais de uma. |
| `Price` | fórmula | `=10^((Rating/10)*(Ref!maxExp-Ref!minExp)+Ref!minExp)`, linha de `Ref` fixa por raridade. |
| `Attun` | booleano | |
| `Type` | texto | |
| `Source` | texto | pode ficar vazio |
| `Tipo de modificação` | lista | `Original` / `Simples` / `Completa` |
| `Texto da modificação` | texto | só preenchido quando `Completa` |
| `Rating` | número 0–10 | **uso exclusivo do mestre — nunca sincronizado para o site** |
| `RD Arcana` / `RD Armamentos` / `RD Implementos` / `RD Relíquias` / `RD Consumíveis` | número | índice de sorteio por dado, escopado por (raridade × categoria); só preenchido nas categorias que o item marca |

Abas `Ref` (expoentes log por raridade) e `Infos` (regras homebrew de progressão) mantidas
sem alteração.

### 3.2 Regras de migração já aplicadas

- Itens com mesmo nome em categorias diferentes da mesma raridade foram **mesclados em
  1 item** com múltiplas categorias marcadas (decisão do mestre).
- 5 conflitos onde o mesmo nome tinha `Rating` diferente entre categorias foram mesclados
  usando o **Rating mais alto**.
- `"Weapon of Throne's Command"` estava duplicado dentro da mesma categoria (erro de
  dado) — mantida 1 linha, `Rating` forçado para `7`.
- Cor de fonte do Excel **não carrega significado sistemático** — ignorada pelo pipeline.
  Substituída pelas colunas explícitas `Tipo de modificação` / `Texto da modificação`.
- Coluna `Class` (lixo, presente só na tabela Arcana da aba `Rare`) descartada.

### 3.3 JSON gerado pelo pipeline

Um item = `{ id, name, rarity, categories[], priceGp, attun, type, source,
modification: { kind, text } | null, rd: { [categoria]: number } }`.

- `rating` **nunca** entra no JSON.
- `rd` entra no JSON mas **não é exibido na UI no MVP** — fica pronto para a futura
  feature de "sortear item aleatório" (fora do MVP).

### 3.4 Validações do pipeline (rodar antes de publicar)

- Nenhum `RD` duplicado dentro do mesmo grupo (raridade × categoria).
- Nenhum `ID` duplicado dentro da mesma raridade.
- Alertar (não bloquear) sobre `Source` vazio — é aceitável.

## 4. Sincronização

- **ISR (Incremental Static Regeneration)** no Next.js: revalidação automática a cada
  **5 minutos**, sem ação do mestre.
- **Endpoint de revalidação manual**: rota protegida por um segredo simples na URL
  (não é autenticação de usuário, é um link só o mestre conhece) que força rebuscar a
  planilha na hora. Ex.: `/api/revalidate?secret=<token>`.
- Sem SSR puro (evita bater na API do Google a cada visita de jogador) e sem build
  manual como único gatilho (o MD original cogitava isso, mas ISR resolve melhor).

## 5. Funcionalidades do MVP

- Catálogo navegável das 5 raridades × 5 categorias (categoria agora é atributo
  multi-valor do item, não mais uma tabela separada).
- Busca por nome.
- Filtros por raridade e por categoria (filtro por tipo/attunement/faixa de preço fica
  para depois — extensão simples sobre a mesma UI, não bloqueia o MVP).
- Cada item exibe: nome, preço (ver seção 6), raridade, categoria(s), tipo, attunement,
  fonte.
- Selo de modificação clicável (só em itens com `Tipo de modificação != Original`) → modal
  com o texto escrito pelo mestre.
- **Sem "modo mestre"** no MVP — não há necessidade: `Rating` nunca sai da planilha, e
  `RD` fica no JSON mas oculto da UI. Nada sensível precisa de senha por enquanto.
- Foco desktop, sem otimização mobile nesta fase.

## 6. Sistema monetário

Dois problemas resolvidos nesta seção: preços fracionários "quebrados" vindos da fórmula
log, e o fato de o mestre ter uma economia de campanha própria (tudo ÷10 em relação ao
padrão D&D: platina→ouro, ouro→prata, prata→cobre).

### 6.1 Quebra em moedas (po/pr/pc/pp)

Para um valor em ouro (`gp`), **sempre calculado no site, nunca na planilha**:

1. `poInteiro = floor(gp)`
2. `prInteiro = floor((gp - poInteiro) * 10)`
3. `pcFinal = round(((gp - poInteiro) * 10 - prInteiro) * 10)` — arredonda só aqui, no
   final da cadeia (nunca nos passos intermediários). Cascateia carry se `pcFinal === 10`
   ou `prInteiro === 10`.
4. Se `poInteiro >= 1000`: `ppInteiro = floor(poInteiro / 10)`, `poInteiro = poInteiro % 10`
   (razão padrão D&D, 1 pp = 10 po — só é exibida quando o valor em ouro já passou de
   1000, para não poluir itens baratos/médios com platina).
5. Denominações com valor 0 não são exibidas (exceto se todas forem 0 — nesse caso mostra
   `0 po`).

Implementado e validado no mockup (`breakIntoCoins` / `coinsMarkup`).

### 6.2 Dois sistemas monetários

- **Economia de Bragança** (padrão, o que o mestre usa nas campanhas atuais): valor da
  planilha `× 0.1` antes de quebrar em moedas.
- **Padrão D&D**: valor da planilha sem alteração.
- Alternador **visível a qualquer jogador** (não é modo mestre), no topo do catálogo,
  junto da busca. Abre sempre em "Economia de Bragança".

## 7. Direção visual (validada em mockup — ver Artifact publicado)

**Paleta** — restrição explícita do usuário: nada de verde saturado (bandeira do Brasil)
nem amarelo berrante.

| Token | Uso | Claro | Escuro |
|---|---|---|---|
| `--bg` / `--surface` | fundo / cartão | pergaminho `#EDE3CB` / `#F5EEDC` | verde quase-preto `#0F1B15` / `#182A20` |
| `--ink` | texto | sépia `#2B2116` | pergaminho `#ECE0C0` |
| `--brand` | masthead | verde imperial profundo `#1C3B2E` | `#0A1711` |
| `--gold` / `--gold-strong` | dourado nobre (não amarelo) | `#8C641F` / `#6E4E17` | `#D3AC5D` / `#E6C57A` |
| `--seal` | selo de modificação (lacre) | grená `#7A2331` | `#C15C68` |
| `--rarity-*` (5) | faixa por raridade | pedra/verde/safira/ametista/âmbar, recalibradas nessa paleta (não o verde/roxo/laranja padrão de D&D) | idem, ajustado pro fundo escuro |
| `--coin-pp/pr/pc` | moedas | azul-acinzentado / cinza-prata / cobre | idem, mais claros |

**Tipografia**: `Cinzel` (masthead + rótulos de categoria da régua lateral, uso
restrito), `Cormorant Garamond` (nome dos itens, corpo, modal), `Inter` (busca, filtros,
preços — mantém a camada funcional legível em meio à ornamentação).

**Layout**: masthead com brasão (SVG inline) → barra com busca + pílulas de raridade +
alternador de moeda → régua lateral de categorias (estilo etiqueta de gaveta de museu) +
grid de cards estilo "placa catalogada" (canto dobrado colorido por raridade, sem sombra
pesada, borda fina).

## 8. Stack técnica

- **Frontend**: Next.js (React) + Tailwind CSS.
- **Dados**: Google Sheets API via service account (credencial em variável de ambiente,
  nunca commitada) → JSON no build + revalidação ISR.
- **Hospedagem**: Vercel.
- **Sem backend de autenticação.**

## 9. Ordem de construção

1. ~~Migrar planilha para a estrutura nova~~ **(feito)**.
2. Pipeline de dados isolado (ler Sheets → JSON), com os testes de validação da seção
   3.4, antes de desenhar qualquer tela real.
3. Catálogo mínimo funcional (lista + busca + filtros), sem tema.
4. Aplicar o tema visual da seção 7 (já validado em mockup).
5. Selo + modal de modificação.
6. Sistema monetário completo (seção 6) integrado ao catálogo real.
7. Deploy na Vercel com ISR + endpoint de revalidação manual.
8. *(Fora do MVP)* Modo mestre, sorteio por RD.

## 10. Decisões que ficam registradas como fechadas

Substituem a seção 11 ("decisões em aberto") do MD original:

- ID único: `{RARIDADE}-{seq:03d}`.
- Paleta: fechada nesta spec (seção 7).
- Excel: mantido como backup; Sheets é fonte de verdade.
- Modo mestre: fora do MVP.
- `Rating`/`RD`: `Rating` nunca sai da planilha; `RD` vai no JSON mas fica oculto na UI
  até a feature de sorteio ser construída.
