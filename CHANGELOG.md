# Histórico de versões — Cidade dos Negócios

## 1.6.0-rc.1 — economia regional (02/11/2026)

- Inclusão verificada dos códigos IBGE e população estimada 2026 dos 30 municípios, com fonte, período e versão offline.
- Modelagem fictícia de diferenças regionais: fator de demanda de 80% a 130%, elasticidade de preços e referência concorrencial por porte.
- Observatório econômico separa indicador oficial de parâmetro simulado; PIB 2023 e REGIC 2018 aparecem explicitamente como não integrados.
- Distritos isométricos com skyline, altura e densidade ilustrativos por faixa de porte, mantendo 18 lotes interativos.
- Save schema 7; preservação de filiais, estoques, RNG, saldos, ledger, eventos e históricos existentes; mudança apenas na simulação futura.
- V1.5 homologada no Windows; snapshot de recuperação preservado. V1.6 candidata aguardando homologação.

## 1.5.0-rc.1 — expansão empresarial (02/11/2026)

- Até cinco estabelecimentos em cidades, setores e lotes distintos, com caixa compartilhado e operações separadas.
- ID de estabelecimento vinculado a lançamentos novos e aos indicadores de cada filial; matriz recebe historicamente lançamentos legados, sem modificar valores anteriores.
- Visões financeiras consolidadas ou individuais; caixa não é dividido artificialmente.
- Demanda compartilhada entre estabelecimentos do mesmo ramo/cidade; simulação econômica única por calendário.
- Migração validada schema 2/3/4/5 → 6; backup anterior à atualização é indispensável para rollback.
- V1.4 validada no Windows pelo jogador e preservada em `releases/v1.4.0-homologada`.
- Testes estruturais, econômicos e navegador. V1.5 ainda aguarda homologação no Windows.

## 1.4.0-rc.1 — estratégia e equilíbrio econômico (02/11/2026)

- Campanhas de desconto por SKU e prazo determinado; motor altera preço efetivo e elasticidade da demanda sem trocar preço de tabela ou criar vendas manuais.
- Painel de capital de giro, cobertura de caixa, ponto de equilíbrio aproximado e riscos.
- Custos variáveis (CMV), despesa fixa operacional e despesa não recorrente separados no realizado.
- Cenários puros de 7/30/90 dias com estoque, recebimentos previstos, caixa e obrigações estimados; nenhuma projeção se transforma em lançamento.
- Backtests determinísticos 90/180/365 dias e regressões de migração de saves.
- Save schema 5 com migração conservadora de 2/3/4; versões antigas não leem schema 5.
- V1.3 homologada no Windows pelo usuário e preservada; V1.4 ainda aguarda homologação prática.

## 1.3.0-rc.1 — inteligência de mercado e abastecimento (01/11/2026)

- Demanda diária estimada para todos os SKUs, inclusive sem estoque; apuração de não atendidos e potencial de faturamento perdido (sem reconhecimento contábil de receita não realizada).
- Preços por fornecedor e prazos de entrega simulados; limite diário de fornecimento por produto.
- Pedidos pagos contabilizados como ativo em trânsito; entregas no vencimento movimentam ativo para inventário sem movimentar caixa novamente.
- Valoração de estoque com custo médio ponderado por SKU, CMV conciliado em centavos.
- Estoque mínimo, meta, cobertura prevista e sugestão de reposição, sempre com confirmação manual de encomendas.
- Schema 4 com migração conservadora de versões 2 e 3; necessidade de backup antes da atualização. Sem alteração de dados históricos de vendas e CMV.
- Bateria de testes estruturais, contábeis, integração e interface; homologação no Windows ainda pendente.

## 1.2.1-rc.1 — hotfix de vendas automáticas (01/11/2026)

- Bloqueia novas vendas manuais no motor e remove carrinho/checkout da UI.
- Apresenta painel de demanda e vendas simuladas com resultados por SKU e comprovantes consolidados do dia.
- Registra estimativa apenas quando há estoque, atendidas e não atendidas em eventos de auditoria.
- Mantém registros manuais anteriores íntegros, sem alterar caixa, CMV, datas ou ledger histórico.
- Preserva schema 3 e os números da simulação econômica anterior; novas observações não mudam o RNG.
- Validada pelo usuário em Windows; preservada na branch releases/v1.2.1-homologada.

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
