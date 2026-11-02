# Histórico de versões — Cidade dos Negócios

## 1.2.0-rc.1 — gestão comercial multitem (candidata)

- Três SKUs iniciais por ramo e cadastro de novos produtos até 40 por estabelecimento.
- Compras de estoque por produto e fornecedor fictício, com custo unitário, caixa e valor de inventário reconciliados.
- Carrinho com venda à vista de múltiplos itens, receita e CMV registrados atomicamente, além de vendas diárias simuladas por SKU.
- Painel de desempenho por produto e últimos movimentos comerciais.
- Migração validada de saves schema 2 para schema 3, preservando economia anterior e histórico agregado sem criar detalhes retroativos inexistentes.
- **Não é retrocompatível com a V1.1.1:** exporte backup JSON antes de atualizar. A migração é somente para frente.
- Mantém filtros financeiros manuais, integridade contábil e transparência fiscal `NOT_COVERED`.
- Homologação prática no Windows pendente.

## 1.1.1-rc.1 — hotfix de filtros financeiros manuais

- Relatório não acompanha automaticamente o avanço dos dias do mundo.
- Campos especializados: data de corte, dia, competência mês/ano, trimestre/ano, semestre/ano, ano e intervalo inicial–final.
- Novo recorte `semester` e `range` no relatório financeiro, sem alteração do ledger ou dos saves.
- Validação de datas impossíveis, intervalos invertidos e datas futuras do jogo.
- Botão opcional para selecionar a última data concluída explicitamente.
- Testes de regressão para recortes, isolamento de dados, preservação de save e interface.

## 1.1.0-rc.1 — 01/11/2026 (patch de gestão; candidata a homologação)

- Histórico consultável de alterações de preços, inclusive eventos presentes nos saves da V1.0.1.
- Atalhos que preenchem quantidades de compra (10, 50, 100, 250), sem compra automática.
- Demonstrativos por dia, competência mensal, trimestre, ano ou carreira inteira, com seleção da data de referência.
- Lucro bruto, CMV e resultado operacional derivados do ledger; saldos de caixa/estoque/obrigações sempre acumulados até a data-limite e devidamente rotulados.
- Sem mudança de `schemaVersion: 2`, sem migração de saves, sem alteração na lógica dos preços/vendas ou nos tributos não cobertos.
- Testes de compatibilidade e cálculos históricos acrescidos. Validação real da atualização no Windows pendente.


## 1.0.1-rc.1 — 01/11/2026 (hotfix HOMOLOGADO pelo usuário)

- Destaque visual legível do lote selecionado; remove rótulos numéricos permanentes no mapa para evitar poluição.
- Exibe preço atual da empresa separado do preço de referência do concorrente.
- Confirma a alteração do preço com o valor antigo e o novo, mantendo registro no journal de eventos.
- Retém formato do save (`schemaVersion: 2`), lógica econômica, transparência fiscal e compatibilidade com a V1 anterior.
- Aprovado em uso real pelo usuário: atualização via BAT, persistência automática da carreira sem reimportação e clareza do novo preço; homologação funcional confirmada.
- Status: base funcional homologada; evidência do usuário não equivale a auditoria externa universal.

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
