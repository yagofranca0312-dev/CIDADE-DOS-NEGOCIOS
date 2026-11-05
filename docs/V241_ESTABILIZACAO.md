# Cidade dos Negócios — V2.4.1: estabilização financeira e qualidade

**Estado inicial:** candidata `2.4.1-rc.1` para validação. **Base:** `releases/v2.4.0-homologada`, commit `2867be784141c4043a23e7205eb78adee8485005`. **Schema:** 9.
**Data:** 04/11/2026. Não há nova apuração tributária legal nem mecânica de empréstimos nesta etapa.

## Inventário financeiro — uma única fonte de verdade
- **Despesa diária:** `day()` debita `EXPENSE` e credita `CASH` quando há dinheiro; se não, credita `PAYABLE`. Antes da V2.4.1, as parcelas pendentes não possuíam comando geral de baixa.
- **Folha RH:** `accruePayrollMonth()` debita `EXPENSE` e credita `PAYABLE`. `RH.PAGAR_FOLHA` já debita o passivo e credita caixa, por unidade e competência.
- **Fiscal didático:** `TAX_PAYABLE` é conta distinta. Somente `FISCAL.PAGAR_SIMULADO` o baixa, sob cenário opt-in.
- **Taxas Paralegal:** são lançadas como despesa e caixa no protocolo, sem gerar passivo posterior nesta versão.
- **Legado sem origem identificável:** eventual saldo residual não é liquidado silenciosamente; aparece como não classificado no relatório.

## Correção da V2.4.1
- `operatingPayablesReport(state)` lê o ledger e calcula por unidade créditos operacionais históricos (classe `DAILY_EXPENSE`) menos as baixas novas (classe `OPERATING_SETTLEMENT`).
- `PAYABLES.PAGAR_OPERACIONAL` exige unidade válida, inteiro de centavos positivo, débito permitido pelo saldo em aberto daquela unidade e caixa global suficiente.
- Diário: `PAYABLE` a débito e `CASH` a crédito; um único evento auditável por ação. Sem novo lançamento em `EXPENSE`.
- Pagamentos parciais são permitidos; repetir o mesmo ID de comando é idempotente; tentativa de quitação duplicada ou superior ao saldo remanescente é recusada.
- O fluxo de caixa classifica a baixa em categoria separada (`operatingSettlements`) para não confundir com despesa operacional paga no próprio dia.
- A interface apresenta o formulário na área **Administrativo → Finanças**. Folhas permanecem em RH/DP; tributos simulados em Fiscal.

## Projeção financeira
- `strategyReport` já era um cenário da **unidade ativa**, com caixa compartilhado; não é previsão consolidada da rede.
- Inclui despesa estimada de folha futura ao fechamento mensal, baseada nos empregados conhecidos e regra pró-rata, acrescida ao resultado e `projectedPayable`, sem saída automática de caixa.
- Evidencia passivos operacionais, folhas apuradas não pagas e tributos simulados exigíveis já contabilizados; o valor `cashAfterKnownDebtsIfPaid` é cenário hipotético separado.
- **Não cobre** decisões futuras de contratação/demissão, novas compras, fluxo das demais unidades, tributos futuros sem pacote de regras, crédito ou pagamento automático de dívidas. Nenhuma consulta altera RNG, save ou ledger.

## Proteção de saves
- Antes de nova carreira ou importação, cópia da carreira atual em `localStorage` sob chave independente `cidade-dos-negocios-prior-save-v241`, seguida de verificação de leitura; erros impedem substituir a carreira atual.
- Se não for possível persistir o save importado, a carreira em memória anterior é preservada. Recuperação do backup anterior exige confirmação explícita.
- A segurança local **não substitui backup externo JSON**, especialmente em `file://` no Windows. Nunca prometer persistência em navegador não testado.
- Regressões de checksum e roundtrip JSON cobrem partidas schema 9. A V2.4.0 permanece acessível no checkpoint homologado.

## Benchmark de performance
- `npm run bench:stability` mede 30, 365 e 1.825 dias com 1 e 5 unidades, integração fiscal opt-in, folha, conciliação, exportação/importação e tamanho de save. A fixture de 5 lojas injeta capital apenas para viabilizar o cenário; **não é funcionalidade do jogo**.
- Registrar tempos observados por cenário e gargalos ao concluir o CI. Métricas dependem do hardware do runner; sem alegar SLA universal.
- Não alterar leis, economia ou estrutura de save para alcançar números de benchmark.

## QA manual indispensável (Windows)
1. Salvar backup JSON de uma carreira real antes de atualizar. Conservar arquivo externo.
2. Executar `ATUALIZAR_E_JOGAR.bat`, verificar versão `2.4.1-rc.1` e abrir o HTML via `file://`.
3. Testar liquidação parcial e total de passivo operacional, DRE e razão; verificar que a despesa não se repete.
4. Exportar JSON, fechar completamente o navegador, reabrir o jogo e comparar data, caixa, saldo de passivos, número de unidades e histórico.
5. Importar o JSON exportado; conferir recuperação da carreira anterior no painel Sistema. Simular importação de JSON corrompido e verificar que a carreira atual fica intacta.
6. Abrir no smartphone/navegador alternativo, se pertinente. Confirmar opções de backup e botões sem quebra de layout.
7. Registrar evidências e aceite expresso. **Somente depois** criar `releases/v2.4.1-homologada` e promover RC para `2.4.1`.

## Checklist de gates
- [x] Motor, interface e procedimentos implementados na candidata.
- [ ] CI e HTML offline reproduzível aprovados nesta revisão.
- [ ] Benchmark com 6 cenários executado e resultados documentados.
- [ ] Teste real Windows e recuperação após reinício comprovados.
- [ ] Aceite de homologação do titular e release 2.4.1 estável.

**Status:** publicação no GitHub é candidata de teste, não homologação. Não marcar gates sem evidência.
