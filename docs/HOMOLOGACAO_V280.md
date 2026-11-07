# Homologação formal — Cidade dos Negócios V2.8.0

**Data da autorização:** 07/11/2026 (America/Fortaleza).
**Titular:** Yago França da Silva.
**Comando explícito do titular:** “homologue”, após a entrega do relatório da V2.8.0-alpha.1.
**Objeto:** promover V2.8.0-alpha.1 a V2.8.0, preservando as regras do motor e o esquema de save.
**Classificação:** ACEITE FORMAL DA RELEASE, COM RESSALVAS DE QA MANUAL; o aceite não comprova testes Windows não documentados.

## Evidências comprovadas para a candidata

- PR #34 incorporado à `main` no commit `9565e3fdecf0f9dc7fc17ceb5fd6ccd002ed342a`.
- CI da candidata V2.8.0-alpha.1 [#42141983053](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42141983053): **SUCCESS**, `npm test` com **304/304 PASS, 0 FAIL**, benchmark estabilidade V2.4.1, concorrência V2.6, crédito/contratos V2.7 e logística integrada V2.8.
- CI de integração da candidata à `main` [#42142233230](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42142233230): **SUCCESS**.
- Benchmark V2.8: 91 dias/3 unidades/CD/produção; 365 dias/5 unidades/CD; 1.832 dias/5 unidades/CD, com mercadorias, trânsito, razão e compensação interna conciliados em todos os cenários. O teste longo gerou save JSON com cerca de **23,36 milhões de caracteres**, abaixo do limite de **25 milhões**; monitorar risco de limite em carreiras muito longas.
- O modelo mantém `schemaVersion 9` e `economy.logistics` opcional; saves antigos não recebem perdas, CDs, cargas ou receitas retroativas.
- Transferências internas não lançam `REVENUE` ou `COGS`. Custos de frete, CD, produção e desperdício são simulados e contabilizados com partidas dobradas.
- Distâncias e prazos são **parâmetros fictícios do jogo**, não quilômetros ou ETA de estradas reais.
- Checkpoint da candidata anterior: `checkpoints/v2.8.0-alpha.1-ci-pass`; checkpoint estável anterior: `releases/v2.7.0-homologada`.

## Aceite e limites de evidência

O titular solicitou expressamente a homologação final. Esse comando autoriza a **homologação formal**; não constitui prova de que foram realizados testes manuais no Windows e tampouco autorização para afirmar QA de navegador ou balanceamento com jogador.

**Sem evidência de conclusão**, permanecem pendentes:
1. Testar `ATUALIZAR_E_JOGAR.bat` no Windows, abertura e funcionamento do `index.html` offline.
2. Verificar na interface as transferências entre lojas e CD, insumos, transformação e expiração de lotes.
3. Validar persistência local `file://`, importação de um save real com backup, controles e responsividade.
4. Avaliar equilíbrio econômico, diversão, desempenho percebido e evolução de saves perto do limite de 25 milhões de caracteres.
5. Demonstrar que trajetos do jogo não são interpretados como deslocamento real.

## Gate técnico para publicar a V2.8.0

1. Promover a versão em `src/core/game.js`, `package.json`, `src/shell/index.template.html` e as regressões, sem introduzir mecânicas adicionais.
2. Regerar `index.html` de maneira determinística; executar `npm test`, `npm run bench:stability`, `npm run bench:competition`, `npm run bench:finance` e `npm run bench:logistics`. Registrar checksum do HTML.
3. Confirmar a CI da branch de promoção e o artefato offline resultante.
4. Integrar a promoção à `main` e confirmar CI de `main` aprovada no commit exato de merge, incluindo `git diff --exit-code -- index.html`.
5. Criar `releases/v2.8.0-homologada` **somente** no mesmo SHA final da `main` após o gate 4. Preservar o checkpoint V2.7 e a candidata V2.8.
6. Recomendar exportação prévia de backup JSON para atualizar; aceitação formal não altera nenhum save no computador do titular.

**Conclusão documental:** HOMOLOGAÇÃO FORMAL AUTORIZADA. O status de CI, pacote definitivo e checkpoint somente pode ser declarado concluído após confirmação real dos respectivos registros. QA manual Windows/navegador permanece sem comprovação.
