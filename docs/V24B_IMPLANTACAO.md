# Implantação V2.4.0-alpha.2 — RH/DP (Patch B)
**Base homologada:** Patch A em `releases/v2.4.0-alpha.1-homologada`.
**Destino autorizado:** `main`. **Patch B:** HOMOLOGADO por autorização expressa de Yago em 04/11/2026, CI 231/231, snapshot `releases/v2.4.0-alpha.2-homologada` no commit `63fd0218f8e18da209b5cd7d4af154d868d1e03f`.

## Regras da simulação
- Equipes por unidade: até 4 personagens; cargos Atendimento (R$ 1.500, +6%), Logística (R$ 1.900, +8%), Gestão (R$ 3.000, +4%).
- Produtividade representa maior captação/conversão das vendas simuladas, limitada a +25% por unidade; sem equipe, a demanda anterior é preservada.
- Contratação e desligamento como eventos auditados; identificação fictícia, sem dados trabalhistas reais.
- Fechamento de competência do mês: salário proporcional por dias trabalhados / 30 (teto 30). Registra EXPENSE a PAYABLE; pagamento manual posterior debita PAYABLE/CASH e exige saldo.
- DRE discrimina despesa de folha; fluxo de caixa discrimina pagamentos; balanço e razão usam as mesmas contas consolidadas, sem saldo bancário por filial.
- Sem novos campos no estado persistido: eventos e razão preexistentes; `schemaVersion=9` e importação de saves antigos, sem funcionários/folhas retroativos.
- Comandos protegidos contra duplicidade, cargo inválido, contratação excessiva, desligamento repetido, folha não fechada e caixa insuficiente.

## Limites
Valores exclusivamente fictícios e lúdicos. Não modela CLT, INSS, FGTS, eSocial, 13º, férias, IRRF ou vínculos legais.
Projeções estratégicas legadas não antecipam desembolsos manuais de folha; consultar RH e demonstrações realizadas.

## Gate
`npm run check` + HTML reproduzível + testes de contratação, pró-rata, pagamento, conciliação, auditoria e save.
**Registro:** aceite explícito de homologação do usuário em 04/11/2026. Não há comprovação independente de testes manuais no Windows; não inferir execução não documentada.
