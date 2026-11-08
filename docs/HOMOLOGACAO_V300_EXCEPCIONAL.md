# Homologação V3.0.0 — Exceção expressa do titular (08/11/2026)

**Natureza:** homologação excepcional sob responsabilidade do titular, com dispensa de parte do QA manual. **Não é uma certificação de que 18/18 requisitos foram testados.**

## Autorização e escopo

Em resposta ao parecer NO-GO e à explicação das pendências, a instrução expressa foi: “entao desconsidere esta nescessidade e homolohue”. A dispensa abrange as comprovações restantes de Windows pessoal/BAT/atualização real, save privado e rollback específico, aparelho mobile físico, aceite subjetivo de balanceamento e os efeitos agregados nos checkpoints 01–05. A dispensa **não** transforma estados `PARTIAL` ou `NOT_EXECUTED` em `VERIFIED`.

O manifesto ordinário `docs/V300_READINESS_EVIDENCE.json` permanece como foto histórica e continua indicando **5/18 requisitos VERIFIED e NO-GO ordinário**. Este registro constitui via **alternativa e explicitamente autorizada** para promover uma versão com risco aceito, não uma edição retroativa das evidências.

## Provas que sustentam a promoção excepcional

- [Linux CI — 431/431](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42507651867): build determinístico, schema 9 e regressões, 0 falhas.
- [Windows CI](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42507651978): 19/19 BAT/PS1 com rede simulada, 33/33 storage/browser, 66/66 integração, 12/12 IndexedDB, 6/6 mobile emulado e 4/4 1.825 dias com 1/5 unidades, sem quota block.
- Relatos pessoais anteriores: W01 SHA de backup e W02 Chrome/Edge em execução física; W03/W04/W06/W07 declaradas aprovadas pelo titular. Nenhum conteúdo privado foi enviado para CI.

## Riscos aceitos e instruções de recuperação

- Celular **físico** e ambiente pessoal completo não receberam validação interna; interação 320/390/768px foi **emulada**.
- Backups pessoais e rollback não foram inspecionados independentemente; não prometer recuperação de toda carreira nem alterar arquivos pessoais.
- Balanceamento e diversão ainda não têm aprovação observacional independente. A fixture com cinco estabelecimentos incluiu capital adicional sintético, não representa progressão orgânica.
- Com cinco estabelecimentos e 1.825 dias, exportação tradicional atingiu aproximadamente 21,2 MB, próxima do limite de importação de 25 MB; use backup compacto V2 além do tradicional V1, sem descartar V1.
- V2.9 homologada preservada em `releases/v2.9.0-homologada` commit `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`. Não executar atualizador em ambiente pessoal sem backup JSON externo e conferência da versão.

## Política de promoção

Somente identificar `3.0.0` como versão homologada **excepcionalmente** após CI Linux e Windows SUCCESS do commit de promoção, HTML byte-idêntico, integração auditada na `main` com CI SUCCESS e checkpoint de release no SHA verificado. A PR original de auditoria pode permanecer histórica; não há obrigação de falsificar o gate ordinário.

**A aprovação do titular foi concedida para promoção sob essas ressalvas, não para alterar ou omitir a verdade das evidências.**
