# Cidade dos Negócios — V3.0.0-alpha.1 · Patch A: Economia e Balanceamento

**Data:** 07/11/2026. **Status:** candidata técnica validada por CI, **NÃO HOMOLOGADA**. Aguardar integração à `main`, CI final, QA Windows e aceite do jogador.  
**Base estável:** `releases/v2.9.0-homologada` — SHA `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`.  
**Próxima etapa:** Patch B — sistema fiscal 2027, somente após aprovação do Patch A.

## Problema comprovado, hipótese e decisão

A V2.9 encontrou demanda não atendida de **100%** em 90 dias com três lojas abertas e de **59,7%** em uma carreira de 365 dias com cinco unidades. O primeiro cenário gasta quase todo o capital inicial com aberturas e **não faz qualquer compra de mercadoria**, deixando lojas sem estoque. O segundo mostra ruptura operacional apesar de caixa positivo. Nenhum dado comprova que a fórmula econômica precise ser aumentada artificialmente.

**Hipótese testável:** disponibilizar cenários, reserva de custos fixos e uma compra planejada com confirmação permite ao jogador operar sem recorrer a vendas fictícias, enquanto estratégias arriscadas continuam podendo fracassar. O Patch A **não altera** demanda global, elasticidade, preço do rival, juros, tributo, salários, custos diários, capital inicial ou histórico de vendas.

## Contratos dos oito checkpoints

| CP | Componente | Critério objetivo | Estado |
|---|---|---|---|
| 01 | Diagnóstico das causas de ruptura | Registrar cenários sem estoque, falta de capital e demanda sem compra | Implementado; CI candidata PASS |
| 02 | Planos de risco | Três perfis: conservador (14 dias de reserva; atacado; 4 dias de cobertura), equilibrado (7; regional; 7), agressivo (3; regional; 12) | Implementado; CI candidata PASS |
| 03 | Cálculo não mutante por produto | Demanda observada dos últimos 7 registros ou parâmetro inicial, estoque físico, fornecedor, trânsito, capacidade e margem | Implementado; CI candidata PASS |
| 04 | Reserva financeira | Orçamento de compra = caixa atual menos dias de custo fixo do grupo, sem supor entrada de receita. Passivos são **informados**, não quitados pela reserva | Implementado; CI candidata PASS |
| 05 | Compra realmente confirmada | `ECONOMIA.COMPRAR_PLANO` compara ID/cotação/revisão, usa `registerPurchase` e mantém débito IN_TRANSIT/crédito CASH, sem receita/CMV/credito automático | Implementado; CI candidata PASS |
| 06 | Sensibilidade de preços | Alternativas de ±8% sobre preço atual, com elasticidade **aproximada**, sem alterar os preços nem garantir demanda futura | Implementado; CI candidata PASS |
| 07 | Integração Mercado e regressões | Painel, 15 testes novos, economia 30/90/365 dias, benchmark legado até 1.825/1.832 dias, QA manual previsto | **331/331 testes PASS; 6 famílias de benchmarks PASS** |
| 08 | Release Patch A | CI do branch + CI da main, HTML offline reproduzível, checkpoint candidato e teste Windows do jogador; aceite formal separado | **PENDENTE** |

## Regras do motor

- **Não há compra automática.** O usuário vê `spendCents`, `cashCents`, `reservedCents`, `remainingReserveCents` e possíveis alertas e só compra se clicar e confirmar. Não altera `rng` em consultas.
- `operationalBalanceReport(state, mode)` é puro e calcula produtos para a **unidade ativa**. Os `mode` válidos são `conservador`, `equilibrado` e `agressivo`. O saldo é do grupo; abertura de unidades não cria nova conta bancária.
- Itens são priorizados pela **menor cobertura de estoque** observada. Nenhum SKU com preço de venda igual/inferior ao custo de aquisição recomendado é comprado automaticamente pelo plano. O jogador ainda pode usar o pedido manual existente, por decisão própria.
- O pedido leva em conta pedidos anteriores, transfers inbound pendentes, capacidade unitária de **100.000**, limite fornecedor por SKU/dia e orçamento após reserva. O core recalcula a cotação no mesmo instante da compra.
- O comando `ECONOMIA.COMPRAR_PLANO` exige `businessId`, `mode`, `revision` e `quoteId`, recusando cotação desatualizada. Compra confirmada usa operações físicas/contábeis existentes, registro auditado e idempotência via ID do comando.
- Os preços exibidos de ±8% e margens brutas potenciais são **sensibilidades estáticas** a partir da elasticidade do motor, sem concorrentes reagirem, com disponibilidade de estoque presumida, sem projeção de tributos e sem lucro garantido. Alteração de preço real continua no comando separado `PRECO.DEFINIR`.
- As estratégias são **decisões opcionais do jogador**; o Patch A não corrige artificialmente vendas nem transforma empréstimo em receita.

## Plano de validação quantitativa

1. **Controle sem estoque:** mercado aberto e 30 dias sem encomenda deve registrar receita/vendas = 0; o sistema não inventa clientes atendidos.
2. **Plano explicitamente confirmado:** mesma seed, mercadoria encomendada, 30 dias. Receita só é reconhecida após venda diária de estoque efetivamente recebido.
3. **Experimentos controlados:** conservador/equilibrado/agressivo × 90/365 dias (mesma seed e setor), documentando receitas, vendas, lucro, caixa, passivos, demanda perdida, pedidos e tamanho do save; ausência de lucro não significa falha técnica.
4. **Sensibilidade comercial:** preços 92%/100%/108% × 30 dias, com mesmas condições simuladas e registro dos efeitos observados. Não supor relação monotônica lucro/demanda.
5. **Cenário de risco:** abertura simultânea de três setores com capital de giro insuficiente deve sinalizar descapitalização e não fazer compras silenciosas.
6. **Integridade:** razão equilibrado, registro idempotente, rejeição de ID e cotação inválidos, save V1 e compacto V2 roundtrip íntegros, compatibilidade schema 9.
7. **Regressão integral:** `npm run check`, `npm run bench:stability`, `npm run bench:competition`, `npm run bench:finance`, `npm run bench:logistics`, `npm run bench:quality`, `npm run bench:economy`.

### Critério de balanceamento

Não se fixa previamente uma meta arbitrária de lucro ou vendas. A aprovação técnica exige que os experimentos sejam **reproduzíveis**, que o abastecimento financiado por caixa real modifique as vendas de forma causal, e que resultados adversos tenham explicação observável. O diagnóstico deverá informar a existência de quebra de estoque e compromissos acumulados, e uma eventual revisão dos coeficientes de demanda/custos só poderá ser feita em patch próprio, mediante aprovação baseada nesses dados.

## Evidência técnica de implantação (CI da candidata)

- GitHub Actions [#42413908821](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42413908821): **SUCCESS**, **331/331 testes PASS e 0 FAIL**, build HTML único SHA-256 `95d460eb1eb850c4f2a594e2df972084f73cbc8fcb1e61856209226b6a6a599d` (1.478.306 bytes), regressões legadas e benchmarks de estabilidade, concorrência, crédito, logística, QA e economia aprovados.
- Cenário controle, **30 dias sem estoque e sem compra**: receita **R$ 0**, 100% de demanda não atendida e 0 vendas; resultado com abertura/despesas **-R$ 11.550,00**. A mesma seed, com encomendas confirmadas, registrou receita de **R$ 21.700,00**, 617 unidades vendidas, demanda não atendida **5,4%** e resultado de **-R$ 3.959,00** aos 30 dias (a abertura da loja ainda afeta o acumulado).
- **Noventa dias**, mesma seed 300301 e uma unidade de mercado, reposição a cada 7 dias mediante comando explícito: conservador **25,2%** demanda perdida / resultado **R$ 1.507,10**; equilibrado **2,7%** / **R$ 6.048,00**; agressivo **0,9%** / **R$ 6.565,00**. São trajetórias controladas, não garantia de lucro em qualquer save.
- **365 dias**, mesma seed e premissas: conservador **22,3%** demanda perdida / resultado acumulado **R$ 37.787,16**; equilibrado **2,3%** / **R$ 53.242,00**; agressivo **0%** / **R$ 55.501,00**.
- **90 dias com 3 unidades abertas sem capital de giro:** 0 vendas/receitas, caixa final **R$ 22,00** e resultado **-R$ 64.670,00**. A perda permanece explícita: nenhum bônus de receita foi injetado para salvar o cenário.
- Cenários de preços do SKU base (92%/100%/108%, **30 dias**, seed 300331) tiveram **599/586/575 unidades** vendidas e resultados **-R$ 5.259,40 / -R$ 4.324,00 / -R$ 3.448,68**, respectivamente. O preço mais alto teve menor volume, mas melhor resultado nesse recorte. Não inferir preferência ótima universal.
- O controle sem estoque foi observado em **30 dias**, não 90; não misturar horizontes em comparações gráficas. Resultados são observações da simulação com parâmetros fixados e não QA humano ou prova de equilíbrio geral.

## QA Windows e compatibilidade

- Antes de atualizar, exportar o **JSON tradicional** V1 da V2.9; não depender exclusivamente do backup compacto V2.
- Usar `ATUALIZAR_E_JOGAR.bat` no Windows para carregar candidato depois de publicação à `main`.
- Abrir Mercado → Compras; alternar estratégias, conferir os três SKUs e cenário de preço, avançar dias, comparar caixa e confirmar **uma compra**.
- Conferir a entrega após o prazo do fornecedor, vendas no dia seguinte, relatório contábil e backup.
- Exercitar fechamento/reabertura em `file://` e importação manual de backup; **não afirmar que esses testes foram realizados sem evidência**.
- A candidata não modifica `schemaVersion=9`, formato padrão `saveFormatVersion:1`, nem exige atualização automática de carreiras antigas.

**Regra de publicação:** CI verde permite integração e checkpoint de **candidata**, nunca homologação sem aceite expresso. A V2.9.0 estável permanece como recuperação em `releases/v2.9.0-homologada`.
