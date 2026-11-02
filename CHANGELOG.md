# Histórico de versões — Cidade dos Negócios

## 1.1.1-rc.1 — hotfix: filtros financeiros manuais

- Seletores de data de corte, dia, mês, trimestre, semestre, ano e intervalo personalizado.
- Referência consultada deixa de mudar automaticamente com a passagem dos dias.
- Motor aceita semestre e intervalo, com validação de datas e recortes do ledger.
- Botão manual para carregar a última data concluída.
- Sem mudança no GameState, no formato dos saves ou nas operações econômicas; novos testes de regressão.

## 1.1.0-rc.1 — 01/11/2026 (patch de gestão; candidata em testes)

- Histórico de preços da empresa baseado nos eventos de alteração já presentes nos saves anteriores.
- Atalhos de quantidades de estoque: 10, 50, 100 e 250 unidades. A compra ainda exige confirmação.
- Demonstrativo financeiro por dia, competência mensal, trimestre, ano ou carreira inteira, com data de referência.
- Receita, CMV, lucro bruto, despesas e resultado são fluxos do intervalo; caixa, estoque e obrigações são saldos acumulados.
- `schemaVersion: 2` e operações econômicas preservados, sem alteração tributária nem migração exigida.
- Testes de compatibilidade e cálculos por competência acrescentados; homologação da V1.1 no Windows pendente.

## 1.0.1-rc.1 — 01/11/2026 (hotfix homologado pelo usuário)

- Destaque visual legível do lote selecionado; remove rótulos numéricos permanentes no mapa para evitar poluição.
- Exibe preço atual da empresa separado do preço de referência do concorrente.
- Confirma a alteração do preço com o valor antigo e o novo, mantendo registro no journal de eventos.
- Retém formato do save (`schemaVersion: 2`), lógica econômica, transparência fiscal e compatibilidade com a V1 anterior.
- Homologação funcional confirmada pelo usuário: atualização pelo BAT, leitura automática do último save sem reimportação e precificação visual aprovada.
- Instantâneo preservado em `releases/v1.0.1-homologada` (commit `6d6321622df0d0337e783e13a4da868db2c10831`).

## 1.0.0-rc.1 — 01/11/2026 (candidata jogável; publicação e homologação pendentes)

- Primeira economia executável: três tipos de loja, capital, abertura, compra/estoque, precificação, vendas, despesas e ledger em centavos com partidas equilibradas.
- Mundo com 30 cidades e 27 UFs; mapas isométricos ilustrativos clicáveis, sem fingir geografia real.
- Comandos transacionais com revisão única, idempotência, RNG persistente e auditoria de eventos.
- IA básica de preços dos concorrentes; simulação de 1/7/30 dias com datas determinísticas.
- Interface azul-marinho/dourado, mapa principal, abas Empresa/Mercado/Finanças/Fiscal/Sistema e layout responsivo.
- Exportação/importação de save JSON com checksum; migração conservadora de fundação CP-000 vazia; autosave local de melhor esforço.
- Fiscal com `NOT_COVERED`: nenhum cálculo de tributo ou declaração de legalidade simulada.
- Testes automatizados, geração de HTML único e verificações em Chromium isolado.
- **Não homologado:** validação do `file://` em Windows, funcionamento real do atualizador com repositório publicado e integrações fiscais ainda pendentes.

## 0.0.1 — CP-000/CP-001 (fundação)

- HTML de infraestrutura sem mecânicas; scripts de atualização e publicação; documentação de arquitetura.
