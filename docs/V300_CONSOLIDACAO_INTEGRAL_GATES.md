# V3.0.0 — Dossiê de consolidação integral da linha V2 (pré-homologação)

**Data da abertura:** 07/11/2026 (America/Fortaleza)  
**Escopo autorizado pelo titular:** retomar o roadmap interativo `roadmap_cidade_dos_negocios_v2_v3_interativo.html`; primeiro **consolidar integralmente a V2**, depois aproveitar a implementação do Patch A.  
**Status técnico:** `EM_AUDITORIA / RELEASE_BLOCKED`. **Este documento NÃO homologa nem publica a V3.0.0.**  
**Fonte de requisito:** plano diretor HTML de 04/11/2026 (seção `3.0.0 — Consolidação INTEGRAL da linha V2`).  
**Baseline V2 estável:** `releases/v2.9.0-homologada` — `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`.  
**Código presente na main no início da auditoria:** `871df2b1cd133bcad717c0194a474a35fbabcd3c` — `3.0.0-alpha.1`, Patch A Economia e Balanceamento, já integrado, porém não homologado.

## Contrato original da V3.0

> A V3.0 consolida TUDO o que foi desenvolvido durante a V2 — sistemas, economia, IA, RH, fiscal, contratos, progressão, UX e saves.

A V3.0 é uma **release de unificação, regressão e estabilidade**, sem reconstruir a interface estilo SimCity (reservada à V3.1), sem antecipar aprofundamento tributário das versões seguintes e sem desconsiderar mecanismos já instalados.

**Não reverter, remover ou reimplementar o Patch A por consequência desta auditoria.** Seu código na `main` é preservado, mas sua homologação funcional continua independente do gate de consolidação integral da V2.

## Inventário de referência do ciclo V2 — evidência documental

| Área | Implementação histórica registrada | Estado desta auditoria |
|---|---|---|
| Base visual, mapa e UX | V2.0–V2.2.1: cidade, fachadas e responsividade; V2.3: navegação e dashboards | Implementação/documentação existente; QA cruzado da V3 pendente |
| Gestão / Mercado | V2.3: compras, fornecedores e reposição confirmada | Implementação/documentação existente; regressão integral pendente |
| Administração | V2.4: Paralegal, RH/DP e Fiscal Operacional **simulados**; V2.4.1: passivos e recuperação de carreira | Implementação/documentação existente; validação integrada pendente |
| Progressão / IA / Concorrência | V2.5: GDD e etapa parcial; V2.6: jornada, eventos, reputação, rivais e mercado finito | V2.6 homologada; não tratar V2.5 isolada como release final |
| Crédito e contratos | V2.7: empréstimos e fornecimentos **fictícios**, encargos, vencimentos e calendário | Implementação/documentação existente; validação integrada pendente |
| Produção e logística | V2.8: CD, transferências, padaria, perdas e conciliação interfilial | Implementação/documentação existente; validação integrada pendente |
| Economia, qualidade e saves | V2.9: diagnóstico econômico/contábil e backup compacto V2 opcional, mantendo backup V1 | V2.9 formalmente homologada, QA manual ainda ressalvado |
| Patch A já integrado | V3.0.0-alpha.1: estratégias de capital de giro, cotações de compras, cenários de preço e compra confirmada | CI aprovada; **não homologado** |
| Tributação real / transmissão | Não é função do simulador; cálculos e prazos fiscais do jogo são didáticos e fictícios | Não suportado como operação fiscal real |
| Interface 3D/estilo SimCity | Reservada ao ciclo V3.1 | Planejada; fora de escopo da consolidação |

**Limite:** inventário fundamentado nos documentos e changelog; não equivale a auditoria exaustiva de cada comando e cenário.

## Os oito checkpoints oficiais da V3.0 — avaliação em 07/11/2026

| ID | Gate do HTML | Estado observado | Evidência e lacuna |
|---|---|---|---|
| `3.0.0-01` | Inventário final da V2 | **PARCIAL** | Matriz detalhada de áreas/comandos/donos/testes em docs/V300_MATRIZ_CONTRATOS_E_PROPRIEDADE.md; faltam comprovações funcionais manuais e casos históricos remanescentes |
| `3.0.0-02` | Consolidar APIs e contratos | **PARCIAL** | Único escritor de journal/event/dispatch e calendário inspecionado e protegido por testes; PR-01 (cálculo de folha) e PR-02 (propostas de compra paralelas) ainda exigem controle da divergência futura |
| `3.0.0-03` | Auditoria cruzada geral | **PARCIAL** | Doze testes novos (4 de integração e 8 de propriedade), 343/343 PASS no SHA de teste; matriz dos fluxos e riscos; cenários remanescentes e QA manual pendentes |
| `3.0.0-04` | Migração de todas as carreiras V2 | **PARCIAL** | Matriz automática 18 testes novos PASS, schemas históricos 2–9, rollback Patch A→V2.9 homologada no motor original, corrupção rejeitada; ainda faltam saves pessoais reais e recuperação Windows/file:// |
| `3.0.0-05` | Performance e estabilidade longa | **PARCIAL** | Benchmark V3 instrumentou 8 painéis, saves, relatórios e HTML; CI 364/364 PASS; hotfix de checksum sob demanda reduz Sistema ~2.110→102 ms no DOM simulado de 5 anos; Windows/mobile, quotas e navegador real pendentes |
| `3.0.0-06` | Documentação e tutorial únicos | **PASS DOCUMENTAL (CI)** | README, CHANGELOG, ROADMAP, guia único e matriz canônica alinhados; seis novas regressões, **370/370 PASS** na CI #42427216125; QA humano e homologação geral continuam pendentes |
| `3.0.0-07` | Preparar contrato UI V3.1 | **PASS TÉCNICO (CI)** | Adaptador puro, versão contratual 1, cidade/lotes/eventos/comandos consultivos; 11 testes de leitura sem mutação, **381/381 PASS** na CI #42428343258; sem incorporar V3.1 ao HTML atual |
| `3.0.0-08` | Gate de homologação completa | **BLOQUEADO — PARECER NO-GO** | Auditoria de prontidão executada, relatório GO/NO-GO e 18 requisitos verificáveis; [CI 389/389 PASS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42429308063). Gates 01–05 parciais, quota/localStorage, Windows/mobile/saves reais, candidata e aceite pendentes |

**Nenhum checkpoint é marcado PASS por presunção.** PASS nos testes automatizados não significa PASS nos ensaios manuais.

## Evidências técnicas obtidas no GitHub

1. O checkpoint estável `releases/v2.9.0-homologada` existe no SHA `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`.
2. A `main` contém o Patch A da V3.0.0-alpha.1 pelo merge PR #38, commit `871df2b1cd133bcad717c0194a474a35fbabcd3c`.
3. A comparação `releases/v2.9.0-homologada...main` aponta a `main` **21 commits à frente, zero atrás**. Isto indica continuidade da base V2.9, não validação de todos os checkpoints V3.0.
4. CI da candidata Patch A (run `42414260730`) e CI da `main` (run `42414490966`) concluíram `SUCCESS`. Os 331 testes e seis famílias de benchmarks constam do histórico do Patch A; o workflow da `main` confirma `npm run check`, benchmark de 30/365/1.825 dias e verificação de build.
5. `schemaVersion=9` permanece declarado; backup tradicional V1 é necessário para rollback à V2.8, e compacto V2 requer V2.9 ou posterior.
6. A trilha `docs/V300_PATCH_A_ECONOMIA_BALANCEAMENTO.md` registra os cenários e limitações, incluindo que resultados ruins de demanda não são prova de bug nem de balanceamento global resolvido.

## Trabalho mínimo para conclusão

1. Encerrar `3.0.0-01` com matriz rastreável **funcionalidade → comando → persistência → teste → status**.
2. Encerrar `3.0.0-02/03` por auditoria integrada: ledger, passivos, estoque, trânsito, folha, fiscal simulado, contratos, crédito, progressão, IA, eventos e compras; verificar idempotência e uma única origem para cada fato.
3. Encerrar `3.0.0-04`: save novo e carreiras V2 anteriores; JSON tradicional, compacto V2 e arquivo corrompido; comparar antes/depois sem perda de dinheiro, estoque, histórico e IDs.
4. Encerrar `3.0.0-05`: benchmark reproduzível longo + abrir/fechar painéis + limites reais de memória e tamanho; declarar hardware/navegador.
5. Encerrar `3.0.0-06/07` preservando histórico no README, CHANGELOG, ROADMAP e documentação UI V3.1.
6. Criar candidata exclusiva de consolidação, validar CI sobre SHA exato, realizar QA Windows e desktop/mobile, obter aceite, publicar `3.0.0` e snapshot imutável **apenas se os gates realmente passarem**.
7. Após a consolidação homologada, continuar a evolução usando o Patch A já presente, sem duplicar suas regras e sem chamá-lo de aprovado retroativamente.

## Proteções e não escopo

- NÃO eliminar código do Patch A, nem aplicar `reset --hard` ou rollback sobre `main`.
- NÃO alterar o schema 9, migrar silenciosamente saves, inventar vendas ou crédito, nem misturar fatos simulados com regras fiscais reais.
- NÃO implementar interface SimCity agora (V3.1), nem iniciar o aprofundamento fiscal posterior.
- NÃO marcar QA humano como realizado sem execução observável.
- Não publicar este registro como release homologada, não criar `releases/v3.0.0-homologada` e não alterar o executável até completar o gate.

**Decisão de 07/11/2026:** escopo de consolidação V3.0 reestabelecido; auditoria documental aberta; homologação técnica **ainda não concedida**.


## Etapa 2 — Auditoria cruzada executada na candidata (07/11/2026)

**Branch:** `audit/v3.0-consolidacao-integral-v2-20261107`.  
**Arquivo de teste novo:** [`tests/integration_v300_consolidation.test.mjs`](../tests/integration_v300_consolidation.test.mjs).  
**Commit de teste:** `f5c3497bf1c68dd291046d5959a211d72199b49a`.  
**CI de validação:** [GitHub Actions #42416696608](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42416696608), `SUCCESS`.  
**Resultado:** **335/335 testes PASS, 0 FAIL** — quatro casos novos mais 331 testes preexistentes; `npm run check`, build HTML único e benchmark de estabilidade **PASS**.

### Novos testes observados como PASS

1. **Integração V2 dentro de uma só carreira:** estoque e venda efetiva, financiamento, contratos de fornecedor, abertura de filial, concorrência, RH/DP, Fiscal Operacional, Paralegal e transferência entre filiais; balanço, razão e compensação interfilial conciliados após 33 dias acumulados.
2. **Patch A com módulos V2:** proposta de capital de giro, compra estratégica com confirmação e ID idempotente, folha e fechamento de mês; consultas de qualidade/progressão/finanças/logística não alteraram estado ou RNG.
3. **Migração histórica:** arquivo V1.7 homologado representado pelo fixture original da versão V1.7 migrou a schema 9 sem reescrever registros anteriores, alterar caixa nem ativar crédito, concorrência, RH ou logística retroativamente.
4. **Proteção de persistência:** backup tradicional V1 e compacto V2 preservaram estado serializado integral e conciliação; adulteração de checksum foi rejeitada; comando repetido não duplicou consequência e reutilização conflitante do ID foi rejeitada.

**Benchmarks observados na mesma CI:** estabilidade 30/365/1.825 dias, 1 e 5 estabelecimentos, integridade `PASS`. O pior caso registrado (1.825 dias e 5 unidades) gerou save de aproximadamente **21.321.320 bytes**, com média computacional de **4,95 ms/dia no executor da CI**. Isso **não** demonstra desempenho em computador de usuário nem persistência via `file://`.

### Conclusão e limites

- **PASS técnico observado nesta etapa:** regressões cruzadas acrescentadas, build/testes e benchmark sob as condições da CI.
- **PARCIAL — gate `3.0.0-03`:** integração entre domínios testada; resta auditoria arquitetural completa de propriedades do motor, ausência de cálculo duplicado e invariante de todos os fluxos combinados.
- **PARCIAL — gate `3.0.0-04`:** formatos V1/V2 e um legado V1.7 validados em laboratório; faltam arquivos reais de jogador, teste manual de corrupção/rollback e cobertura documental do inventário de todas as carreiras V2.
- **PARCIAL — gate `3.0.0-05`:** desempenho da CI comprovado; falta validação de interface/navegador, mobile e Windows.
- **CONCLUÍDOS TECNICAMENTE:** documentação unificada (`3.0.0-06`) e contrato UI V3.1 somente leitura (`3.0.0-07`); **PENDENTES:** QA humano, correções de risco, demais lacunas dos gates 01–05 e gate final (`3.0.0-08`).

**Sem promoção a versão final, sem mudança de gameplay, sem homologação de QA humano, sem merge desta PR.** A `main` permanece com o Patch A candidato preservado. A próxima etapa lógica é fechar a matriz de contratos/propriedade única (`3.0.0-01/02/03`) e documentar as lacunas de compatibilidade antes do gate final.


## Etapa 3 — Inventário e propriedade única concluídos como entregável de auditoria (07/11/2026)

**Documentação nova:** [`docs/V300_MATRIZ_CONTRATOS_E_PROPRIEDADE.md`](V300_MATRIZ_CONTRATOS_E_PROPRIEDADE.md).  
**Teste novo:** [`tests/ownership_v300_contracts.test.mjs`](../tests/ownership_v300_contracts.test.mjs).  
**SHA do commit de teste:** `5e11d90166d77e719183a97c108a3e930ba42b7d`.  
**CI comprovada:** [GitHub Actions #42417243617](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42417243617), `SUCCESS`, **343 testes PASS / 0 FAIL** (331 herdados, 4 de integração, 8 de propriedade). Build e benchmarks 30/365/1.825 dias, 1 e 5 unidades, passaram.

### Evidência de unicidade

- `dispatch()` = ponto de validação/commit; `src/ui/app.js::commit()` é o único ponto `Core.dispatch` no conjunto `src/ui/*.js` examinado.
- `journal()` = único escritor físico no `economy.ledger.push`; `event()` = único escritor em `audit.events.push`.
- `registerPurchase()` = único processamento de compra para formulário individual, multi-item, reposição logística, contrato e Patch A; **um** journal `PURCHASE` e uma encomenda por operação confirmada nos quatro caminhos de teste.
- `registerSale()` = venda gerada em `day()`; `VENDA.REGISTRAR` manual é bloqueado; compras não geram receita.
- `day()` = único avanço de calendário; repetição de comando é `DUPLICATE`, sem nova despesa ou evento.
- Reconhecimento de folha separado da quitação; estimativa proporcional e valor apurado coincidiram no cenário testado; fechamento `FISCAL_OP` é evento sem débito fiscal adicional; relatórios e importações não geram transações.
- Os **oito testes novos** de propriedade passaram na CI sobre o commit exato, sem alterações no motor.

### Dívidas técnicas explicitadas (não são bugs de dupla contabilização comprovados)

- **PR-01:** `estimatedPayrollMonth` e `accruePayrollMonth` replicam lógica de pró-rata; risco de divergência em manutenção futura. Um teste de paridade foi incluído.
- **PR-02:** planejamento manual de reposição na UI e cotação gerencial do Patch A têm cálculos paralelos, porém ambos confirmam por `registerPurchase`; risco de divergência de proposta/interface, não prova de dupla compra.
- **PR-03:** `localStorage` e exportação manual precisam de validação `file://`, Windows e recuperação de saves de jogador.
- **PR-04/05:** relatórios projetivos vs lançamentos realizados, e cobertura não exaustiva de todos os ramos.

**Decisão de gate:** entregas de inventário/matriz e testes de unicidade **CONCLUÍDAS**; os checkpoints gerais `3.0.0-01`, `3.0.0-02` e `3.0.0-03` **continuam PARCIAIS** até suas evidências restantes. Sem alteração de gameplay/versão/schema, sem merge, sem homologação final. **Próxima etapa:** migração de saves e rollback compatível (V2→V3), com matriz de evidências e restrições de testes manuais.


## Etapa 4 — Migração, corrupção e rollback (07/11/2026)

**Protocolo e matriz:** [`docs/V300_MIGRACAO_ROLLBACK_SAVES.md`](V300_MIGRACAO_ROLLBACK_SAVES.md).  
**Regressões:** [`tests/migration_rollback_v300.test.mjs`](../tests/migration_rollback_v300.test.mjs).  
**Baseline V2.9 imutável:** [`tests/fixtures/core_v2_9_0_homologada.js`](../tests/fixtures/core_v2_9_0_homologada.js), copiada do commit homologado `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`, blob Git `048d174cd2e952d61a255c84c97dbb40dceaf50a` validado em teste.

**CI aprovada:** [run #42418650812](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42418650812) sobre o commit `4d4c1fb495fd8d1121e44140b5280e438cbf40af`: **361/361 testes PASS, 0 FAIL**, build HTML, diff reprodutível e benchmark 30/365/1.825 dias PASS.

### Evidência testada

- **11 origens históricas**, cobrindo schemas 2, 3, 4, 5, 6, 7, 8 e 9, migradas sem modificar os registros anteriores do journal, eventos, comandos, estoque, caixa, receitas, IDs, RNG e calendário.
- **V2.9 homologada original** executada dentro da CI; arquivos V1 tradicional e V2 compacto preservados byte a byte no estado; cenário integrado com empréstimo, CD, RH e filiais.
- **Rollback V3.0 alpha/Patch A → V2.9:** a versão estável lê os dois envelopes e consegue continuar a carreira após a compra estratégica, sem diferença de lançamentos/eventos no dia comparado.
- **Corruptelas:** checksum adulterado, schema futuro, estoque inconsistente com checksum recalculado, IDs de eventos duplicados, codec/envelope inválido, dicionário rompido e JSON malformado são rejeitados antes de devolver estado válido; CP-000 com histórico não é convertido artificialmente.
- **Formulário de QA manual criado:** exige ensaio Windows `file://`, armazenamento local, recuperação após erro e saves reais em separado.

### Limites e gate

**`3.0.0-04` permanece PARCIAL**: a automação com fixtures cobriu muitos schemas, mas não substitui testes com arquivos autênticos do jogador, navegador/Windows, falha de quota, retenção do backup anterior e procedimento operacional de rollback. O formato compacto V2 requer leitor V2.9+; versões anteriores não recebem garantia de reversibilidade universal. **Não homologar nem ativar V3.0 final** por este resultado isolado.

**Próxima etapa:** `3.0.0-05` performance, tamanho/limites de saves, responsividade de painéis e estabilidade de uso; distinguir benchmarks CI de QA real.


## Etapa 5 — Performance e estabilidade prolongada (07/11/2026)

**Relatório técnico:** [`docs/V300_PERFORMANCE_ESTABILIDADE.md`](V300_PERFORMANCE_ESTABILIDADE.md).  
**Benchmark novo:** [`tools/benchmark-v300-consolidation.mjs`](../tools/benchmark-v300-consolidation.mjs), também executado no CI como `npm run bench:consolidation`.  
**Travas novas:** [`tests/performance_v300_stage5.test.mjs`](../tests/performance_v300_stage5.test.mjs) — três testes de checksum sob demanda, comando de diagnóstico e integração contínua.  
**CI confirmada:** [#42425249268](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42425249268), **364/364 testes PASS, 0 FAIL**, build reproduzível e benchmarks antigos/novos PASS.  
**HTML único regenerado:** `index.html` com **1.478.540 bytes**, SHA-256 `e72193601ca3d2282bc8be5211f45ad4b7976d269f62a16d6dd48ac38ec06b64` no commit de CI acima.

### Descobertas verificadas

1. Carreira 1.825 dias/5 unidades: motor levou ~**9.974 ms** no executor Node/Linux; save tradicional **21.312.692 bytes** (85% do teto de 25 milhões de caracteres), compacto **6.966.345 bytes** (redução 67,5%). Integridade contábil mantida.
2. Na aba **Sistema**, o checksum de todo o JSON era calculado por `Core.diagnostics(state)` em cada render. A correção moveu o checksum para o **botão já existente** de diagnóstico. Média sob DOM simulado passou de **2.109,96 ms** para **101,84 ms** no cenário de cinco anos, melhoria aproximada de **95,2%**. Ambos os runs foram aprovados.
3. Sob o mesmo DOM simulado, outros painéis do cenário de cinco anos levaram aproximadamente **76–113 ms** por atualização. A maior string HTML de painel mediu **365.065 caracteres**. Estes números não incluem layout, desenho da cidade real, FPS ou armazenamento.
4. **Risco crítico de persistência:** `saveLocal()` tenta gravar sempre o envelope tradicional V1 em `localStorage`; se a quota falhar, `commit()` pode manter o progresso em memória, sem garantia de recuperação após fechar o navegador. O jogo avisa falha, mas não garante continuidade automática. Precisa de QA de falha de quota e estratégia de proteção do usuário antes de homologar.
5. Não foram alterados motor econômico, schema 9, saldos, balanço, saves ou comandos; apenas calculado diagnóstico sob demanda na UI e regenerado HTML no branch de auditoria.

**Gate `3.0.0-05` continua PARCIAL:** benchmarks automatizados concluídos, mas **QA Windows/desktop/mobile, armazenamento local e arquivos reais** não executados; nenhuma homologação inferida. **Próxima etapa:** `3.0.0-06` alinhar README, CHANGELOG, ROADMAP e tutorial, preservando histórico de V2 e avisos de simulação.


## Etapa 7 — Contrato puro de leitura para a V3.1 futura (07/11/2026)

**Contrato técnico:** [`docs/V300_CONTRATO_UI_V31.md`](V300_CONTRATO_UI_V31.md).  
**Adaptador experimental:** [`src/contracts/v31-read-model.mjs`](../src/contracts/v31-read-model.mjs), `CIDADE_V31_READ_V1` e versão contratual **1**. **Não incorporado** em `src/ui/app.js`, `tools/build.mjs` ou `index.html`.  
**Testes específicos:** [`tests/v31_read_model_contract.test.mjs`](../tests/v31_read_model_contract.test.mjs), **11 testes novos**.  
**CI:** [run #42428343258](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42428343258) — **381/381 PASS, 0 FAIL**, benchmark 30/365/1825 dias, modelo de oito painéis e build HTML reproduzível. 

A leitura de **30 cidades e 18 lotes** usa `Core.CITIES` e `Core.businesses` sem inventar unidades, posse de rivais ou propriedades. Ações oferecidas são apenas dicas `ADVISORY_ONLY`, e a mutação continua exclusivamente em `CidadeCore.dispatch`. O adaptador pagina eventos confirmados, separa dados por cidade, omite payload interno, congela projeções e valida `worldId`/`revision` para evitar overlay obsoleto. **Cento e vinte leituras repetidas** provaram não modificar estado, ledger, eventos, RNG, calendário ou chamar `dispatch` no cenário testado. A modelagem ainda não avalia animações, FPS, toque ou acessibilidade real da futura V3.1.

**Checkpoint `3.0.0-07`: PASS TÉCNICO DE CONTRATO, NÃO HOMOLOGAÇÃO DA INTERFACE V3.1.** O checkpoint 08 continua **BLOQUEADO** porque 01–05 ainda possuem evidências não executadas (saves reais, Windows/mobile, quotas, QA do jogador). O próximo passo é fazer **auditoria de prontidão GO/NO-GO e registrar pendências**, não criar release automática.


## Etapa 8 — Auditoria de prontidão formal: NO-GO (07/11/2026)

**Parecer vinculante de auditoria:** [`docs/V300_GATE08_GO_NO_GO.md`](V300_GATE08_GO_NO_GO.md).  
**Manifesto auditável:** [`docs/V300_READINESS_EVIDENCE.json`](V300_READINESS_EVIDENCE.json), 18 requisitos `RG-01`–`RG-18`: **4 verificados documentalmente, 14 não concluídos**.  
**Verificador:** [`tools/v300-release-gate.mjs`](../tools/v300-release-gate.mjs); `npm run audit:release` retorna `NO_GO` sem falsear CI, e `npm run audit:release:require-go` **bloqueia** com exit code 2.  
**Regressões novas:** [`tests/release_readiness_v300.test.mjs`](../tests/release_readiness_v300.test.mjs), **8 cenários de contrato e proteção**.  
**CI do gate:** [#42429308063](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42429308063) — **389/389 testes PASS, 0 FAIL**, benchmarks de estabilidade e painéis, audit:release e build SHA-256 PASS.

**Bloqueios materiais:** checkpoint 01–05 parcialmente cobertos; `src/ui/app.js::commit` prossegue com progresso na memória se `saveLocal()` falha em quota; Windows/file:// e `ATUALIZAR_E_JOGAR.bat` sem testes práticos; importação/rollback de saves reais do jogador sem comprovação; browser mobile/desktop e desempenho de longo prazo sem QA real; candidata `3.0.0` não criada e aceite final ainda não solicitado/concedido. Riscos PR-01 e PR-02 requerem tratamento técnico ou aceite fundamentado com regressão.

**Resultado separado por natureza:** execução **da auditoria** concluída; **promoção/homologação** expressamente **NO-GO/BLOQUEADA**. QA humano não foi simulado nem inventado. As versões `main 3.0.0-alpha.1` e `releases/v2.9.0-homologada` continuam intactas, PR #39 permanece DRAFT e não mesclada.

**Próxima ação real:** ciclo de saneamento de bloqueadores, começando pela persistência e pelo ensaio de saves em Windows. Depois repetir checklist, criar CI de candidata no SHA exato e somente então obter decisão do titular. Esta etapa não autoriza merge nem criação de release.


## Saneamento pós-NO-GO — P0-01: comandos somente após persistência confirmada (07/11/2026)

**Relatório:** [`docs/V300_P0_PERSISTENCIA_TRANSACIONAL.md`](V300_P0_PERSISTENCIA_TRANSACIONAL.md).  
**Origem:** bloqueio `RG-06` identificado na Etapa 8; gravação de `localStorage` podia falhar **após** alteração da carreira ativa.  
**Correção na PR #39:** `src/ui/app.js::persistLocal(candidate)` grava e verifica o save **antes** de fazer `state=result.state`; erros de quota, serialização e leitura retornam falso e impedem a confirmação. Importação e restauração também persistem antes de substituir. Escrita interrompida tenta restaurar valor anterior. **Motor econômico, schema e save V1/V2 não alterados.**

**Regressões:** [`tests/persistence_p0_v300.test.mjs`](../tests/persistence_p0_v300.test.mjs) — **11 testes de funções reais da UI** em VM Node com motor verdadeiro e armazenamento simulado, além de atualizar os testes legados de estabilização e do gate 08.  
**Evidência CI inicial após regeneração:** [GitHub Actions #42431354313](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42431354313), commit `d42df11e4a807a67b70336b2a8ac6cb25dc9e442`, **400/400 testes PASS, 0 FAIL**, benchmark 30/365/1.825 dias e teste de render, build HTML único reproduzível.  
**HTML gerado:** `index.html` com **1.479.945 bytes**, SHA-256 `3dea7a0560ae97ec6b994a470068ce7d72fd9eff18f07779584ef9095cb8e398`. Workflow temporário de compilação **removido** após sincronização; não entrou na `main`.

**Estado do risco:** mitigação de **comando em memória sem save** aprovada em testes de ambiente simulado; **`RG-06` mantém NOT_VERIFIED**, `RG-12` mantém NOT_EXECUTED porque falta reproduzir quota/permissão real no Windows Chrome/Edge, fechar/reabrir o navegador, importar save real do jogador e avaliar retenção. **Gate 08 permanece NO-GO e PR #39 DRAFT.**

**Próxima ação do ciclo de saneamento:** ensaio seguro e documentado de `file://` com backups externos, armazenamento cheio e rollback de uma **cópia** do save V2.9 em dois navegadores, além de mobile/longa duração. Não declarar liberação ou homologação por aprovação do CI.


## Saneamento pós-NO-GO — QA Windows hospedado e HTML byte-idêntico (07/11/2026)

**Ensaio funcional:** [`docs/V300_QA_WINDOWS_HOSTED.md`](V300_QA_WINDOWS_HOSTED.md) e [CI Windows #42432588846](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42432588846), **SUCCESS, 33/33 checagens PASS**, Chrome 156 e Edge 156 reais em Windows NT 10.0.26100.0, execução headless e `file://` sem servidor. Quota REAL de `localStorage` provocada com dados exclusivamente sintéticos; comando bloqueado e save anterior preservado, seguido de recuperação e reinício do navegador. Exportação e importação de JSON em perfis distintos, e compatibilidade de save **sintético** V2.9→V3→V2.9 verificadas.

**Conformidade de artefato Windows/Linux:** diferença inicial CRLF/LF detectada e corrigida em `tools/build.mjs` (serialização LF); [`tools/verify-html-byte-identical-v300.mjs`](../tools/verify-html-byte-identical-v300.mjs) compara bytes reais contra o blob Git. Na CI Windows #42432588846, **PASS**: SHA-256 `3dea7a0560ae97ec6b994a470068ce7d72fd9eff18f07779584ef9095cb8e398`, **1.479.945 bytes**, idênticos ao HTML canônico Linux.

**Matriz de aceitação reclassificada sem inflar o GO:** `RG-06`, `RG-08`, `RG-10` e `RG-12` **PARTIAL** (evidência Windows hospedado, não computador do jogador); demais requisitos de QA manual/saves pessoais/instaladores/mobile continuam sem conclusão. Há **4/18 requisitos VERIFICADOS** e **14/18 ainda NÃO QUITADOS** no gate final. V3.0 permanece **NO-GO**; `main`, `schemaVersion=9`, baseline homologada V2.9 e PR #39 DRAFT protegidos.

**Próxima ação:** QA físico no Windows do jogador usando cópias externas de save autêntico, `JOGAR_OFFLINE.bat` e `ATUALIZAR_E_JOGAR.bat` em instalação isolada; observar tela, operações, backup após reiniciar, quota real e rollback. Não declarar validação pessoal a partir de execução no runner.


## Saneamento pós-NO-GO — QA dos instaladores e validador privado (07/11/2026)

**Relatório:** [`docs/V300_QA_BAT_SAVE_LOCAL.md`](V300_QA_BAT_SAVE_LOCAL.md). **Windows hospedado:** [CI #42434425027](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42434425027), **19/19 QA BAT/PowerShell PASS**, com ZIP/commit remoto e lançamento de navegador **interceptados** e dados sintéticos, em conjunto com **33/33 Chrome/Edge PASS**. Demonstrados backup antigo, SHA gravado após cópia, saves fictícios inalterados, recusa de downgrade, falha de API e rollback do HTML numa falha de escrita. O BAT foi aberto em caminhos temporários com espaços; não houve atualização real online nem acesso ao Windows pessoal do jogador.

**Validação privada pronta, não executada em arquivo pessoal:** [`tools/validar-save-pessoal-local-v300.mjs`](../tools/validar-save-pessoal-local-v300.mjs), testado com save sintético/corrompido em [`tests/personal_save_private_v300.test.mjs`](../tests/personal_save_private_v300.test.mjs). **Somente leitura**, não imprime nomes, empresas ou valores e não envia dados. O usuário poderá executar localmente em cópia independente, sem expor o original ao GitHub.

**`RG-09` passou a PARTIAL**, refletindo o ensaio de updater em ambiente controlado; **`RG-11` continua NOT_EXECUTED**, sem save pessoal. `RG-06/08/10/12` também parciais, demais provas de GUI/mobile/carreira longa continuam abertas. O atualizador segue `main` (V3 alpha não homologada), portanto não executar o BAT de atualização na instalação pessoal antes de homologar a release apropriada. **Gate 08 permanece NO-GO** e PR #39 DRAFT.


## Saneamento pós-NO-GO — P1 PR-01/PR-02: folha e capacidade (07/11/2026)

**Dossiê:** [`docs/V300_PR01_PR02_SANEAMENTO.md`](V300_PR01_PR02_SANEAMENTO.md). A duplicação da fórmula de pró-rata foi eliminada: previsão e competência RH agora usam `payrollPeriodQuote`, sem mudar valor dos cargos, competência, despesa ou quitação. A cotação manual de compras passou a descontar transferências internas PENDING ao verificar a capacidade da unidade, usando o estado do grupo; esse critério já existia no motor `registerPurchase` e na cotação Patch A. **Compras manuais e estratégicas conservam políticas distintas**, mas convergem no lançamento único do pedido.

**Automação:** [sete regressões novas](../tests/v300_pr01_pr02_consistency.test.mjs), [CI Linux #42435702398 — 418/418 PASS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42435702398), [CI Windows #42435702391 — 19/19 BAT e 33/33 Chrome/Edge PASS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42435702391). O `index.html` foi regenerado com **1.480.192 bytes**, SHA-256 `0ac63b72913247249e2559f19009b9941f1d6b794a9f0f17c85904e9eca191c3` reproduzido no Windows/Linux.

**Classificação:** PR-01 **MITIGATED**, PR-02 **FIXED_UI_CAPACITY**, **RG-07 VERIFIED** por decisão técnica/regressão ([CI #42435965283](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42435965283)), agora **5/18 verificados e 13/18 pendentes**, porém gates 02 e 03 **PARCIAIS** até QA humano; gate 08 **NO-GO** até saves pessoais, mobile real, instalação Windows pessoal, carreira longa no browser e aceite. `main` e V2.9 homologada intocadas, PR #39 permanece rascunho.


## Saneamento pós-NO-GO — QA integrado de interface no Windows (07/11/2026)

**Dossiê:** [`docs/V300_QA_INTEGRADO_WINDOWS_HOSTED.md`](V300_QA_INTEGRADO_WINDOWS_HOSTED.md); [CI Windows #42437328042](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42437328042). **66/66 verificações PASS** em duas execuções independentes, Chrome e Edge reais no Windows hosted/headless, `file://`. Foram usadas **13 etapas por navegador**, abrindo uma mesma carreira fictícia com duas empresas e simulando 38 dias por botões/formulários visíveis (sem `Core.dispatch` injetado pelo teste): pedido manual e recebimento, RH, transferência, contabilidade, cancelamento de reposição, Patch A, crédito, competência e quitação de folha e reabertura do save. Nenhuma duplicação de receita, despesa da folha ou compra foi observada nos invariantes auditados.

**Evolução dos riscos:** `RG-13 = PARTIAL` e `RG-16 = PARTIAL`, além dos controles parciais de Windows já registrados. `3.0.0-03 = PARTIAL` (cobertura integrada adicional), sem alterar o fechamento técnico de RG-07, mas ainda com QA visual, hardware do jogador, save pessoal, mobile físico e testes de carreira longa pendentes. **Prontidão permanece 5/18 verificados, 13/18 não quitados, etapa 08 bloqueada (NO-GO)**.

**Próximo passo técnico:** ampliar avaliação gráfica/acessibilidade e stress de longa duração de browser, sem misturar com aprovação formal ou com implementação V3.1. Preservar PR #39 DRAFT, `main` e V2.9 homologada.


## P1-03 — estresse de 365/1.825 dias no navegador e limitação P0-04 (08/11/2026)

**Dossiê:** [`docs/V300_QA_CARREIRA_LONGA_BROWSER.md`](V300_QA_CARREIRA_LONGA_BROWSER.md) | [CI Windows #42485124066](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42485124066) | [issue #40, P0-04](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/issues/40). Testados Chrome e Edge reais, Windows hosted/headless, HTML `file://`, calendários de 365/1.825 dias, uma e cinco empresas, por botões da UI. A fixture de cinco empresas utiliza capital adicional fictício **apenas para a prova**, não comprova viabilidade financeira da expansão no jogo.

**Diagnóstico:** **4/4 cenários de 365 dias PASS** com JSON/compacto íntegros, ledger conciliado, tempo de UI, heap CDP pontual, download e reload. **0/4 de 1.825 dias alcançados** por quota em `localStorage` por volta de 5 MB. Bloqueios em dia **1.625 (Chrome 1 un.)**, **1.655 (Edge 1 un.)**, **425 (ambos 5 un.)**. `persistLocal` foi **fail-closed** sem avanço indevido nem corrupção do snapshot anterior; exportação seguiu funcionando. O limite do JSON de exportação externa (25 MB) não garante capacidade equivalente no navegador.

**Status:** `RG-15 = PARTIAL` (antes `NOT_EXECUTED`), `3.0.0-05 = PARTIAL`, **P0-04 OPEN/BLOCKING**. Não afirmar que regressão foi resolvida nem confundir sucesso de execução do QA com cumprimento dos requisitos. `3.0.0-08` continua **BLOCKED / NO-GO**, **5/18 verificados, 13/18 pendentes**. Nenhum merge, release, mobile pessoal, save pessoal ou homologação. Próxima análise deve tratar de armazenamento robusto com migração e rollback antes da repetição integral dos testes.
