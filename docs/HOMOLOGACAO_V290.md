# HOMOLOGAÇÃO FORMAL — CIDADE DOS NEGÓCIOS V2.9.0

**Autorização recebida:** 07/11/2026 (America/Fortaleza).  
**Titular:** Yago França da Silva.  
**Pedido explícito:** “homologue”, após publicação técnica da V2.9.0-alpha.1.  
**Objeto:** promover `2.9.0-alpha.1` para `2.9.0` com histórico, ledger, regras e `schemaVersion 9` preservados.  
**Classificação:** **ACEITE FORMAL DO TITULAR, COM RESSALVAS DE QA MANUAL**. A aprovação do titular não é prova documental de testes em Windows/navegador.

## Evidências existentes da candidata

- Candidata integrada à `main` no PR [#36](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/pull/36), commit `31ae11432ec7d1a80844c131e3911e05d0bd3ebd`.
- CI da candidata [#42405817482](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42405817482): **SUCCESS**, com **316 testes PASS e 0 FAIL**, HTML offline reproduzível, benchmarks de estabilidade, concorrência, crédito, logística e qualidade aprovados.
- CI da `main` contendo a candidata [#42406067465](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42406067465): **SUCCESS** (316 PASS / 0 FAIL, benchmark de estabilidade até 1.825 dias).
- Benchmark V2.9: 90 dias/3 setores, 365 dias/5 unidades; redução de caracteres do JSON de **67,2% / 67,5%** respectivamente por codec reversível, com `importSave` preservando `JSON.stringify` original e conciliação de razão/estoque **PASS**.
- Cenários mostraram **demanda não atendida de 100% / 59,7%** e risco de liquidez na primeira trajetória; tais resultados **não comprovam equilíbrio nem diversão** e exigem análise de gameplay.
- Save tradicional `saveFormatVersion 1` continua disponível para importação nas versões anteriores; novo formato compacto `saveFormatVersion 2` é **opcional**, só legível em V2.9+ e nunca deve ser o único arquivo se o jogador puder voltar à V2.8.
- Novo relatório de qualidade é apenas leitura do estado, não altera eventos, regras econômicas ou caixa. `schemaVersion 9` permanece.
- Checkpoint da candidata: `checkpoints/v2.9.0-alpha.1-ci-pass`; rollback estável precedente: `releases/v2.8.0-homologada`.

## Registro de aceite e ressalvas

O comando do titular autoriza a **homologação formal V2.9.0**, mas **não certifica** a conclusão dos seguintes itens:

1. Execução de `ATUALIZAR_E_JOGAR.bat` em máquina Windows e inicialização do `index.html` local.
2. QA visual do painel `Sistema → QA e balanceamento`, acessibilidade, clique dos botões e responsividade em navegador real.
3. Exportação/importação manual de uma carreira real, integridade de cópia externa e persistência ao fechar/reabrir.
4. Observação de balanceamento, rentabilidade, curva de dificuldade, diversão e desempates de mercado; a presença de muita demanda perdida impede declarar balanceamento consolidado.
5. Teste com `file://` e limites específicos de `localStorage`, sobretudo quando o save tradicional se aproxima dos 25 milhões de caracteres.

**A autorização permite promoção formal com ressalvas documentadas; não permite transformar testes automatizados em QA humano realizado.** Preserve o JSON tradicional da V2.8 antes de atualizar e mantenha a V2.8 para rollback.

## Gate técnico para publicar a versão definitiva

1. Promover identificação para `2.9.0` no motor, HTML-base, `package.json` e regressões, sem modificar a mecânica de jogo.
2. Reconstruir o `index.html` deterministicamente e executar **316 testes** mais benchmarks de estabilidade, concorrência, crédito, logística e qualidade; guardar checksum SHA-256 e artefato.
3. Confirmar **CI da branch de promoção = SUCCESS** e que o HTML no commit corresponde ao build.
4. Integrar o PR de homologação à `main`, verificar CI da `main` no SHA exato do merge e comprovar o mesmo checksum.
5. Somente depois, criar e conferir `releases/v2.9.0-homologada` no mesmo SHA da `main`. Preservar `releases/v2.8.0-homologada` e `checkpoints/v2.9.0-alpha.1-ci-pass` para recuperação.
6. Atualização em Windows somente depois de exportar JSON V1 da carreira em armazenamento externo.

**Status documental:** ACEITE FORMAL CONCEDIDO. A conclusão da publicação e do checkpoint depende de registro verificável dos gates 2–5; QA manual permanece sem comprovação.