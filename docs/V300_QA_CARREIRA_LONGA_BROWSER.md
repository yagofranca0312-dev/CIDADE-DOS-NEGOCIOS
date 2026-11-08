# Cidade dos Negócios — QA de carreira longa em navegador real (P1-03)

**Data da execução:** 08/11/2026 (America/Fortaleza).  
**Status do ensaio:** **PARCIAL, com bloqueio funcional de persistência P0-04 identificado**.  
**Resultado técnico da suíte:** teste diagnóstico completou sem exceções inesperadas, mas a **meta de 1.825 dias falhou nos quatro cenários**. Uma CI verde significa que o diagnóstico observou e registrou corretamente o bloqueio, **não que a carreira longa tenha sido aprovada**.

**Código do teste:** [`tools/qa-windows-longrun-v300.mjs`](../tools/qa-windows-longrun-v300.mjs)  
**CI Windows:** [Execução #42485124066](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42485124066), SHA `64bcb4892baf85f8b447d8701697e25233f055c9`, job `SUCCESS`.  
**Artefato auditável:** `v300-browser-longrun-metrics` (arquivo `v300-browser-longrun.json` anexado à execução Windows, retido 30 dias).  
**Issue bloqueadora:** [#40 — P0-04: quota de armazenamento impede 1.825 dias](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/issues/40).

## Objetivo, método e limites

O teste abriu o **`index.html` offline real via `file://`** em perfis descartáveis do **Chrome 156 e Edge 156** sob Windows hospedado pelo GitHub, ambos **headless**. Sem servidor e sem conectar qualquer save pessoal.

- **Avanço de tempo feito via HUD original**, pelos botões `+30 dias`, `+7 dias` e `+1 dia`. O teste **não usou dispatch direto na página** para avançar a carreira.
- Cenário **1 empresa**: carreira e abertura feitas por controles originais da UI, sem capital injetado.
- Cenário **5 empresas**: fixture criada no motor oficial com **aporte de R$ 30.000,00 inteiramente FICTÍCIO, EXCLUSIVO DE LABORATÓRIO** para permitir a abertura de cinco unidades; a fixture foi **importada pelo input real da UI**. Não simula uma expansão organicamente viável ou qualquer patrimônio pessoal.
- Checkpoints de **365 e 1.825 dias**, apurando integridade do balanço/razão, reconciliação de estoque, tamanho do JSON tradicional e compacto, importação round-trip compacta, tempo de clique (inclui Playwright/DOM/render), tamanho de save exportado no disco Windows, reabertura por `file://` e uso instantâneo aproximado do heap JS via Chrome DevTools Protocol.
- **Sem alteração de `src/core/game.js`, `src/ui/app.js`, `index.html` ou schema 9** nesta etapa. Não há medição subjetiva de FPS, pintura, toque ou aceitação humana. Heap via CDP é amostra pontual do JS e não uso total da memória do processo.

## Resultado dos cenários

| Navegador | Unidades | Dia 365 | Save padrão no dia 365 | Último dia gravado antes de falha | Save padrão no bloqueio | Save compacto no bloqueio | Resultado para 1.825 |
|---|---:|---|---:|---:|---:|---:|---|
| Chrome | 1 | **PASS** | 1.194.530 bytes | **1.625** | 5.179.860 bytes | 1.669.977 bytes | **BLOCKED_STORAGE** |
| Chrome | 5 | **PASS** | 4.227.627 bytes | **425** | 4.924.782 bytes | 1.607.570 bytes | **BLOCKED_STORAGE** |
| Edge | 1 | **PASS** | 1.168.314 bytes | **1.655** | 5.248.817 bytes | 1.687.557 bytes | **BLOCKED_STORAGE** |
| Edge | 5 | **PASS** | 4.227.627 bytes | **425** | 4.924.782 bytes | 1.607.570 bytes | **BLOCKED_STORAGE** |

**Resumo mensurável:** **4/4 cenários de 365 dias completos e válidos**, **0/4 cenários alcançaram 1.825 dias**. **4/4 falhas de armazenamento confirmaram comportamento fail-closed**: sem avanço de data nem confirmação falsa, sem corrupção do save gravado. Os quatro saves atingidos puderam ser **exportados e recuperados após reload**; os quatro snapshots compactos foram reimportados **em memória** sem perda de dados.

### Medições de UI/memória — amostras, não SLA

| Caso | Média dos cliques HUD até 365 dias | Pior clique HUD até 365 dias | Heap JS pontual aos 365 dias |
|---|---:|---:|---:|
| Chrome, 1 empresa | 98,18 ms | 135,12 ms | 9,79 MB |
| Chrome, 5 empresas | 147,13 ms | 190,76 ms | 13,46 MB |
| Edge, 1 empresa | 96,18 ms | 113,53 ms | 14,80 MB |
| Edge, 5 empresas | 143,45 ms | 180,47 ms | 11,48 MB |

As amostras são **observações do runner Windows headless** e incluem overhead de controle automatizado; não significam FPS garantido, latência na máquina pessoal ou diagnóstico conclusivo de vazamento de memória.

## Diagnóstico P0-04

A escrita local utiliza `Core.exportSave(candidate)` tradicional em `src/ui/app.js::persistLocal`. O arquivo JSON de exportação externa pode admitir até **25 MB**, mas **esse não é o tamanho disponível do `localStorage`**. Nesta execução, a quota efetiva ficou próxima de 5 MB de dados persistidos. Mesmo que um backup compacto seja bem menor, a aplicação **não o usa hoje como formato de gravação local** e **somente compactar não demonstra capacidade de 1.825 dias × 5 empresas**, pois o formato compacto também cresce ao longo do tempo.

O erro observado é **limitação da persistência**, não falha da fórmula econômica, das rotas de UI nem prova de vazamento. Em todos os bloqueios, a guarda P0-01 impediu confirmar uma ação não salva — **não houve perda do snapshot anterior**. Isso **não** significa que o jogador consiga continuar a avançar sem uma estratégia de persistência de maior capacidade.

**Decisão:** abrir e manter [P0-04, issue #40](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/issues/40). Antes de resolver, avaliar opções robustas compatíveis com `file://`, como armazenamento transacional em IndexedDB e estratégias segmentadas com migração, além de fallback/backup JSON externo. Proibir soluções que aceitem comandos sem confirmação de gravação ou descaracterizem saves V1/V2. Exigir novo ensaio de 1.825 dias e rollback quando houver implementação candidata.

## Estado de prontidão

- **RG-15 — `PARTIAL`, não `VERIFIED`**: carreira longa realmente testada no browser, 365 dias passou, 1.825 dias **bloqueado por quota em 100% dos cenários**.
- **RG-06 — `PARTIAL`**: a guarda da persistência funcionou em erro real; arquitetura ainda não suporta a carreira longa proposta.
- **Checkpoint `3.0.0-05 = PARTIAL`**: existe agora medição de navegador/heap/latência, porém sem objetivo de longo prazo atendido.
- **Checkpoint `3.0.0-08 = BLOCKED/NO-GO`**: não promover versão, não fazer merge, tag nem release. `RG-14` (mobile físico), `RG-11` (save pessoal) e aceite continuam pendentes.
- **Requisitos concluídos:** 5/18 `VERIFIED`; **13/18 ainda não encerrados**. Uma mudança para `PARTIAL` **não** reduz a quantidade de pendências.

**Próxima frente técnica:** saneamento P0-04 da estratégia de persistência com contrato de integridade, compatibilidade e rollback, seguido da repetição automatizada integral. A aprovação de release, inclusive riscos residuais e teste pessoal, depende de aceitação posterior expressa. A PR #39 permanece DRAFT e a V2.9 homologada intacta.
