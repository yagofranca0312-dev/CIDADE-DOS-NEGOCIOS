# CIDADE DOS NEGÓCIOS — V2.8.0 · Produção e logística entre unidades

**Situação:** titular autorizou **homologação formal V2.8.0 em 07/11/2026**, sobre a V2.7 homologada. A CI de 2.8.0 definitiva e o checkpoint de publicação devem ser verificados após a promoção; **QA manual no Windows/navegador não tem evidência de execução**. Ver `HOMOLOGACAO_V280.md`.

**Dependências:** V2.6 Economia Viva e V2.7 Crédito e Contratos.
**Save:** `schemaVersion = 9` preservado. `economy.logistics` opcional e ativado somente por comandos reais de logística. Nenhum depósito, perda, custo de rota, produção ou transferência retroativa em saves V2.7.

## Contratos de execução dos oito checkpoints

| CP | Função | Critério de evidência e conclusão | Estado |
|---|---|---|---|
| 1 | Rede logística intermunicipal | `logisticsRouteQuote` com **índice abstrato**, 1–5 dias fictícios e fretes parametrizados; rotas sem afirmação de km ou ETA reais | Implementado; regressões e benchmarks aprovados na candidata |
| 2 | Transferência interfilial | `LOGISTICA.TRANSFERIR` → `INVENTORY → IN_TRANSIT → INVENTORY`, compensação `INTERNAL_CLEARING` igual a zero; **nenhum REVENUE nem COGS** | Implementado; regressões e benchmarks aprovados na candidata |
| 3 | Centro de distribuição opcional | `LOGISTICA.CD.ABRIR`, custo de implantação e manutenção com baixa separada do passivo, estoque/limite 2.000, compras pagas e consolidadas, fretes com desconto em trechos com CD | Implementado; regressões e benchmarks aprovados na candidata |
| 4 | Produção piloto da padaria | `LOGISTICA.PRODUCAO.HABILITAR`, compras de farinha, `LOGISTICA.PRODUZIR` (1 farinha → 3 pães, capacidade 25 farinhas/dia), custo de insumos mais mão de obra incorporado a estoque; sem venda interna | Implementado; regressões e benchmarks aprovados na candidata |
| 5 | Perecibilidade e perdas | Lotes novos de pão e bolo, validade fictícia 3/5 dias, baixa única em `EXPENSE` e `INVENTORY`; perda também em trânsito, sem CMV artificial | Implementado; regressões e benchmarks aprovados na candidata |
| 6 | Sugestões de logística | `logisticsSuggestions` pura, com propostas de remanejamento ou compra pelo estoque mínimo; painel editável e confirmação antes de qualquer ação | Implementado; regressões e benchmarks aprovados na candidata |
| 7 | Conciliação multiloja | `validateLogistics`, `validate`, `reconciliationReport` e `balanceSheet`; CD e trânsito integrados aos valores físicos, contábeis e comandos com ID | Implementado; regressões e benchmarks aprovados na candidata |
| 8 | GATE operações integradas | Regressões automáticas + benchmark 90/365/1832 dias com meta de cinco unidades reais e saves JSON; QA Windows e aceite do titular posteriores | **Aceite formal recebido**; CI candidata aprovada, promoção final em validação; QA Windows pendente |

## Regras contábeis do módulo

- **Transferência entre filiais nunca é faturamento.** Na saída, crédito em estoque físico, débito em trânsito. Na chegada, a origem baixa seu trânsito via compensação e o destino incorpora mercadorias via compensação. A conta `INTERNAL_CLEARING` deve somar zero no grupo.
- **O frete é custo/despesa real do jogo**, pago com o caixa compartilhado. O CD custa R$ 800 para abrir e R$ 8,50 por dia simulado, com despesa reconhecida ou obrigação se caixa insuficiente. `LOGISTICA.CD.PAGAR_DESPESAS` quita essa obrigação quando houver caixa, sem reapurar a despesa. Um trecho envolvendo CD recebe desconto *simulado* de 25% sobre o frete desse trecho. Roteamentos múltiplos podem custar mais que o envio direto.
- Compras externas de CD, fornecedores e insumos consomem caixa e criam mercadoria em trânsito. A entrada de produtos no estoque ocorre apenas na data prevista; sem criar receita fictícia.
- A produção transfere **valor de insumo** ao produto final e incorpora o custo fabril pago no caixa. O livro possui um lançamento de transformação com dupla entrada `INVENTORY` compensada e crédito em caixa; sem `REVENUE` ou `COGS` na transformação.
- Lotes de validade **apenas das mercadorias novas** são marcados após recebimento ou produção. Quando expiram, quantidade é reduzida e a despesa é reconhecida **uma vez**. Estoques anteriores não ganham validade presumida. Vendas ao consumidor reduzem lotes rastreados; transferências carregam a data de validade.
- Capacidade do CD contabiliza estoque físico + pedidos futuros já pagos + transferências a caminho. A unidade também considera o volume de transferências internas pendentes antes de autorizar novas compras.
- A restrição de saldo vale em todos os fluxos pagos; não há acesso externo a bancos, fornecedores ou fretes reais.

## Rota simulada e precisão

O índice de distância é gerado deterministamente com a posição das cidades no cadastro fictício do jogo e relação entre UFs. **Não usa mapa rodoviário, quilometragem real, tempo de caminhão nem preços reais de frete.** Assim, o prazo e o custo servem somente como parâmetros lúdicos e não devem ser apresentados como estimativa de viagem.

## Padrão de testes e homologação

### Testes automatizados
- `npm run build`, `npm test`, `npm run bench:stability`, `npm run bench:competition`, `npm run bench:finance`, `npm run bench:logistics`.
- Validação em cada comando: débito = crédito; total do inventário das unidades + CD = saldo `INVENTORY`; mercadorias em trânsito = `IN_TRANSIT`; compensação interfilial = zero.
- Testes de transferência pendente/recebida, unidade/centro de distribuição, produção, desperdício, validade em transporte, propostas sem mutação, duplicação de comando e saves JSON.

### QA manual ainda necessário
1. Fazer backup JSON de carreira real antes de atualizar.
2. Em carreira de teste, abrir duas unidades e transferir produto com estoque; conferir saída, trânsito, prazo, frete e entrada, sem faturamento.
3. Abrir CD opcional, comprar e receber mercadorias de fornecedor e remanejar às lojas; avaliar custos por etapa.
4. Abrir padaria, habilitar farinha, comprar insumo, produzir pães; verificar custo, validades e perda.
5. Abrir até 5 unidades de cidades/setores distintos, avançar dias, examinar preço, vendas e perdas; exportar/importar save.
6. Verificar interface Windows (BAT e navegador offline), funcionalidade, desempenho e balanceamento. Não afirmar QA realizado antes do registro de evidência.

**Gate de release:** o titular autorizou a homologação formal em 07/11/2026, após CI candidata 304 PASS/0 FAIL e benchmark integrado. A publicação definitiva 2.8.0 requer build reproduzível e nova CI de promoção e `main` aprovadas; criar o checkpoint `releases/v2.8.0-homologada` somente depois. **Os testes reais no Windows/BAT e navegador continuam não realizados/não comprovados**; são pendências de QA, não aprovação implícita. A V2.7.0 permanece como rollback histórico.
