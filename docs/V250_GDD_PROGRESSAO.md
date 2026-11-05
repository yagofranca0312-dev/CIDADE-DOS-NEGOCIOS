# V2.5.0 — GDD do ciclo empresarial: objetivos, progressão e escolhas

**Versão deste contrato:** 1.0 · 05/11/2026. **Primeira implementação planejada:** `2.5.0-alpha.1`. **Base estável:** `releases/v2.4.1-homologada`. **Estado:** ciclo iniciado, NÃO homologado.

## Visão de produto

O jogador é empreendedor de uma rede de até cinco empresas nas 30 cidades do mundo disponível. O objetivo não é acumular pontos decorativos: é crescer por decisões comerciais que produzem eventos, lançamentos, estoque, caixa, lucro, passivos e um histórico verificável no motor.

**Loop oficial:** investir → decidir sobre preço, estoque e equipe → operar/avançar tempo → observar efeitos no ledger e no mundo → comparar com objetivo mensurável → escolher próximo risco/ação → repetir.

### Horizonte das metas

| Horizonte | Desafio | Base observável | Feedback |
|---|---|---|---|
| Curto (1–7 dias) | Abrir loja, comprar mercadorias, concretizar a primeira venda | EMPRESA.ABERTA, PURCHASE/RECEIPT/SALE, estoque | Progresso na Jornada |
| Médio (30–90 dias) | Reserva de caixa, margem de 30 dias, faturamento comprovado, abrir filial | CASH, REVENUE, COGS, EXPENSE, calendário, unidades | Metas de operações/finanças |
| Longo (365 dias e adiante) | Rede regional, conglomerado diversificado, gestão sustentável de compromissos | Unidades/cidades, receita acumulada, dias operados e balanço | Evolução de patamar calculado |

## Contrato da fonte de verdade

1. **Uma missão deriva do estado confirmado da carreira.** Sem contadores paralelos no HTML, sem "marcar como concluída" por clique.
2. **Vendas e receitas** vêm de lançamentos `SALE` no ledger, não de potencial perdido nem de compras. Capital próprio e empréstimos não contam como receita.
3. **Lucro/margem** vêm de receita − CMV − despesas do intervalo encerrado; margem não pode ser "ganha" com estoque comprado.
4. **Caixa** é do grupo; não inventar conta individual por filial. Reserva mínima considera despesas fixas diárias das unidades atuais.
5. **Níveis** são funções puras de métricas verificáveis, calculadas a cada consulta; nenhum prêmio financeiro nem múltiplos lançamentos ao consultar.
6. **Conquistas** são reconhecimentos por evidências históricas de compras, vendas, abertura e saneamento, não bônus de moeda. Uma mesma venda nunca gera prêmio repetido.
7. **Migração:** `schemaVersion=9` e save exportado permanecem iguais na candidata; o módulo lê saves legados sem "conceder" pagamentos retroativos.
8. **Períodos futuros:** metas mensais exigem tempo jogado suficiente; não premiar lucro artificialmente após um único dia.
9. **Feedback de progresso** informa motivo de bloqueio e próxima ação possível, inclusive sem conhecimentos avançados de contabilidade.
10. **Recompensas econômicas, reputação com impactos e eventos decisórios** exigem projeto e testes independentes antes de mutar o estado do jogo. Não simulá-los em `alpha.1`.

## Níveis do empreendedor (proposta inicial para calibração)

- **Em preparação:** ainda não abriu unidade.
- **Negócio local:** pelo menos uma unidade; patamar base, sem "prêmio" por simples abertura.
- **Rede regional:** pelo menos **3 unidades**, em **2 cidades**, **90 dias** de operação e **R$ 100.000** de receita acumulada realizada. Critérios simultâneos.
- **Conglomerado:** pelo menos **5 unidades**, em **3 cidades**, **365 dias** e **R$ 750.000** de receita acumulada realizada. Critérios simultâneos.
- Os patamares são design **simulado e ajustável**; calibrar usando carreiras reais do jogo. Não presumir equilíbrio até testes de 30 e 90 dias.
- O nível é uma classificação de progresso; não altera demanda, custo, imposto, RNG, caixa ou score econômico.

## Objetivos operacionais e financeiros (primeiro lote)

1. Abrir a primeira empresa (1 unidade).
2. Realizar a primeira venda (lançamento `SALE`).
3. Concluir sete dias operacionais.
4. Reunir trinta dias de carreira.
5. Atingir R$ 20.000 de receita confirmada (sem aportes).
6. Inaugurar a primeira filial (2 unidades).
7. Operar em duas cidades (2 cidades distintas).
8. Obter **margem operacional de pelo menos 10%** nos últimos 30 dias encerrados, com trinta dias jogados e pelo menos R$ 10.000 de receita no período.
9. Reservar **30 dias de despesas fixas** em caixa após 30 dias de carreira, sem confundir contas a pagar com dinheiro disponível.
10. Faturar R$ 100.000 e operar por 90 dias.
11. Atingir requisitos da rede regional.
12. Atingir requisitos do conglomerado.

Todas as metas têm `id`, `label`, `current`, `target`, `progressPct` e `completed`, mais `evidence` explicando o cálculo. Para metas compostas, o avanço considera o requisito menos atendido; não há "nível grátis" baseado num só indicador.

## Conquistas e desbloqueios

- **Primeira venda**, **primeira filial**, **primeira quitação operacional**: selos de reconhecimento produzidos por histórico confirmado.
- **Desbloqueios da alpha.1:** somente *orientação visual e novos painéis explicativos*; **não há dinheiro, estoque, crédito, cliente ou licença concedido pelo módulo**.
- Qualquer recompensa econômica futura deverá ser auditada por comando único com ID/idempotência e testes de repetição e importação.

## Reputação — proposta para a alpha.3 (ainda não implementada)

Critérios derivados de contas operacionais quitadas, frequência de ruptura de estoque, prazos e obrigações do jogo. Usar faixas com janelas observáveis (ex.: 30/90 dias), efeitos limitados e auditáveis; nunca classificar uma nova empresa com nota alta por ausência de amostras. Distinguir reputação de receita, margem, crédito e de cumprimento fiscal real.

## Seis dilemas previstos (apenas design; efeitos ainda não implementados)

1. **Caixa x estoque:** encomendar produtos para evitar ruptura ou preservar capital de giro.
2. **Preço x volume:** reduzir margem via promoção temporária ou preservar lucro por unidade.
3. **Equipe x liquidez:** contratar com bônus comercial e folha futura ou evitar custo fixo.
4. **Expansão x robustez:** abrir filial ou manter reserva para despesas da rede.
5. **Fornecedor x prazo:** fornecedor mais barato e lento ou mais caro e rápido.
6. **Quitar passivo x operar:** liquidar contas a pagar ou realizar compra essencial ao estoque.

Cada dilema deve apresentar consequências verificáveis no próprio motor; não criar "pontos de escolha" desconectados. Para comprovar o checkpoint, os seis precisam de alternativas efetivamente utilizáveis e regressões por ação.

## Tutorial opcional

O roteiro inicial sugerido é: abrir → comprar → aguardar entrega → avançar para vender → conferir receita e caixa → selecionar próximo objetivo. O jogador pode ignorá-lo; não precisa entender DRE para seguir. A eficácia depende de validação com pessoa real, não apenas teste de HTML.

## Divisão incremental e critérios de entrega

| Patch | Entrega | Status inicial |
|---|---|---|
| **alpha.1** | GDD, relatório de níveis/metas derivadas e apresentação inicial da Jornada | Em implementação |
| **alpha.2** | Conquistas auditáveis, feedback contextual e tutorial opcional | Planejado |
| **alpha.3** | Reputação inicial com efeitos explícitos e limites | Planejado |
| **alpha.4** | Seis dilemas integrados aos comandos econômicos reais | Planejado |
| **RC / 2.5.0** | Equilíbrio 30/90 dias, QA real no navegador/Windows, saves, aceite | Planejado |

## Checkpoints do usuário (0/8 → registrar apenas o verificado)

- [x] **01 GDD do ciclo de jogo** — loop, horizontes e papel do empreendedor documentados aqui.
- [ ] **02 Níveis empresariais** — implementar e testar patamares sem prêmio duplicado.
- [ ] **03 Objetivos de finanças e operações** — implementar progresso rastreável, testes de fonte e save.
- [ ] **04 Conquistas e desbloqueios** — selos visuais não contam como sistema completo de desbloqueios.
- [ ] **05 Reputação empresarial inicial** — implementar impactos de pequena escala e medir.
- [ ] **06 Desafios com escolhas** — seis dilemas operacionais com alternativas e efeitos testados.
- [ ] **07 Tutorial opcional e primeiro objetivo** — usabilidade real sem exigir contabilidade.
- [ ] **08 GATE diversão e equilíbrio** — 30/90 dias, regressões, QA Windows e aceite formal do titular.

**Regra de release:** uma candidata pode estar na branch ou publicada para testes sem estar homologada. **Somente `2.5.0` estável** após gates e aceite expresso. Saves reais nunca usados nas fixtures de QA.
