# V3.3.3 — Debug adversarial pré-homologação

Base auditada: PR #56, HEAD `9d5e74fe2929a0a2274f79b6cba7358a8457789e`.
Branch exclusiva: `fix/v3.3.3-debug-prehomologacao`, sobre a branch E.
Estável protegida: `main`, V3.3.2, `8d113799cb03e9af2a3c411ba4b90024a0d1eeff`.

## Diagnóstico dirigido

Foram lidos os contratos A–E, testes A–E, descrições das PRs #52–#56,
projeções da Central/Agenda, rotas contextuais, guardas de commit/importação,
armazenamento durável e ensaios de migração, rollback e carreiras longas.
As evidências antigas são referência, não substituem CI desta branch.

As lacunas reproduzidas foram transições fora dos caminhos principais:
interação durante importação, abertura pelos controles legados, dispensa sem
turno subsequente e filtragem depois de uma coleção grande de compromissos.

## Defeitos comprovados

| ID | Gravidade | Reprodução antes da correção | Correção mínima | Risco residual |
| --- | --- | --- | --- | --- |
| DBG-001 | P1 | Com `commitInFlight` ou `startupBlocked`, executar o atalho abria formulário usando contexto ainda não confirmado. Dois testes com a função de produção falharam: 1 abertura em vez de 0. | Recusar navegação antes do planejamento enquanto o armazenamento estiver pendente. | Não é um protocolo de exclusão entre abas; a guarda protege a sessão corrente. |
| DBG-002 | P2 | Abrir Agenda e acionar `v332AdvisorExpand` pelo botão legado deixava ambos os painéis abertos. O teste observou `hidden=false` na Agenda. | Fechar Agenda e atualizar `aria-expanded` ao expandir Equipe, inclusive pelo HUD. | Inspeção humana em hardware continua pendente. |
| DBG-003 | P2 | Dispensar aviso atualizava a Equipe/HUD, sem chamar a projeção do resumo; total antigo permanecia até outra renderização. | Reprojetar o resumo no mesmo evento, sem escrita no save. | Histórico continua efêmero por mundo, conforme contrato. |
| DBG-004 | P2 | Com 101 ocorrências, resumo dizia 100 e filtro de unidade cujo compromisso estava após o corte retornava vazio. | Ler toda a coleção na projeção, filtrar antes de limitar a Agenda visível a 3. Limites finitos externos continuam com teto 100. | Leitura cresce com a coleção real; não se renderiza a coleção inteira. |

Reprodução inicial: **5 testes falharam por suas asserções**, sem erro do harness.
Correções e regressões A–E: **64/64 PASS**. Um sexto teste de debug acrescenta
carreira real do Core com duas unidades, checklists ativados e 1.825 dias:
mais de 100 compromissos, totais corretos, balanço/reconciliação, exportação
tradicional/compacta e reimportação sem perda. Todos os dados são sintéticos.
Nenhum defeito confirmado ficou sem correção neste lote; nenhum P0 reproduzido.

## Validação e evidências

- `npm run check`: suíte completa e build canônico. Resultado final e SHA exato
  devem ser conferidos nos checks vinculados à PR Draft deste debug.
- `node --test tests/v333_debug.test.mjs tests/v333_patch_*.test.mjs`: correções
  isoladas e regressões dos cinco patches.
- `npm run bench:stability`: 30/365/1.825 dias, 1 e 5 unidades; seis cenários
  com integridade PASS, schema 10.
- `npm run bench:consolidation`: 30 dias/1 unidade, 365 e 1.825 dias/5 unidades;
  integridade, exportação e reimportação PASS. Simulação máxima local ~5,5 s;
  ciclo completo ~13,8 s. Medições Node/Linux com DOM simulado, não navegador.
- Save tradicional de cinco anos/cinco unidades ~21,4 MB (85,2% do limite),
  compacto ~7,0 MB. Aviso de proximidade de limite já existe; não foi removido.
- O workflow Linux existente foi habilitado para esta branch; o workflow
  Windows existente também, com oito novos cenários Chrome/Edge em 320, 390,
  768 e 1366 px, perfis temporários e `file://`.
- QA novo de navegador: dispensa/resumo, exclusividade de painéis, Escape e
  teclado, importação suspensa deterministicamente em `File.text`, recusa de
  atalhos pendentes, abort real de transação IndexedDB na troca contextual,
  repetição bem-sucedida e comparação econômica/fiscal antes/depois.
- QA Windows herdado: cidade/câmera/lotes/overlays, C/D/E, navegação e operações
  simuladas, migração V2.9, IndexedDB/abort/reabertura, BAT/updater sintético,
  mobile emulado e carreiras de 365/1.825 dias com 1/5 unidades em Chrome/Edge.
- `node tools/verify-html-byte-identical-v300.mjs` deve ser executado após o
  commit do HTML canônico; comparar com HEAD anterior ainda não comitado
  produz divergência esperada e não constitui defeito do build.
- `node tools/v333-release-gate.mjs`: NO_GO esperado, zero erros de contrato;
  aceite humano e publicação continuam sem autorização.

Links de CI, SHA final e decisão técnica consolidada ficam na descrição da
PR, evitando gravar dentro de um commit o próprio identificador circular.
Somente resultado concluído no SHA correspondente vale como evidência final.

## Limitações e hipóteses não confirmadas

- Chromium local não iniciou: `socket() failed: Operation not permitted`.
  Nenhum resultado de navegador local é declarado. O ambiente adequado é
  GitHub-hosted Windows; resultados devem ser lidos nos checks da PR.
- Não foram usados saves pessoais, Windows pessoal nem dispositivos físicos.
- Concorrência entre abas/processos não foi reproduzida neste lote; a guarda
  de UI e os testes de concorrência referem-se a uma sessão. Não declarar
  cobertura de exclusão global entre múltiplas abas.
- Datas inválidas por formato foram consideradas na inspeção; não houve
  reprodução com save aceito pelo Core que justificasse alterar o validador.
- Não há certificação de ausência de todos os defeitos possíveis. Inspeção
  funcional/visual humana continua necessária antes de homologação.

## Arquivos modificados

- `src/ui/v31-immersive.part.js`: DBG-001/002/003.
- `src/contracts/v333-decision-engine.mjs`: coleção completa para projeção.
- `src/contracts/v333-operations-view.mjs`: DBG-004, filtro antes do corte.
- `tests/v333_debug.test.mjs`: reprodução executável e carreira real longa.
- `tools/qa-windows-v333-debug.mjs`: regressões de navegador/IndexedDB.
- `.github/workflows/ci.yml`, `.github/workflows/qa-windows-v300.yml`: validar
  a branch exclusiva; nenhuma etapa de merge/release/deploy adicionada.
- `index.html`: artefato offline canônico recompilado.
- Este relatório.

Core, mecânica econômica/fiscal, schema 10, versão publicada 3.3.2, geometria,
armazenamento durável e atualizador permanecem intactos. Não houve merge,
publicação, release, tag, homologação ou modificação da branch E.

**Decisão:** PASS técnico somente se os checks finais Linux e Windows deste
commit concluírem integralmente; até lá NO-GO técnico por evidência pendente.
Mesmo com PASS técnico, release/homologação permanecem NO-GO aguardando decisão
humana expressa e os critérios de aceite do projeto.
