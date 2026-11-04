# Homologação final — Cidade dos Negócios V2.4.0

**Data de aprovação formal:** 04/11/2026.
**Titular:** Yago (aceite expresso para consolidar e homologar integralmente a V2.4.0).
**Escopo:** promoção estável da versão anteriormente homologada `2.4.0-alpha.3` para `2.4.0`.
**Status de gate técnico:** APROVADO. GitHub Actions 41928503855, build reproduzível, 243 testes PASS e 0 FAIL.

## Componentes incorporados
- **Patch A — Paralegal:** aprovado; checkpoint `releases/v2.4.0-alpha.1-homologada`.
- **Patch B — RH/DP:** aprovado; checkpoint `releases/v2.4.0-alpha.2-homologada`.
- **Patch C — Fiscal Operacional:** aprovado; checkpoint `releases/v2.4.0-alpha.3-homologada`.
- Fonte da promoção: commit `af3f58c4e611131b72ec5290be4fe32357c06780` (código já homologado) e registro documental na main `62ae850ff9dd1572d61c370b7c1a06dbd5d8aef7`.

## Contrato da release
- Muda apenas o número da versão de `2.4.0-alpha.3` para `2.4.0` em núcleo, template, pacote, testes e HTML único.
- Não cria novas mecânicas, tributos, obrigações legais, contas de razão, saldos, comandos ou campos de save.
- `schemaVersion=9`, salvamento local, exportação/importação JSON e motor offline preservados.
- `npm run check`, testes de regressão e `git diff --exit-code -- index.html` são gates obrigatórios, com execução registrada após publicação.
- A validação automatizada não substitui teste visual manual no Windows. O aceite do usuário é formal, sem presumir evidência manual ausente.

## Checkpoint
- Branch de homologação final planejada: `releases/v2.4.0-homologada`.
- **Commit funcional final com os testes aprovados:** `f618415b008847373da816cd061ff90522942430`.
- **Workflow GitHub Actions:** [run 41928503855](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/41928503855), resultado **SUCCESS**.
- **Testes automatizados:** 243 aprovados, 0 falhas (inclui três testes de integração de release).
- **Build offline:** `git diff --exit-code -- index.html` sem diferenças e SHA-256 do HTML: `ac31730a695490166404d0dee13fb466925ddf6c687234079e0ac9cf04c5514f`.
- **Checkpoint após homologação:** `releases/v2.4.0-homologada` apontará para a revisão documental final, com os mesmos arquivos executáveis aprovados.
- **Situação final:** versão `2.4.0` estável aprovada pelo titular, com gates automatizados satisfeitos. Testes manuais Windows/browser não devem ser considerados realizados sem registros específicos.

**Histórico:** os relatórios individuais `docs/V24A_IMPLANTACAO.md`, `docs/V24B_IMPLANTACAO.md` e `docs/V24C_IMPLANTACAO.md` permanecem intactos, para não alterar o registro das versões intermediárias.
