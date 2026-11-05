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
- **Medições observadas no runner GitHub Actions em 05/11/2026**, workflow [41939407785](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/41939407785), commit `3ce78a7e764291b94e3206e2659e4ea9fb9e8a82`:

| Dias simulados | Unidades | Tempo de simulação | Exportação JSON | Integridade |
| ---: | ---: | ---: | ---: | --- |
| 30 | 1 | 16 ms | 76.931 bytes | PASS |
| 30 | 5 | 8 ms | 340.784 bytes | PASS |
| 365 | 1 | 66 ms | 914.913 bytes | PASS |
| 365 | 5 | 448 ms | 4.252.859 bytes | PASS |
| 1.825 | 1 | 1.016 ms | 4.715.902 bytes | PASS |
| 1.825 | 5 | 8.245 ms | 21.321.317 bytes | PASS |

- Valores são de um runner Linux, não de computador Windows nem navegador. Tempos pequenos variam conforme aquecimento de execução e ambiente.
- **Risco aberto — saves grandes:** o exportador/importador ainda possuem limite de aproximadamente 25 MB; o quinto ano com cinco empresas produziu 21,3 MB. O armazenamento `localStorage` disponível em navegadores pode ser menor que esse arquivo. Assim, **não é seguro prometer autosave em carreiras longas**. Exportar JSON regularmente e preservá-lo externamente; revisar estratégia de persistência/capacidade em evolução própria antes de declarar suporte a carreiras de décadas.
- A implementação atual avisa quando o `localStorage` falha, mas o roteiro de QA no Windows precisa cobrir também o comportamento com o armazenamento indisponível. Não há teste E2E de quota de navegador comprovado.
- As medições estabelecem apenas uma referência de desempenho; nenhum SLA universal foi definido.
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
- [x] CI e HTML offline reproduzível aprovados nesta revisão: 250 PASS / 0 FAIL, build sincronizado; workflow 41939407785.
- [x] Benchmark com 6 cenários executado e resultados documentados acima; risco de tamanho de save permanece aberto.
- [ ] Teste real Windows e recuperação após reinício comprovados.
- [ ] Aceite de homologação do titular e release 2.4.1 estável.

**Status:** publicação no GitHub é candidata de teste, não homologação. Não marcar gates sem evidência.

## Encerramento formal de 05/11/2026

- O jogador autorizou expressamente a homologação da V2.4.1 e o início da V2.5.0.
- A candidata `2.4.1-rc.1` passou CI `42005354318`, 250 PASS/0 FAIL, seis benchmarks e build reproduzível. A versão `2.4.1` receberá nova checagem CI após a promoção.
- **Homologação formal:** autorizada. **Teste manual no Windows e navegador:** não comprovado; gate prático continua não verificado, conforme contrato do projeto. Isso não deve ser apresentado como validação manual.
- **Risco de saves longos:** permanece: 21,3 MB na simulação de 1.825 dias/5 lojas, próximo do limite de 25 MB e sujeito a quota menor de `localStorage`.
- Não há migração; `schemaVersion 9` preservado, e checkpoint da V2.4.0 mantido para recuperação.
