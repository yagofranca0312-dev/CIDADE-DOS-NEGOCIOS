# V1.9 — Sistema Tributário Brasileiro Simulado

**Status:** PLANEJADO, não implementado. **Data:** 02/11/2026.
**Base preservada:** V1.8.0-rc.1 homologada, commit `66bdab08547daec1df50eca3d6b1967a2a664d2c`, branch `releases/v1.8.0-homologada`.

## Missão
Adicionar ao jogo cálculo tributário **didático, parcial e opt-in**, auditável por competência, sem alegar apuração fiscal válida. Preservar o HTML offline, caixa do grupo, cinco unidades, ledger histórico e saves. As lojas não possuem CNPJs; uma entidade contribuinte será hipótese de simulação explícita. A V2.0 continua reservada à consolidação da arquitetura e reformulação visual de jogo, sem funcionalidades novas.

## Etapas
1. **Motor fiscal desacoplado:** pacotes normativos com fonte, versão, período, jurisdição, hipóteses, status de cobertura e regras de arredondamento. Não presumir valores quando faltarem dados.
2. **Simples Nacional comércio básico:** modelo didático de Anexo I quando hipótese suportada. Receita mensal do grupo, RBT12, faixas, alíquota efetiva e cálculo de DAS simulado. Não classificar padaria como revenda por padrão. Ausência de NCM, natureza de operação, ST e segregações exigidas será marcada como não coberta.
3. **Reforma Tributária:** timeline 2026–2033 com fontes legais. Em 2026, 0,9% CBS e 0,1% IBS são parâmetros de teste informativos, sem gerar automaticamente pagamento nem passivo. A partir de 2027, não calcular tributos sem pacote legal por competência; distinguir Simples integrado e opção de IBS/CBS em regime regular, sem duplicidade.
4. **Integração contábil:** reconhecer débito de despesa e crédito de tributo a pagar somente em apuração de modo habilitado e coberto; pagamento separado reduz caixa e obrigação sem duplicar despesa. Não lançar imposto retroativo.
5. **Interface:** bloco de tributos dentro de Finanças, com regime, competência, fonte, valor, status, pendências e pagamento. Nada de nova aba principal.
6. **Testes:** importação 2–8, preservação dos saldos anteriores, fechamento mensal único, fórmula Simples e meses iniciais, duplicidade, virada de ano, 90/180/365 dias, DRE/BP/DFC, cinco filiais, UX 320–1280 px, número de versão consistente, CI e homologação Windows.

## Critérios
Separar `NOT_COVERED`, `EDUCATIONAL_ONLY`, `SIMULATED_PARTIAL` e `UNSUPPORTED`. Nunca usar alíquota zero para simbolizar regra ausente, nem transformar estimativa em passivo real. O faturamento simulado não comprova receitas ou situação fiscal real.

## Referências normativas
- Receita Federal, legislação da Reforma do Consumo (EC 132/2023, LC 214/2025, LC 227/2026, Decreto 12.955/2026): https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/legislacao/
- Receita Federal, transição 2026–2033: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/entenda
- Resolução CGSN 140/2018, art. 21, fórmula de alíquota efetiva: https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=92278
- Receita Federal, Resolução CGSN 194/2026 e opções para 2027: https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/setembro/simples-nacional-2027-entenda-os-novos-prazos-e-faca-sua-escolha-com-consciencia-e-tranquilidade/

## Release gate
Planejado → implementado → testes locais → CI PASS → navegador/Windows → homologação por Yago. Não marcar etapas futuras antecipadamente. Na V2.0, reorganizar arquitetura e telas inchadas para criar experiência visual de jogo, sem novas mecânicas.
