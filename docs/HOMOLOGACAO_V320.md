# Homologação V3.2.0 — FiscalEngine estratégico (09/11/2026)

**Aceite:** especificação e implantação em rodada única solicitadas expressamente pelo titular. **Status formal da publicação:** promoção condicionada à CI SUCCESS da `main` no SHA final e readback do checkpoint `releases/v3.2.0-homologada`. Não interpretar este registro como teste manual do Windows pessoal.

## Fundamentação e rastreabilidade

- Base imutável: V3.1.0, `releases/v3.1.0-homologada` — `a3b0a4f509e0be8998c2975edb2bca88462ecac9`.
- Solicitação de patch: especificação técnica recebida em 09/11/2026, "Motor Fiscal Estratégico Completo (V3.2.0)" e autorização de **rodada única de implantação e homologação**, seguida da instrução "continue o processo".
- Pull request [#45](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/pull/45), candidata final `9ca69c277d263045d27cce3fa06e9b9002c11123`, merge `a59622d4fe3136e9cb2eb898ae05cc18156418e1`.
- CI Linux no SHA da candidata — [SUCCESS #42728009411](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42728009411).
- QA Windows hospedado Chrome/Edge no mesmo SHA — [SUCCESS #42728009402](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42728009402). Com navegador `file://`, mobile emulado, persistência IndexedDB, checkouts migrados, navegação, carreiras 365/1.825 dias e salvamento.
- Destino de distribuição: `main`, que é lida pelo `ATUALIZAR_E_JOGAR.bat`. Executável único offline `index.html`, não o arquivo avulso `index_2.html` citado genericamente na especificação.

## Contratos implementados

1. `CidadeCore.VERSION='3.2.0'`, `SCHEMA_VERSION=10`; migrador aditivo do schema 9 preserva journals, eventos, apurações e histórico. Novos cálculos são prospectivos, sem passivos artificiais retroativos.
2. FiscalEngine didático ativado para o jogo: opções `SIMPLES`, `PRESUMIDO`, `REAL`, `scheduledRegime`, `simplesIvaMode`, créditos agregados e apurações mensais. Simples Anexos I (comércio/roupas) e II (padaria), RBT12, base presumida/real, PIS/COFINS do cenário 2026, CPP/folha e ICMS estimativo por UF. Transição 2026–2033 em pacotes hipotéticos.
3. Apuração automática na virada do mês, vencimento simulado dia 20 seguinte, juros e multa **do jogo** a cada dia de atraso, status aberto/vencido/pago e restrição de crédito bancário do jogo enquanto houver guia vencida.
4. Pagamentos totais/parciais confirmados pelo jogador: débito `TAX_PAYABLE` / crédito `CASH`. Reconhecimento do principal: débito `TAX_EXPENSE` / crédito `TAX_PAYABLE`. Encargos: débito `INTEREST_EXPENSE` / crédito `TAX_PAYABLE`. O mesmo gasto jamais vira despesa novamente na liquidação. Comparador `taxPlanningComparison()` é leitura pura sem mutação.
5. Departamento Administrativo > Fiscal com quatro áreas: regime e KPIs, comparador, competências/guias e cronograma IVA dual + checklist operacional V2.4-C. Os quatro KPIs do modal administrativo incluem tributos a pagar quando Fiscal está ativo.
6. Estimativa de custo interestadual de **2%** em rotas interestaduais, **informativa**, sem emissão de documento, lançamento tributário ou alegação de DIFAL real.
7. A V3.1 imersiva fica intocada; nenhuma reconstrução de cidade nesta versão. A arte urbana anterior, embora não ideal para o titular, permanece congelada.

## Simplificações e limites de veracidade

**O jogo não é sistema fiscal oficial**: não possui CNPJ, NCM, CFOP, CST, segregação ST/monofasia, operação fiscal concreta, tratamentos estaduais por mercadoria, créditos documentados nem obrigações acessórias reais. Não emite, autentica nem transmite DAS/DARF/DAE, PGDAS-D, EFD, SPED ou documentos oficiais.

As taxas `CBS=8,8%`, `IBS pleno=17,7%`, ICMS por UF do recorte e `2%` de custo interestadual foram definidas como **hipóteses de gameplay** na especificação e **não** são alíquotas reais universais, nem previsão jurídica da reforma. O modelo simplificado de IRPJ/CSLL, anualização, crédito agregado, mora e CND é fictício. A recomendação de regime é menor custo **no modelo**, não "elisão fiscal lícita" legalmente comprovada. Não inferir obrigação legal real nem aconselhar recolhimento com base nesses valores.

## Compatibilidade, proteção e rollback

- Ao atualizar uma carreira antiga, guarde **backup JSON tradicional V1 exportado da V3.1.0** e, se possível, backup compacto, em pasta externa; não use o único save como teste de importação.
- V3.2.0 **lê e migra schema 9 para 10**. Um backup **já salvo em schema 10 não é garantidamente legível pela V3.1.0**. Para rollback ao executável anterior, utilize cópia original preservada da carreira *antes* da migração.
- A atualização do `index.html` não converte o backup externo; as mudanças persistentes ocorrem após abrir/continuar carreira com a nova versão. Reabra e valide caixa, estoque, razão e competências.
- O atualizador usa `main` e faz backup dos arquivos substituídos em `_atualizador/backups/`, mas **não valida o save privado nem foi executado no computador do titular**. CI Windows hospedado e mobile emulado não são testes pessoais físicos.
- Se falhar a CI ou a leitura do checkpoint final, a promoção NÃO deve ser anunciada como concluída.

## Procedimento de distribuição

Após CI final verde e checkpoint confirmado: feche o jogo, faça os backups externos, execute `ATUALIZAR_E_JOGAR.bat` dentro da instalação existente e confira versão 3.2.0 e integridade da carreira. Alternativa: baixar o ZIP completo da `main` no GitHub e executar `JOGAR_OFFLINE.bat` da pasta extraída.

**Pendência futura mantida:** reconstruir visualmente a cidade em ciclo separado, sem misturar escopo fiscal V3.2.0.
