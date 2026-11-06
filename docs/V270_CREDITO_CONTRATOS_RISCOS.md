# CIDADE DOS NEGÓCIOS — V2.7.0-alpha.1 · Crédito, contratos e riscos financeiros

**Status:** CANDIDATA EM IMPLEMENTAÇÃO/VALIDAÇÃO. Não homologada e não equivale a QA Windows.
**Origem:** Plano Diretor V2 → V3 de 04/11/2026 — oito checkpoints V2.7.
**Base protegida:** `releases/v2.6.0-homologada` — V2.6.0 oficialmente homologada pelo titular em 05/11/2026.
**Contrato de save:** `schemaVersion=9` mantido. `economy.financing` opcional e ativado por comando; não retroage financiamento em saves antigos.

## Escopo e evidência por checkpoint

| # | Checkpoint | Contrato implementado | Prova e ressalva |
|---|---|---|---|
| 01 | Crédito empresarial com contrato | Principal, 1,8% por 30 dias (fictício), 3/6/12/24 parcelas, identificação, datas e valores | `CREDITO.CONTRATAR` e `creditReport`; QA manual pendente |
| 02 | Contratação e amortização contábil | Entrada: débito caixa/crédito LOAN_PAYABLE; juros proporcionais débito EXPENSE/crédito INTEREST_PAYABLE; pagamento baixa passivos e caixa | Livro de partidas dobradas, `LOAN_DRAW`, `LOAN_INTEREST`, `LOAN_PAYMENT`; nunca crédito como receita |
| 03 | Elegibilidade | Exige 7 dias e vendas reais, limita a 75% da receita mensal projetada, teto R$ 30.000 em aberto e bloqueia atrasos | `creditEligibility`; critérios visíveis, sem saque infinito |
| 04 | Atrasos e renegociação | Juros sobre principal restante, multa de 2% sobre principal vencido por ciclo atrasado, teto de 20% do principal; até duas renegociações | `CREDITO.RENEGOCIAR`, sem zerar juros/multas reconhecidos. Saída pela amortização |
| 05 | Contrato com fornecedor | Unidade, produto, fornecedor, preço travado, volume, 2–12 ciclos de 7/14/30 dias; pedido automático em trânsito; falta de caixa/capacidade vira falha + multa | `CONTRATO.FORNECEDOR.ASSINAR` e motor diário. Pedido só lança mercadoria se pago. Rescisão multa de 5% do compromisso futuro |
| 06 | Calendário de compromissos | Projeção de 30/90/180 dias com passivos contabilizados, compras contratadas ainda não contabilizadas, parcelas futuras e estresse sem vendas | `financialCommitmentsReport` puro; principal só deduzido uma vez no estresse |
| 07 | Regressões financeiras | Testes do ledger, amortização, default, recuperação, contratos, vendas, caixa, DRE, balanço e save | `tests/credit_v270.test.mjs` e `tools/benchmark-v270.mjs` |
| 08 | GATE — crédito com consequências | CI, benchmark 90/365/1825 dias, HTML offline, QA e aceite | CI a verificar; Windows e homologação do titular pendentes |

## Regras econômicas e contábeis

- **Crédito não é receita:** é fluxo de financiamento com principal exigível em `LOAN_PAYABLE`.
- Juros são despesas de competência do período fictício, com `INTEREST_PAYABLE`. Ao antecipar uma amortização, o motor reconhece os dias transcorridos desde a última apropriação e não reapura os mesmos dias.
- As penalidades simuladas são `EXPENSE` e passivo específico `LOAN_FEES_PAYABLE` ou `CONTRACT_PAYABLE`. Pagá-las não reconhece a mesma despesa pela segunda vez.
- Principal vencido mais juros e multas aparecem em relatórios separadamente; quitação usa multas → juros → principal, preserva o histórico e concilia o balanço.
- A renegociação posterga o principal vencido e redefine as próximas prestações, **não** perdoa o saldo nem capitaliza silenciosamente encargos. Multas e juros permanecem exigíveis. Limite de duas renegociações.
- Contratos de fornecimento são compromissos **futuros** até a data do pedido. Assinar não contabiliza compra, estoque ou despesa. A assinatura autoriza o **pedido automático**; se houver caixa/capacidade, compra é paga e entra em trânsito; caso contrário, contabiliza apenas a multa de 2% do pedido não cumprido. Não ocorre estoque imaginário, crédito de fornecedores fictício ou duplicação de receita.
- Rescindir cancela apenas os ciclos futuros e reconhece multa fictícia de 5% do compromisso não realizado.
- A sequência `economy.financing` não altera a classificação de salários, tributos didáticos ou contas a pagar operacionais já existentes.
- Os valores, juros e vencimentos **não representam crédito bancário ou contrato comercial real**, apenas regras internas do jogo.

## Como testar no Windows (ainda não comprovado)

1. Faça **backup JSON** da carreira antiga antes de testar.
2. Abra o `index.html` candidato em navegador local e confirme `v2.7.0-alpha.1`.
3. Em **Finanças**, use uma carreira de teste, inaugure unidade e venda durante pelo menos 7 dias para habilitar crédito.
4. Contrate R$ 500 com 3 períodos e confirme que o caixa cresce, mas a receita não.
5. Avance 30 dias; confirme vencimento e juros; pague uma parcela.
6. Deixe um contrato atrasar, verifique multa limitada e renegocie; confira o passivo anterior preservado.
7. Assine contrato fictício de dois pedidos, avance para o vencimento e confirme entrada em trânsito e estoque após entrega; teste rescisão e multa.
8. Compare calendário de pagamentos (realizado vs futuro), DRE, balanço e conciliação.
9. Exporte, feche, reabra e importe o JSON; compare caixa, obrigações, contratos e datas. Não substitua o último save funcional.

## Limites atuais e próximos gates

- Evolução concorrencial V2.6 intacta; V2.4.1 e V2.6.0 têm checkpoints de rollback preservados.
- Prazo fictício é **período fixo de 30 dias**, não vencimento bancário em mês civil real.
- O preço contratual unitário é fixado na assinatura (sem custos dinâmicos externos).
- O fluxo de estresse não projeta vendas futuras nem novas folhas futuras; saldos já registrados e planos futuros são discriminados.
- Testes de balanceamento e UI com jogador real permanecem necessários antes de se chamar V2.7.0 homologada.
- No encerramento da candidata: gerar HTML reproduzível, 0 falhas em regressões e benchmarks, testes manuais Windows e aceite explícito do titular.
