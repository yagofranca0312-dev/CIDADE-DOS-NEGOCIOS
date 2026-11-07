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
| `3.0.0-07` | Preparar contrato UI V3.1 | **PENDENTE** | Definir API somente-leitura de cidade, eventos e comandos para overlays; renderização não pode mutar estado ou executar ticks |
| `3.0.0-08` | Gate de homologação completa | **BLOQUEADO** | Falta concluir 01–07, CI da release candidata, QA Windows/desktop/mobile, saves reais, aceite e snapshot imutável |

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
- **PENDENTES:** documentação unificada (`3.0.0-06`), contrato UI V3.1 (`3.0.0-07`), QA humano e gate final (`3.0.0-08`).

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
