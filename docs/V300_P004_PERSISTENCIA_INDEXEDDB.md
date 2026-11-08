# Cidade dos Negócios V3.0 — P0-04: persistência offline durável

**Data:** 08/11/2026 (America/Fortaleza).  
**Branch:** `audit/v3.0-consolidacao-integral-v2-20261107`, PR #39 DRAFT.  
**Status técnico:** **mitigado no código e testado com saves sintéticos no Windows hospedado**. **Não homologado na instalação pessoal**. `RG-15 PARTIAL` e `3.0.0-08 NO-GO` permanecem.

## 1. Defeito comprovado antes da correção

A gravação da UI original usava o **JSON tradicional V1 inteiro** em `localStorage`, cuja quota efetiva no runner Windows Chrome/Edge ficou próxima de 5 MB. [CI original #42485124066](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42485124066): **4/4 cenários de 365 dias PASS**, porém **0/4 de 1.825 dias**. Com cinco empresas, a persistência falhava já no dia **425**; com uma, nos dias **1.625/1.655**. A proteção fail-closed anterior impedia perda do último save, mas não resolvia o limite. Ver [relatório histórico anterior](V300_QA_CARREIRA_LONGA_BROWSER.md) e [issue P0-04 #40](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/issues/40).

## 2. Solução implantada na branch de auditoria

A persistência primária agora usa **IndexedDB nativo**, com gravação do envelope **V2 compacto, reversível e com checksum**, e não o armazenamento local de aproximadamente 5 MB. Não foi adicionada biblioteca externa nem servidor: o módulo `src/ui/durable-store.part.js` é incluído no `index.html` único via `tools/build.mjs`.

**Protocolo das operações:**
1. O motor `CidadeCore.dispatch` calcula um **estado candidato**, mas ainda não o confirma no jogo.
2. `persistDurable` serializa por `Core.exportSaveCompact` (sem eliminar ledger, eventos ou histórico).
3. `CidadeDurableStore.writeCurrent` grava em **transação IndexedDB** e verifica o conteúdo com nova leitura. Se falhar, tenta restaurar o estado anterior; uma restauração não verificável permanece erro explícito.
4. **Somente depois** a UI promove `state=result.state`, atualiza a data, re-renderiza e notifica êxito. Durante a gravação, comandos concorrentes são recusados.
5. A importação, restauração de cópia e criação de nova carreira também exigem backup/remoção confirmados. Falha mantém a carreira atual.
6. Na inicialização, o jogo lê primeiro IndexedDB. Se ele estiver vazio, reconhece e valida um save tradicional antigo do `localStorage`, migra para V2 compacto no IndexedDB e **só depois da leitura confirmada** remove o save antigo. Erro de abertura/leitura do IndexedDB **não reabre silenciosamente uma cópia antiga possivelmente desatualizada**.
7. Se o navegador **não disponibilizar IndexedDB**, permanece um caminho legado `localStorage` com proteção de quota; esse fallback **não garante cinco anos**. Deve-se manter backup JSON externo.

O Core econômico e o `schemaVersion=9` não foram modificados. Saves externos tradicionais V1 e compactos V2 continuam compatíveis com o motor, inclusive com a V2.9 conforme os testes de fixture. A exportação externa tradicional permanece uma ação explícita e **não garante** espaço equivalente no navegador. IndexedDB é por origem/perfil/navegador; o usuário deve manter backup externo, especialmente antes de limpar dados ou trocar de computador.

## 3. Testes reais no Windows hospedado (Chrome e Edge 156)

**QA de migração e transação:** [CI Windows #42488245360](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42488245360) — **12/12 asserções PASS**. Para cada navegador: IndexedDB real sob `file://`; save **V2.9 fictício** primeiro salvo como legado, migração após reload, cópia legada excluída **apenas após readback**, envelope compacto menor, transação IDB deliberadamente abortada pelo teste, **nenhum dia fictício confirmado**, nova tentativa aceita e nova abertura do navegador com save intacto. São dados exclusivamente artificiais; não houve save real do usuário.

**QA de longa duração:** na mesma [CI #42488245360](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42488245360), o script `tools/qa-windows-longrun-v300.mjs` utilizou o próprio HUD do jogo, salvamento IndexedDB e botões originais de exportação, com quatro cenários:

| Navegador | Unidades | 365 dias | 1.825 dias | Save persistido aos 1.825 dias | JSON tradicional exportado |
|---|---:|---|---|---:|---:|
| Chrome | 1 | PASS | **PASS** | 1.879.172 bytes | 5.819.093 bytes |
| Chrome | 5 | PASS | **PASS** | 6.944.770 bytes | 21.204.106 bytes |
| Edge | 1 | PASS | **PASS** | 1.872.187 bytes | 5.807.458 bytes |
| Edge | 5 | PASS | **PASS** | 6.944.770 bytes | 21.204.106 bytes |

**Resultado: 4/4 cenários de 365 dias PASS, 4/4 de 1.825 dias PASS, 0 falhas inesperadas e 0 bloqueios por quota.** Em todos os checkpoints, save, estado, balanço e conciliação foram verificados; houve exportação real para o disco Windows e recuperação após reload. O uso de memória JavaScript foi amostrado pelo protocolo CDP, não medido como vazamento ou FPS. A fixture com cinco unidades inclui **capital adicional inteiramente fictício**, exclusivamente para testar volume e duração, e não comprova expansão financeiramente viável.

**Regressão do fallback:** a suíte Windows executou também os **33/33 testes anteriores de `localStorage` real**, com IndexedDB indisponibilizado **somente nesses perfis sintéticos**, preservando a detecção de `QuotaExceededError`, fail-closed, recuperação e exportação. **66/66 testes integrados de Mercado, RH, Logística, Contabilidade, Finanças e importação** e **19/19 de BAT/PowerShell isolados** permaneceram aprovados.

**HTML cross-platform:** o HTML offline contendo o novo módulo possui **1.489.147 bytes** e SHA-256 **`94ffbcf234b437c362e98f29aaf8d64cb0051702c83f0c2e68ce2f05eff6a70b`**, reproduzido byte a byte Windows/Linux nos workflows. Sem CDN ou runtime externo.

## 4. O que permanece aberto

- **`RG-15 PARTIAL`:** a prova técnica de 1.825 dias está satisfeita nos browsers Windows hospedados; **não foi realizada prova no Windows pessoal** e não há aceite visual humano de desempenho/jogabilidade. O JSON tradicional de 5 unidades/5 anos já mede cerca de **21,2 MB**, próximo do limite de 25 MB por arquivo; não se promete crescimento indefinido.
- **`RG-06 PARTIAL`:** transação abortada foi provada e não confirmou avanço, mas faltam ensaios adicionais no computador pessoal, permissões, limpeza de dados e recuperação após falha de energia.
- **`RG-11 NOT_EXECUTED`:** teste de migração usou **fixture V2.9 sintética**, não um save pessoal verdadeiro.
- **`RG-14 NOT_EXECUTED`:** ainda falta aparelho mobile físico.
- **`RG-13/16 PARTIAL`:** o teste headless não equivale à avaliação gráfica/experiência subjetiva nem à aceitação de balanceamento.
- **`RG-17 NOT_CREATED` / `RG-18 NOT_GRANTED`:** nenhuma release final foi criada, nenhum aceite foi concedido.

**Decisão:** P0-04 **mitigado tecnicamente**, issue #40 permanece rastreada até validação de implantação e recuperação pessoal. **Gate 08 continua NO-GO, 5/18 requisitos verificados, 13 pendentes.** PR #39 DRAFT; sem merge, tag, release, homologação ou modificação de `main`/V2.9 homologada.
