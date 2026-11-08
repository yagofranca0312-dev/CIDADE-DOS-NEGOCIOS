# V3.0 — Saneamento P0-01: gravação transacional do progresso no navegador

**Registro técnico:** 07/11/2026 (America/Fortaleza).  
**Status:** **MITIGAÇÃO APROVADA EM CI E EM CHROME/EDGE REAIS NO WINDOWS HOSPEDADO (33/33 PASS), COM QA PESSOAL AINDA PENDENTE**. [CI Windows #42432588846](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42432588846). [CI #42431354313](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42431354313), commit `d42df11e4a807a67b70336b2a8ac6cb25dc9e442`. HTML gerado com 1.479.945 bytes, SHA-256 `3dea7a0560ae97ec6b994a470068ce7d72fd9eff18f07779584ef9095cb8e398`.  
**Origem:** [Etapa 8 — parecer NO-GO](V300_GATE08_GO_NO_GO.md), `RG-06` e `RG-12`.  
**Branch:** `audit/v3.0-consolidacao-integral-v2-20261107`; PR #39 continua DRAFT, `main` e V2.9 homologada intocadas.

## Defeito mitigado e comportamento correto

Antes, `src/ui/app.js::commit` aplicava `state=result.state` e chamava `saveLocal()` depois. Mesmo quando o navegador rejeitava escrita em `localStorage` (quota, privacidade, permissão), a operação econômica já havia sido considerada concluída na memória e o usuário podia perder o progresso ao fechar a página.

**Política nova — falhar fechado:**

```text
Intenção do usuário ou timer
  -> CidadeCore.dispatch(stateAntigo,comando)  // produz candidato isolado
  -> se REJECTED: sem troca de state
  -> se APPLIED: Core.exportSave(candidato)  // valida envelope
       -> localStorage.getItem(chave)          // cópia anterior
       -> localStorage.setItem(chave,envelope)
       -> localStorage.getItem(chave) === envelope?
         SIM -> state = candidato -> render -> mensagem "confirmada"
         NÃO -> tentar preservar/restaurar a chave anterior
                -> NÃO alterar state nem exibir sucesso
                -> parar avanço automático no próximo retorno falso
                -> informar falha e orientar backup externo
  -> se DUPLICATE: nenhuma nova escrita ou efeito econômico
```

O mesmo guard `persistLocal(incoming.state)` é aplicado **antes** de trocar a carreira durante **importação** e **restauração**; cópia anterior no navegador continua obrigatória em tais operações. `CARREIRA.CRIAR` também não cria estado ativo quando falta armazenamento confirmado.

**Invariantes:** o motor, os centavos, journal, RNG, `schemaVersion=9`, os comandos econômicos, a UI de compra e os formatos de save **não mudaram**. O novo comportamento evita **novos comandos aprovados somente em memória** diante de escrita recusada. A chave local de salvamento V1 e a cópia anterior V2.4.1 permanecem as mesmas.

## Cobertura de regressão automatizada

Arquivo: [`tests/persistence_p0_v300.test.mjs`](../tests/persistence_p0_v300.test.mjs). Usa as **funções reais `persistLocal` e `commit` da UI**, extraídas do mesmo código-fonte em harness `vm`, combinadas ao **motor real** e armazenamento simulado. Não é mock do efeito econômico.

1. Criação de carreira e reimportação do envelope verificado;
2. Quota cheia bloqueia abertura de unidade e preserva estado, caixa e save anterior;
3. Quota cheia bloqueia a própria criação da carreira;
4. Escrita silenciosamente ignorada é detectada por read-back;
5. Escrita que muda a chave e falha tenta restaurar o save anterior;
6. Leitura negada por permissão aborta comando;
7. Restabelecida a quota, novo comando aplica **uma vez** sem duplicidade;
8. Avanço de 30 dias recusado preserva tick e seed RNG;
9. Exportação/serialização que falha não aplica o comando;
10. Importação e restauração usam `persistLocal` **antes** de trocar a carreira, teste estrutural;
11. `RG-06` e `RG-12` seguem abertos **parcialmente**, apesar do ensaio real em Chrome/Edge no Windows hospedado, até teste no computador do jogador com saves autênticos e recuperação após reinício.

**Teste histórico atualizado:** `tests/stabilization_v241.test.mjs` deixa de exigir o antigo `if(!saveLocal())` e protege a nova guarda. O teste do gate 8 permanece estrito: **apenas QA Windows hospedado/headless está comprovado**; nada foi promovido a QA pessoal/instalação do jogador.

## Limites honestos

- `localStorage` **não é durável como um banco transacional**. Mesmo leitura de retorno correta não prova que o navegador reterá dados após reinício, limpeza manual, troca de origem ou alteração da política de privacidade. Persistir bytes não implica backup externo.
- Uma execução de escrita pode lançar após modificar a chave por anomalia da implementação: o guard tenta restaurar o conteúdo anterior e alerta se não conseguir confirmar. **Não há garantia de recuperação nesse caso excepcional.**
- O guard **não** permite continuar uma carreira com persistência local falhando. O usuário deve recuperar espaço/permissão e **exportar um JSON externo verificando o download**; não afirmar que um arquivo foi salvo só por emitir `a.click()`.
- Saves muito grandes (1.825 dias/5 unidades) podem exceder quota muito antes do limite próprio de 25 milhões de caracteres. O backup compacto V2 exige versão V2.9+; para rollback amplo preservar JSON tradicional V1.
- Chrome/Edge **reais** em Windows hospedado (`file://`) passaram em [33 checagens automatizadas](V300_QA_WINDOWS_HOSTED.md), inclusive `QuotaExceededError` real, reinício e export/import JSON sintético. **Não houve QA no Windows do jogador, Android/iOS físico ou save pessoal. `RG-06` e `RG-12` estão `PARTIAL`, não `VERIFIED`.**
- O HTML `index.html` deve ser regenerado no mesmo commit da correção; `npm run check`, benchmark e GitHub CI precisam validar **a branch exata** antes de declarar a mitigação técnica aprovada.

## Próximo ensaio manual obrigatório

Em **instalação isolada**, guardar um JSON tradicional V1 fora da pasta do jogo, conferir checksum/hash e fazer uma operação com armazenamento habilitado (persistência comprovada após fechar/reabrir). Em Chrome/Edge Windows `file://`, induzir quota cheia ou permissão negada; confirmar que o novo comando **não altera** caixa/revisão/tick, que o jogo exibe aviso de falha e não confirma efeito, e que o **save anterior** recupera a carreira. Restaurar permissão/quota, repetir operação e verificar uma única contabilização; exportar JSON e importar em cópia separada. Documentar ambiente, navegador, SHA exato, data, resultados e falhas. Não usar o único save pessoal nem publicar dados privados em GitHub.

**Decisão:** bloqueio de *continuação silenciosa em memória* mitigado em código/testes; **homologação V3.0 segue NO-GO** até QA real, compatibilidade e aceite formal.
