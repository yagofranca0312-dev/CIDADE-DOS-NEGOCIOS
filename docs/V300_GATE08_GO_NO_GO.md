# Cidade dos Negócios — V3.0.0 / Etapa 8 — Auditoria final de prontidão (GO/NO-GO)

**Data do parecer:** 07/11/2026 (America/Fortaleza).  
**Escopo:** `3.0.0-08`, **auditoria de prontidão, NÃO homologação**.  
**Parecer:** **NO-GO para merge, promoção da V3.0.0, tag, release ou checkpoint homologado.** A execução da auditoria é concluída; a condição de liberação do produto continua **BLOQUEADA**.  
**Repositório:** `yagofranca0312-dev/CIDADE-DOS-NEGOCIOS`; PR [#39](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/pull/39), **DRAFT**, não integrada.  
**Base homologada:** `releases/v2.9.0-homologada` commit `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`, conferido no GitHub.  
**`main` observada:** commit `871df2b1cd133bcad717c0194a474a35fbabcd3c`, `3.0.0-alpha.1` com Patch A, **não homologada**.  
**Última auditoria automática antes deste checkpoint:** [CI #42428454609](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42428454609), commit `6f8395be3ed03e4462bc8c820233a85d8e7f8a98`, **381/381 PASS**, benchmarks e build reprodutível. Uma futura candidata final exige **CI nova em seu SHA exato**.

**ADENDO posterior à emissão do NO-GO:** a [mitigação P0-01](V300_P0_PERSISTENCIA_TRANSACIONAL.md) alterou o código **na branch de auditoria** para persistir o estado candidato antes de ativá-lo, com testes simulando falhas de `localStorage`. As referências abaixo à vulnerabilidade de `commit()` descrevem a **condição existente no momento original da auditoria**, que motivou a correção; **não afirmar que a guarda está ausente no código da branch depois do patch**. O veredito geral **NO-GO** continua válido até QA Windows, recuperação de saves reais e aceite.

**ADENDO QA Windows hospedado — posterior ao saneamento P0:** [`V300_QA_WINDOWS_HOSTED.md`](V300_QA_WINDOWS_HOSTED.md) registra [CI Windows #42432588846](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42432588846), **33/33 verificações PASS em Chrome e Edge 156 no Windows NT 10.0.26100.0 (headless)**: `file://`, quota REAL, comando recusado, save preservado, fechamento/reabertura, export/import JSON e fixture sintética V2.9. O build foi normalizado para LF e o HTML exibiu **SHA-256 idêntico Windows/Linux** (`3dea7a0560ae97ec6b994a470068ce7d72fd9eff18f07779584ef9095cb8e398`, 1.479.945 bytes). **`RG-06/08/10/12` passam a `PARTIAL` com evidência hospedada**; `RG-09` (BAT), `RG-11` (save pessoal), `RG-13` (QA visual completo), `RG-14` (mobile real), `RG-15` (carreira longa em browser) e `RG-16` (aceite jogabilidade) continuam **NOT_EXECUTED**. A tabela histórica abaixo refere-se aos riscos **na data original**, antes da mitigação e do ensaio Windows; não descrever seus enunciados como estado atual da branch. **Parecer geral permanece NO-GO** até provas pessoais e aceite.

## 1. Veredito por checkpoint — não transformar PASS de CI em GO geral

| Etapa | Objeto | Prova obtida | Condição na Etapa 8 |
|---|---|---|---|
| 01 | Inventário V2 completo | Matriz do motor/domínios e testes por área | **PARCIAL**: fluxos históricos e prova funcional em navegador não fechados |
| 02 | Um dono por comando/efeito | `dispatch`/journal/eventos únicos, proteção de idempotência | **PARCIAL**: PR-01 folha projetada vs contabilizada e PR-02 propostas de compras paralelas ainda exigem decisão fundamentada |
| 03 | Integração de sistemas | Regressões transversais RH, fiscal, IA, mercado, crédito, logística | **PARCIAL**: cobertura funcional em interface real não comprovada |
| 04 | Migrar/recuperar/rollback saves | 18 testes com engine estável V2.9 original, schemas 2–9, JSON V1/V2 e corrompidos | **PARCIAL**: nenhum save pessoal real foi executado em Windows com `file://` |
| 05 | Longa estabilidade e performance | 30/365/1.825 dias, 1/5 unidades, oito painéis sob DOM simulado, correção de hash na aba Sistema | **PARCIAL**: sem FPS, latência, persistência ou quota real do navegador |
| 06 | Documentação unificada | README, CHANGELOG, ROADMAP, guia e contrato editorial, seis testes documentais | **PASS DOCUMENTAL CI**, não homologa produto |
| 07 | Contrato de leitura para V3.1 | Adaptador separado, 11 testes sem mutação, eventos e ações consultivas | **PASS TÉCNICO CI**; UI V3.1 **não implementada** |
| **08** | **Prontidão de release** | Esta matriz, verificador automático e plano de QA | **AUDITORIA EXECUTADA / RELEASE NO-GO** |

### Evidências documentais

- [Dossiê dos oito gates](V300_CONSOLIDACAO_INTEGRAL_GATES.md); [matriz de propriedade e efeitos](V300_MATRIZ_CONTRATOS_E_PROPRIEDADE.md).
- [Migração e rollback](V300_MIGRACAO_ROLLBACK_SAVES.md), [performance e limites](V300_PERFORMANCE_ESTABILIDADE.md).
- [Guia único de uso/recuperação](JOGAR_GUIA_V300.md), [contrato futuro V3.1](V300_CONTRATO_UI_V31.md).
- Registro de leitura independente: `docs/V300_READINESS_EVIDENCE.json`, 18 requisitos `RG-01`–`RG-18`, **4 referências técnicas/documentais verificadas**, **14 requisitos ainda não concluídos**.

## 2. Bloqueios de liberação e severidade

| ID de risco | Severidade | Condição observável / prova | O que autoriza retirar o bloqueio |
|---|---|---|---|
| **RG-06 / PR-03** | **Crítica — integridade da carreira** | `src/ui/app.js::commit()` atualiza o estado em memória e chama `saveLocal()` **sem condicionar o sucesso ao resultado**. `saveLocal()` usa envelope V1 em `localStorage`; quota/negação pode falhar. Em um navegador real isso pode deixar progresso não persistido ao fechar a aba | Estratégia segura de recuperação e **ensaio real** de quota cheia/bloqueio: sem falsa garantia de durabilidade, com JSON externo recuperável ou impedimento seguro/recuperação da operação; repetir após fechar/reabrir. **Não declarar resolvido apenas com aviso visual.** |
| **RG-11** | Alta — compatibilidade | Fixtures dos schemas 2–9 e motor V2.9 original passaram, mas nenhum arquivo privado do jogador foi testado | Usar **cópia** de save real, hash do arquivo sem expor conteúdo, validação de saldos/estoque/histórico/RNG/data antes e depois, e rollback em pasta separada |
| **RG-08/09/10/13** | Alta — instalação Windows | Sem evidência de `file://`, dois navegadores, BAT, persistência após reinício e ações de menu com DOM real | Roteiro manual assinado, capturas/logs não sensíveis, Windows/Chrome/Edge declarados e estado recuperado |
| **RG-14/15** | Alta — uso real/escala | Benchmark Node/Linux com DOM simulado, não é FPS, RAM, quota nem responsividade em mobile | Amostra de desktop e dispositivo móvel, cenário curto e longo, tempos e falhas em console documentados |
| **RG-05/07/16** | Média/alta — abrangência | PR-01 e PR-02 são riscos de divergência, **não bugs de lançamento duplo comprovados**; árvore V2 e jogabilidade não exaustivamente exercitadas | Testes de paridade e decisão de arquitetura, percurso operacional cruzado, registro de análise do balanceamento (demanda e risco de caixa) |
| **RG-17** | Bloqueio de processo | **Não há candidata identificada como `3.0.0`, nem CI de promoção no SHA exato** | Preparar candidata **só depois da correção/QA**, atualizar versão/build, executar CI e revisão independente no commit pretendido |
| **RG-18** | Bloqueio de governança | **Nenhum aceite explícito V3.0 final** foi recebido. Aceites históricos V2 não se transferem à V3.0 | Obter comando explícito **depois** de demonstrar evidências e ressalvas; não inferir aceitação por “siga etapa 8” |

**Não são falhas comprovadas automaticamente:** cálculos distintos de planejamento, cenários hipotéticos e ausência de QA real; esses são **riscos não quitados**. A vulnerabilidade de durabilidade `localStorage` é **risco constatado em revisão de código**, não perda real de save do jogador observada.

## 3. Matriz de QA prático — roteiro executável, pendente de execução

**Ambiente a registrar antes do teste:** SO/build do Windows, navegador e versão, caminho/execução `file://`, resolução, RAM, tipo da máquina, SHA-256 do `index.html`, SHA/ID do commit do jogo, versão exibida, presença de backups. **Nunca salvar nomes, conteúdo de saves pessoais ou documentos reais no repositório.**

| Roteiro | Passo do testador | Critério de aceite e evidência requerida |
|---|---|---|
| **QA-W01** | Copiar V2.9 homologada para pasta isolada; exportar backup JSON V1 de carreira válida e conferir arquivo/hash | Arquivo físico fora da pasta atualizável; hash, tamanho, data, versão da origem anotados; nenhum save original modificado |
| **QA-W02** | Abrir `index.html` V3 alpha em Chrome e Edge por `file://`, e usar `JOGAR_OFFLINE.bat` | Carrega mapa e menus sem erro fatal, data/versão iguais à candidata; evidência por navegador |
| **QA-W03** | Realizar um comando confirmado, registrar saldo/estoque/evento/revisão, fechar aba e navegador e abrir de novo | Estado **idêntico** após recuperação; repetir com duas unidades e com sessão longa |
| **QA-W04** | Em ambiente isolado, saturar/impedir quota `localStorage` e confirmar ação do jogador | Estado nunca apresentado como seguramente salvo quando não está; proteger arquivo anterior e obter backup externo recuperável ou estratégia de rollback; registrar comportamento de erro |
| **QA-W05** | Importar **cópia** de JSON V1 real e, onde suportado, V2 compacto; navegar várias competências | Sem criação retroativa de gastos, tributos, crédito, vendas; revisão, eventos e estoque preservados; ledger conciliado |
| **QA-W06** | Exportar JSON tradicional V1 após ação do Patch A e tentar abrir cópia na V2.9 homologada | Validar leitura, valores, ledger e continuação de dias no motor antigo; compacto V2 só em V2.9+ |
| **QA-W07** | Usar Cidade, Empresas, Mercado, Compras, Administrativo (Finanças/Contabilidade/Logística/RH/Fiscal/Paralegal) e Sistema | Não mutar estado por relatório, não perder foco/menus, prompts de comandos reais, sem erros JS; comparar antes/depois |
| **QA-W08** | Simular 30/365/1.825 dias ou importar snapshot longo; alternar oito áreas; medir exportar/importar | Registrar tempos, travamentos, uso de memória, tamanho e disponibilidade do save com hardware identificado; riscos próximos de 25 MB |
| **QA-M01** | Testar em dispositivo móvel real ou emulador identificado (larguras 320/390/768 px, toque e scroll) | Menus, lotes, confirmação, tabelas e backups acessíveis; qualificar real vs emulado; capturas e limitações |
| **QA-G01** | Exercitar evolução da rede, crédito, contratos, rivalidade, logística, folha, fiscal simulado e compras planejadas | Nenhuma duplicidade contábil; distinguir realizado de projetado, Fiscal Operacional de tributo didático, transferência de venda |
| **QA-G02** | Avaliar equilíbrio da carreira curta/longa, demanda perdida, margem, capital, progressão e diversão | Registro objetivo dos números, casos negativos, percepção do jogador e limitações; não presumir equilíbrio por 381 PASS |

**Coleta mínima para cada caso:** ID, status `PASS/FAIL/BLOCKED/NOT_EXECUTED`, data, plataforma, commit e hash, pré-condições, passos, resultado observado, evidência referenciável e conclusão. **Não adicionar fotos com CPF, arquivos pessoais completos ou dados bancários.** Se falhar, registrar bug e repetir com novo SHA após correção; teste em SHA anterior **não homologa correção posterior**.

## 4. Política de certificação e ferramentas

### Comando de auditoria sem efeitos externos

```bash
npm run audit:release
```

Lê `docs/V300_READINESS_EVIDENCE.json` e imprime `V300_RELEASE_READINESS` com `decision:"NO_GO"`, motivos e gates incompletos. **Exit code 0 significa somente que a auditoria executou corretamente**, inclusive quando o parecer é NO-GO. A CI deve continuar verde para registrar evidências, sem tornar a versão apta para release.

### Bloqueio explícito para uma operação de release futura

```bash
npm run audit:release:require-go
```

Enquanto os riscos, a candidata e as comprovações exigidas não estiverem validados, **retorna exit code 2**. Seu funcionamento é testado na CI. Este comando **não** publica, altera a `main`, cria tag ou homologa, mesmo que a avaliação futura tenha resultado positivo.

**Limitação essencial:** o verificador lê *declarações* no JSON e prova sua coerência mínima; **não verifica sozinho** se um ensaio manual aconteceu, se uma URL corresponde ao teste declarado ou se o jogador deu aceite. Uma pessoa responsável deve conferir originais, ambiente, SHA e registros. Falsificar `VERIFIED` no manifesto não substitui QA. O GO automatizado, quando existir, é **apenas `READY_FOR_HUMAN_RELEASE_APPROVAL`**, nunca `HOMOLOGATED`.

## 5. Ordem objetiva de saneamento para nova tentativa de gate 08

1. **P0 — salvar progresso com segurança:** correção/mitigação de quota e falha de `saveLocal()`; manter backup JSON tradicional V1 e compacto V2, sem truncar histórico; executar testes de falha de storage e recarga real.
2. **P0 — Windows e saves pessoais:** testar `file://`, BAT, importação real de cópias e rollback V2.9, incluindo saturação/bloqueio de `localStorage`.
3. **P1 — concluir 01–03 e QA visual:** revisar PR-01/PR-02, cobrir fluxos integrados e medir Chrome/Edge/mobile/longa duração com evidências reais.
4. **P1 — candidata e release:** após fechar requisitos, criar `3.0.0` candidata, CI no SHA exato e auditar novamente. **Não confundir DRAFT mergeable com pronto para publicar.**
5. **Governança:** apresentar relatório de GO/NO-GO com riscos residuais, solicitar **aceite explícito**, e só então, sob comando específico, promover versão, integrar `main`, verificar CI do merge e preservar snapshot imutável. Sem autorização, parar no relatório.

## 6. Decisão oficial desta execução

**`3.0.0-08` — AUDITORIA DE PRONTIDÃO CONCLUÍDA / RELEASE BLOQUEADA (NO-GO).**  
**`3.0.0` NÃO HOMOLOGADA. `3.0.0-alpha.1` permanece em desenvolvimento. `2.9.0` continua o último marco homologado.**  
Não fazer merge da PR #39, não criar `releases/v3.0.0-homologada` nem tag de release, não alterar `main` ou a instalação do usuário. Os itens futuros são **planejados**, não fatos já realizados.


## Adendo pós-auditoria — P0-03 instaladores Windows (07/11/2026)

**Evidência nova:** [`docs/V300_QA_BAT_SAVE_LOCAL.md`](V300_QA_BAT_SAVE_LOCAL.md), [CI Windows #42434425027](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42434425027), **19/19 testes BAT/PS1 PASS**, além de **33/33 verificações Chrome/Edge** e hash HTML byte-idêntico. ZIP/API/abertura do atualizador foram **simulados dentro do Windows hospedado**; o código BAT/PS1 original foi exercitado em pasta descartável. Foram demonstrados proteção de saves fictícios, backup da instalação anterior, não repetição de download, downgrade recusado e restauração do HTML após falha deliberada de cópia.

**Matriz:** `RG-09 = PARTIAL` com evidência real de Windows hospedado e atualização **offline simulada**; `RG-11 = NOT_EXECUTED`, pois nenhum save pessoal foi acessado ou testado. Criado [validador privado e somente leitura](../tools/validar-save-pessoal-local-v300.mjs), validado com dados sintéticos. `RG-06/08/10/12` continuam **PARTIAL**. `RG-13/14/15/16` e outros gates permanecem não quitados.

**Aviso de distribuição:** `ATUALIZAR_E_JOGAR.bat` segue `main`, que contém `3.0.0-alpha.1` sem homologação; portanto **não atualizar a instalação pessoal com esse BAT enquanto o release não for aprovado**. O teste não baixou nenhuma revisão oficial real.

**Decisão da auditoria continua:** **NO-GO para release da V3.0** e PR #39 DRAFT, sem merge, tag ou homologação. O próximo ensaio depende de cópia do save pessoal no Windows físico, BAT com GUI real e teste manual documentado, com consentimento do jogador.


## Adendo pós-auditoria — P1 PR-01 e PR-02 (07/11/2026)

[**Relatório P1**](V300_PR01_PR02_SANEAMENTO.md) · [**CI Linux #42435702398**](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42435702398) · [**CI Windows #42435702391**](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42435702391).

- **PR-01 (duplicação de fórmula de folha):** mitigado por uma única função pura `payrollPeriodQuote` usada na estimativa e no reconhecimento da competência. Preserva a regra do jogo (30 dias e arredondamento individual), um `PAYROLL_ACCRUAL` por competência/unidade e `PAYROLL_PAYMENT` separado sem segundo débito em `EXPENSE`. A auditoria original **não havia comprovado duplicidade de despesa**.
- **PR-02 (cotações de reposição):** confirmou-se um **desalinhamento de limite total** na UI manual: transferências internas pendentes de entrada não eram descontadas da capacidade ao preparar/revisar a compra; o escritor canônico já as descontava. `restockRoom(unit,groupState)` foi corrigido e suas chamadas visuais passam o estado do grupo; nenhuma mudança em `registerPurchase` e nos critérios de estratégias Patch A versus compra manual.
- **Evidência:** **sete regressões novas** em `tests/v300_pr01_pr02_consistency.test.mjs`; **418/418 testes PASS** na CI Linux, 19/19 BAT + 33/33 Chrome/Edge PASS na CI Windows hospedada, HTML offline **1.480.192 bytes**, SHA-256 **`0ac63b72913247249e2559f19009b9941f1d6b794a9f0f17c85904e9eca191c3`** em ambos os sistemas.
- **Governança:** os riscos PR-01 e PR-02 estão **mitigados em código e regressões**. O requisito técnico **RG-07 foi encerrado como VERIFIED** com evidência [CI #42435965283 (418/418 PASS)](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42435965283). A matriz evolui de **4/18 para 5/18 verificados**, com **13/18 ainda pendentes**; checkpoints 02/03 continuam **PARCIAIS** por QA visual/operacional humano não executado.

**Veredito mantido:** **NO-GO** de release V3.0; PR #39 DRAFT e `main`/V2.9 intocadas. Sem merge, publicação, tag ou homologação automática.
