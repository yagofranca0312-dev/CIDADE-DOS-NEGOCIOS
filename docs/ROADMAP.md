# Roadmap — Cidade dos Negócios

## Estado vigente — 07/11/2026: consolidar a V2 na V3.0 ANTES da V3.1

**Fonte de decisão mais recente:** roadmap interativo `roadmap_cidade_dos_negocios_v2_v3_interativo.html` (04/11/2026) — bloco `3.0.0 — Consolidação INTEGRAL da linha V2`. **Este bloco prevalece na priorização sobre decisões históricas registradas abaixo**. As datas e propostas antigas são preservadas por rastreabilidade e não significam que continuem em execução.

- **Última versão homologada:** V2.9.0, `releases/v2.9.0-homologada`, commit `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`.
- **Código na `main`:** V3.0.0-alpha.1, Patch A de Economia já integrado no commit `871df2b1cd133bcad717c0194a474a35fbabcd3c`. **Não homologado**, sem versão V3.0 final.
- **Trabalho atual:** PR [#39 — auditoria de consolidação](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/pull/39), **DRAFT**, sem merge. Preservar Patch A, schema 9 e a V2.9 estável.
- **Missão:** consolidar mercado/economia, IA/rivais, RH/DP, Paralegal, fiscais didáticos, contabilidade, contratos/crédito, logística/produção, jornada/progressão, interface V2 e saves. A V3.1 imersiva, reconstrução estilo SimCity e novo regime tributário 2027+ **não estão autorizados como implementação dentro deste gate**.

| Checkpoint | Objetivo de saída | Situação em 07/11/2026 |
|---|---|---|
| `3.0.0-01` | Inventário total V2, comandos e evidências | **PARCIAL:** matriz + testes; QA manual e cenários remanescentes |
| `3.0.0-02` | Responsável único por eventos, escrita, persistência, módulos | **PARCIAL:** 8 testes, riscos de fórmulas paralelas não encerrados |
| `3.0.0-03` | Auditoria cruzada de economia, RH, fiscais, IA, contratos, logística | **PARCIAL:** 4 testes de integração e regressões, cobertura manual pendente |
| `3.0.0-04` | Migrar saves e proteger rollback V2→V3 | **PARCIAL:** 18 testes e V2.9 original, pendem saves reais/Windows |
| `3.0.0-05` | Performance e estabilidade, tamanho de saves e UI | **PARCIAL:** 3 testes, 8 painéis e 5 anos em CI; pendem Windows/mobile/quota |
| `3.0.0-06` | README, CHANGELOG, ROADMAP e tutorial únicos | **EM EXECUÇÃO:** material unificado nesta PR, CI/aceite documental pendentes |
| `3.0.0-07` | Contrato de API só leitura para apresentação V3.1 | **PENDENTE** |
| `3.0.0-08` | CI final, QA Windows/desktop/mobile, saves, aceite, snapshot de release | **BLOQUEADO**, não homologar |

**Evidências:** [dossiê dos oito gates](V300_CONSOLIDACAO_INTEGRAL_GATES.md) · [matriz de propriedade](V300_MATRIZ_CONTRATOS_E_PROPRIEDADE.md) · [migração/rollback](V300_MIGRACAO_ROLLBACK_SAVES.md) · [desempenho](V300_PERFORMANCE_ESTABILIDADE.md) · [guia operacional](JOGAR_GUIA_V300.md).

**Sequência:** fechar a documentação `06` → preparar contrato UI V3.1 `07` → retornar às lacunas manuais dos checkpoints `01–05` → release gate `08`. Não confundir `PASS` no CI com homologação humana. Versão homologada só muda com autorização explícita após as provas obrigatórias.

---

## Histórico de planejamento (registros por data; não substituir o plano vigente)


## P0 — Fundação (checkpoint CP-000)

**Objetivo:** preparar repositório, núcleo sem gameplay, contratos, testes estruturais, fluxo de contribuição, CI e checkpoint.

**Gate de saída:** repo criado e privado, commit verificável, `npm test` local e CI remota aprovados, HTML aberto em navegador real, backup JSON exportado/importado. **Não marcar gate sem executar.**

## P1 — Definição de jogo (não iniciada)

Definir antes de programar: o papel do jogador, objetivo, loop de jogo, horizonte temporal, setores econômicos, mapa ou ausência de mapa, adversários, vitória/derrota e escopo inicial. Registrar 1 página de GDD (Game Design Document) e critérios de aceitação.

## P2 — Vertical slice jogável (não iniciada)

Uma única atividade econômica completa: investir → produzir/operar → vender → registrar caixa/custos → avançar tempo → reagir à consequência → salvar/reabrir. Evitar múltiplos setores até esse ciclo passar.

## P3 — Sistemas interdependentes (não iniciada)

Mercado, fornecedores, concorrentes, demanda, custos, eventos e IA. Implementar por contratos; regressão em cada incremento.

## P4 — Mundo persistente e escalável (não iniciada)

Crescimento do mundo, simulação de longo prazo, histórico auditável, estabilidade, economia balanceada, recuperação de backups, usabilidade desktop/mobile.

## Release gates

`PLANEJADO → IMPLEMENTADO → TESTADO_LOCALMENTE → TESTADO_CI → VALIDADO_NO_NAVEGADOR → HOMOLOGADO_PELO_USUÁRIO`.

Um estado posterior não pode ser inferido do anterior; registrar evidência para cada transição.

## Estado atualizado — 01/11/2026

- V1.2.1: hotfix de demanda e vendas automáticas, **validado pelo jogador** e preservado em branch `releases/v1.2.1-homologada`.
- V1.3.0-rc.1: demanda inclusive sem estoque, fornecedores com prazo/preço/capacidade, pedidos em trânsito, custo médio, planejamento de reposição, testes locais e CI; **homologação Windows pendente**.
- Próximas decisões: testar equilíbrio econômico de 90/180 dias, qualidade da previsão, precificação e ruptura; planejar aprofundamento do mercado e expansão do mundo com fontes econômicas verificadas.
- Regra de publicação: preservar saves prévios, manter ledger conciliado, exigir CI PASS, depois homologação do jogador.

## Estado atualizado — 02/11/2026

- **V1.3**: homologada pelo jogador; snapshot em `releases/v1.3.0-homologada`.
- **V1.4**: estratégias temporárias de preços e cenários financeiros; implementação e regressões em avaliação antes da homologação Windows.
- **Próxima V1.5 proposta, não aprovada:** expansão para múltiplos estabelecimentos, depois de observar equilíbrio na V1.4 e validar integridade do save.
- A projeção econômica em V1.4 usa dados **fictícios** e não consulta dados públicos atualizados. Nenhum tributo brasileiro é calculado.

## Estado atualizado — 02/11/2026: V1.5

- V1.4.0 homologada no Windows pelo jogador; snapshot preservado em `releases/v1.4.0-homologada`.
- V1.5.0-rc.1: até cinco unidades, caixa compartilhado, inventário individual, demanda setorial compartilhada por cidade, ledger por unidade e filtros financeiros consolidados.
- Critérios de saída: npm check e CI PASS, simulação multiunidade de 365 dias, importação de saves antigos, navegador testado, homologação Windows do usuário.
- Próximas evoluções: aperfeiçoamento da demanda multiunidade, transferências internas (sem criar receita), sistema de funcionários e expansão macroeconômica, sujeitos a planejamento separado.

## Estado atualizado — 02/11/2026: V1.6

- V1.5 homologada pelo jogador; branch de recuperação `releases/v1.5.0-homologada` preservada.
- V1.6: cobertura oficial IBGE 2026 de 30 municípios, motor regional simulado, competição local com coeficiente, observatório e mapa escalonado.
- PIB municipal 2023, REGIC 2018 e CAGED **ainda não integrados**; não apresentar valores por município nem alegar classificação oficial para o modelo.
- Critério de saída: CI PASS, testes multiunidade de 365 dias, saves 2–6 migráveis, testes de navegador, homologação de uso no Windows.
- Futuro backlog: integrar PIB/REGIC com pacote verificável, preços e concorrentes verdadeiramente locais, acompanhar série histórica e efeitos da renda/comércio.

## Estado 02/11/2026 — V1.7 regional

- PIB total oficial de 2023 para todas as 30 cidades (R$ mil) com calibração simulada restrita.
- REGIC 2018 (hierarquia e ligações) e PIB per capita continuam **não integrados** até auditoria do arquivo tabular oficial.
- Teste preventivo da versão visual em todas as telas, corrigindo o rodapé herdado da V1.5.
- Diretriz aprovada: **V2.0 exclusiva para consolidação de arquitetura e revisão visual de jogo**; não incluir novos sistemas de gameplay.


## Estado 02/11/2026 — V1.8 candidata

- V1.7 homologada e preservada em `releases/v1.7.0-homologada`; V1.8 adiciona demonstrativos gerenciais de leitura sem novo schema.
- DRE por unidade/consolidada, balanço somente do grupo, fluxo de caixa realizado/contribuição por unidade, reconciliação com estoque atual, fechamento mensal não mutante.
- V1.9 permanece dedicada a tributos brasileiros simulados; V2.0 exclusivamente a consolidação técnica e UX/UI como jogo, sem novos sistemas.
- Gate: regressões locais e CI PASS, testes de navegador e update Windows; usuário homologa após uso real.

## Estado 02/11/2026 — V1.9 candidata

- V1.8 homologada pelo jogador; snapshot protegido em `releases/v1.8.0-homologada`.
- V1.9 em implementação: Simples comercial didático sob hipóteses restritas e somente ano de competência 2026; teste IBS/CBS de 2026 informativo, anos seguintes sem rule pack de imposto exigível.
- DRE/BP/DFC do jogo serão conciliados com lançamentos simulados sem transformar apuração hipotética em imposto real.
- Gate: npm check, CI no PR, navegador e Windows com backup, aceite expresso de Yago. Sem antecipar homologação.
- **V2.0 não criará funcionalidades novas:** auditoria e consolidação de arquitetura, dados, menus, mapas e UX/UI para conferir identidade visual de um jogo de gestão empresarial.


## Estado 02/11/2026 — V2.0.0-rc.1 candidata

- **V1.9 homologada** pelo jogador e preservada na branch `releases/v1.9.0-homologada` (commit `575c54c6`).
- **V2.0 implantada localmente**, com navegação de quatro áreas, distrito visual predominante, inspetor de lote, controles secundários recolhíveis, modularização da apresentação e `schemaVersion: 9` mantido.
- **Sem mudanças nas regras:** motor V1.9 conservado, com alteração apenas de versão exibida; regressão comparativa determinística.
- Gates locais: `npm run check` e navegadores/fluxos de interface. Gates remotos: GitHub PR/CI e validação Windows antes de homologar.
- Direção artística consultada na especificação `INTERFACE.md`: cidade em primeiro plano, informações contextuais, sem apresentar funcionalidades planejadas como existentes.
- Documento técnico: `docs/V20_CONSOLIDACAO.md`.

## Estado 02/11/2026 — V2.0 HOMOLOGADA

- **V2.0.0-rc.1 homologada** pelo jogador, com aprovação expressa da reorganização visual. Snapshot recuperável `releases/v2.0.0-homologada` (commit `ac3e840b71d3551026f62cc6a04c9173f553f9d7`). A confirmação não altera os bytes do executável.
- Diretriz mais recente de Yago: **toda a linha V2.x é exclusivamente visual e de experiência; novas mecânicas e sistemas ficam para V3.x**. A sugestão anterior de V2.1 como expansão de jogabilidade foi superada.

## Estado 02/11/2026 — V2.1 VISUAL PLANEJADA

- **V2.0 homologada** no commit `ac3e840b71d3551026f62cc6a04c9173f553f9d7`, branch `releases/v2.0.0-homologada`.
- **V2.1:** marca/abertura, HUD, painéis contextuais, coesão entre telas, acessibilidade e empacotamento; zero novas mecânicas. Fonte principal `INTERFACE.md` v0.1.0 e quatro imagens REF-01 a REF-04.
- **Documento aprovado para planejamento, não implementação:** [PLANO_V21_VISUAL.md](PLANO_V21_VISUAL.md). A V2.2 poderá aprofundar arte e mapa; V2.3 efeitos visuais; **V3.x** inicia funcionalidades novas.
- Gates: motor V2.0 preservado (schema 9), regressão determinística, build HTML único offline, testes de navegador e homologação explícita do jogador.

## Estado 02/11/2026 — V2.1 CANDIDATA VISUAL

- Linha **2.x exclusivamente visual**; futuras mecânicas somente na linha **3.x**.
- V2.0 homologada e preservada na branch `releases/v2.0.0-homologada`, commit `ac3e840b`.
- V2.1: marca, abertura, HUD, inspetor contextual e coesão entre telas; sem alterar motor V2.0, salvo `VERSION`.
- Schema 9 preservado, 162 testes locais PASS, regressão e QA nas resoluções 320, 360, 390, 768, 1280 e 1920 px.
- Homologação Windows e CI remota exigidas antes de marcar versão homologada. Ver `docs/V21_IMPLANTACAO.md`.

## Estado 02/11/2026 — V2.1 HOMOLOGADA PELO TITULAR / V2.2 EM PLANEJAMENTO

- **V2.1.0-rc.1:** homologada por autorização expressa de Yago em 02/11/2026. O código funcional aprovado corresponde ao merge commit `645467b0a87d037a049976a4d75e09c008894316`, preservado na branch `releases/v2.1.0-homologada`.
- **Evidência disponível:** 162 testes locais PASS; workflow da PR #14 concluído com sucesso; testes de renderização e fluxos no navegador e schema 9 inalterado. **Não afirmar validação `file://` no Windows nem persistência após reinício como executadas**, pois continuam sem evidência nesta sessão.
- **Natureza do aceite:** homologação expressa de produto pelo titular com pendência técnica conhecida; não altera a identificação de versão do executável nem representa testes extras.
- **V2.2.0-rc.1 proposta:** [Mapa, Atlas de Edifícios e Ambientação Urbana](PLANO_V22_MAPA_ATLAS_AMBIENTACAO.md). P01–P06 planejadas, nenhuma implementada. A execução depende de nova ordem expressa do titular.
- **Fronteira permanente:** V2.x só arte/visual/UX; V3.x novas mecânicas. Core econômico-fiscal, 30 cidades, 18 lotes, cinco unidades, saves schema 9, HTML offline e navegação V2.1 preservados.

## Estado 02/11/2026 — V2.2 IMPLANTADA EM BRANCH / CANDIDATA EM VALIDAÇÃO

- **Versão `2.2.0-rc.1`:** código da nova cena isométrica, atlas geométrico neutro, ambientação por `sizeTier`, seleção acessível e integração HTML offline implantados em `feature/v2.2.0-rc.1`.
- **Snapshot base imutável:** `releases/v2.1.0-homologada`, `645467b0`.
- **Motor:** somente `VERSION` alterado; `schemaVersion=9`. Novos sistemas de gameplay continuam proibidos em toda linha V2.x.
- **P01:** inventário técnico executado; capturas e protótipo visual com comparação manual pendentes. **P02–P05:** codificados, QA pendente. **P06:** build versionado e novos testes codificados, execução CI/QA Windows pendente.
- **Critérios futuros:** `npm run check`, CI PASS, hash de build reproduzível, QA desktop/mobile, validação Windows de save/backup e homologação explícita. Não chamar versão de homologada enquanto essas evidências não existirem.
- **Documento de execução:** [V22_IMPLANTACAO.md](V22_IMPLANTACAO.md). O plano continua em [PLANO_V22_MAPA_ATLAS_AMBIENTACAO.md](PLANO_V22_MAPA_ATLAS_AMBIENTACAO.md).

## Estado 02/11/2026 — V2.2 CANDIDATA PUBLICADA NA MAIN (NÃO HOMOLOGADA)

- PR #15 `feature/v2.2.0-rc.1` → `main` **integrada**; commit `1078dbaa9a582962e7de8e7ecbe97bcff5d4a92d`. Código e executável V2.2.0-rc.1 disponíveis para atualização e teste.
- GitHub Actions PR #15 **PASS**, run ID `41489051796`, com `npm run check`: **174/174 testes PASS** e 0 FAIL.
- Job de build do HTML único e `git diff --exit-code -- index.html` concluídos com sucesso; artefato HTML de **394.165 bytes**, SHA-256 `ac741cab5e79d13a7decb02e7331a776fcd816af08dd2ebc0bf9d7db6dc9cd9b`.
- **Não homologada**: QA visual em navegador real, performance em hardware de referência e validação nativa no Windows (`file://`, importação/exportação e persistência após reinício) ainda dependem de evidência observável e aceite expresso do jogador.
- V2.1 HOMOLOGADA permanece preservada na branch `releases/v2.1.0-homologada`, commit `645467b0`. V2.2 preserva schema 9 e motor de regras salvo VERSION.


## Estado 02/11/2026 — V2.3 PATCH A HOMOLOGADO PELO JOGADOR

- V2.3 organizada em quatro patches internos A–D, com versão final `2.3.0` reservada ao ciclo completo.
- Patch A: quatro abas principais (Cidade, Empresas, Mercado, Administrativo); 13 subáreas internas, com atalhos antigos preservados.
- **Aceite funcional expresso no Windows** em 02/11/2026, após instalação isolada e teste do jogador.
- **Versão intermediária:** `2.3.0-alpha.1`. Publicação pela `main` após CI, para permitir `ATUALIZAR_E_JOGAR.bat` normalmente.
- **Motor:** nenhuma mudança de regras econômicas, contábeis ou fiscais; schema 9 preservado. `VERSION` atualizado somente para identificar a entrega.
- Próximo passo: **Patch B — Mercado e Reposição Inteligente**; Patch C — Empresas; Patch D — Administrativo e integração final.
- A homologação do Patch A não é a homologação da V2.3.0 final.


## Estado 03/11/2026 — V2.3 PATCH B VERSIONADO PARA TESTE

- Identificador intermediário 2.3.0-alpha.2, sem alteração no schema 9 nem nas regras econômico-fiscais.
- A PR #20 levou à main a candidata do Patch B; esta etapa apenas sincroniza o versionamento.
- Publicação na main serve à atualização normal no Windows, NÃO equivale à homologação. Aguardar teste prático.
- Patch C: Empresas (Dashboard, Minhas Empresas, Análises, Comparativos) em branch própria sobre versão intermediária.
- Patch D: Administrativo e integração V2.3.0 final, ainda não implementado.


## 03/11/2026 — Patch C homologado e Patch D em preparação

- O jogador solicitou explicitamente homologar o Patch C e avançar ao D.
- Identificador da homologação intermediária do Patch C: **2.3.0-alpha.3**, schema 9 e economia/fiscal preservados.
- Patch B segue com sua condição documental própria; o aceite do Patch C não comprova automaticamente testes manuais específicos do B.
- Patch D: separar Finanças (tesouraria/fluxo), Contabilidade (DRE, balanço, razão, conciliação), Fiscal já existente e RH/DP e Paralegal declarativos (sem mecanismos simulados).
- Concluir validação e homologação final V2.3.0 somente após entrega e teste explícito do Patch D.


## 03/11/2026 — Homologação final V2.3.0 (ciclo A–D)

- A homologação da V2.3.0 foi solicitada expressamente pelo titular após a publicação do Patch D para teste.
- Versão final de release: **2.3.0**, preservando schema 9, motor econômico e Fiscal existente. O aceite desta etapa cobre o conjunto funcional A–D.
- A implementação do Patch D distribui Finanças, Contabilidade, Fiscal, RH/DP e Paralegal sem criar dados econômicos fictícios.
- Publicação depende de CI PASS, index.html reproduzível e registro em docs/HOMOLOGACAO_V230.md. Preservar snapshot releases/v2.3.0-alpha.3-patch-c-homologada.
- **Não afirmar teste manual independente no Windows**, salvo evidência documentada. V3.0 permanece dedicada às regras tributárias ampliadas.

## Estado 04/11/2026 — V2.4 Patch C HOMOLOGADO

- **Patch A · Paralegal:** homologado, checkpoint `releases/v2.4.0-alpha.1-homologada`.
- **Patch B · RH/DP:** homologado, checkpoint `releases/v2.4.0-alpha.2-homologada` (commit `63fd0218f8e18da209b5cd7d4af154d868d1e03f`).
- **Patch C · Fiscal Operacional:** homologado expressamente pelo jogador em 04/11/2026, checkpoint `releases/v2.4.0-alpha.3-homologada` (commit `af3f58c4e611131b72ec5290be4fe32357c06780`).
- **Evidências técnicas:** GitHub Actions run 41919994971, 240 testes PASS / 0 FAIL, HTML único reproduzível, schema 9 preservado.
- **Distinção de evidência:** aceite formal do jogador é registrado; nenhum teste manual Windows não documentado é declarado como executado.
- A versão publicada e homologada permanece `2.4.0-alpha.3`. Os checklists fiscais são fictícios, não criam obrigação legal nem substituem apurações fiscais reais.
- A atualização do registro de homologação é apenas documental; não altera `src/core/game.js`, `src/ui` ou `index.html`.


## 04/11/2026 — Consolidação da V2.4.0 estável

- Pedido expresso do titular: consolidar e homologar integralmente o ciclo V2.4 dos patches A (Paralegal), B (RH/DP) e C (Fiscal Operacional).
- Base de código: `releases/v2.4.0-alpha.3-homologada`, commit `af3f58c4e611131b72ec5290be4fe32357c06780`.
- Promoção de versão: `2.4.0-alpha.3` → `2.4.0` **sem alterações funcionais no motor ou na interface**, com `schemaVersion=9` preservado; testes de regressão e HTML offline revalidados na nova versão.
- Homologação formal do titular autorizada em 04/11/2026. Evidência de QA Windows/browser real não documentada, portanto não presumida.
- O build da versão `2.4.0` passou no GitHub Actions 41928503855 (243 PASS / 0 FAIL), com `index.html` reproduzível e SHA-256 `ac31730a695490166404d0dee13fb466925ddf6c687234079e0ac9cf04c5514f`. Checkpoint de homologação final: `releases/v2.4.0-homologada`. A homologação é formal e automatizada; não alegar testes manuais Windows não documentados. Consulte `docs/HOMOLOGACAO_V240.md`.

## V2.4.1-rc.1 — estabilização financeira e integridade (candidata de 04/11/2026)

- **Contrato:** estabilização cirúrgica, sem novos sistemas de gameplay, regras fiscais ou migração de save. Base recuperável: `releases/v2.4.0-homologada`.
- [x] **01** Inventário das origens de `PAYABLE`, com segregação entre despesa diária, folha e históricos não classificáveis.
- [x] **02** Baixa opcional das despesas operacionais antigas, sem duplicar `EXPENSE`, com guarda de saldo, caixa e idempotência.
- [x] **03** Cenário inclui folha estimada da unidade ativa, apresenta compromissos conhecidos e ressalva outras unidades, pagamentos e tributos futuros.
- [x] **04** README, CHANGELOG e documentação específica reestruturados para distinguir versão ativa de histórico.
- [ ] **05** QA manual Windows `file://`, fechamento/reabertura, importação JSON e recuperação: **DEPENDE DE TESTE DO JOGADOR**.
- [x] **06** Benchmark 30/365/1825 com 1/5 unidades: seis cenários PASS, de 76.931 a 21.321.317 bytes de save; 16 a 8.245 ms de simulação no runner (GitHub Actions 41939407785). **Risco pendente:** quota localStorage e limite de 25 MB do arquivo.
- [x] **07** Regressões, CI e checksum do HTML reproduzível: CI PASS (250/250), HTML reproduzível, SHA-256 `d233d55932f3ca20e81db2fb5f2659946adb9e1ae97e33f158e3947f1e96ff71`.
- [ ] **08** Gate final de homologação pelo jogador e checkpoint estável V2.4.1: **NÃO CONCEDIDO**.
- **Atalho:** `docs/V241_ESTABILIZACAO.md`.
- **Observação QA:** homologa-se somente após teste manual Windows e aceite; a V2.4.1 RC1 pode ser publicada para avaliação, mas não se presume persistência de saves grandes em `file://`.

## 05/11/2026 — V2.4.1: homologação formal e promoção estável

- O titular pediu expressamente **homologação da V2.4.1** e início do ciclo V2.5.0.
- Candidata `2.4.1-rc.1` (PR #27, CI 42005354318) teve 250 PASS/0 FAIL, seis cenários de performance aprovados e artefato HTML reproduzível. A promoção `2.4.1` muda apenas a identificação de versão.
- Gate de aceite **formal**: aprovado pelo titular. Teste manual Windows/browser não documentado: **não realizado/verificado nesta execução**. Persistência `localStorage` e saves grandes continuam como risco conhecido; não presumir quitação deste risco.
- Checkpoint final planejado: `releases/v2.4.1-homologada`, criado após CI da versão estável. Manter `releases/v2.4.0-homologada` intocada.
- Próximo ciclo: V2.5.0, objetivos e progressão derivados de evidências econômicas e eventos do próprio jogo, sem adulterar ledger ou saves.

## Ciclo V2.5.0 — aberto em 05/11/2026

- Dependência satisfeita: V2.4.1 estável homologada formalmente, branch `releases/v2.4.1-homologada`; CI 42111708574 PASS. Teste manual Windows continua sem evidência documentada.
- Foco: jornada do empreendedor, progressão derivada do ledger/eventos existentes, metas de curto/médio/longo prazo e informações de conquistas.
- **Patch inicial:** `2.5.0-alpha.1` em `feature/v2.5-alpha.1-gdd-progressao`, GDD + níveis + objetivos de leitura; não altera schema 9, economia, saldo, preço, tributos nem RNG.
- Checkpoint 01 GDD concluído; demais checkpoints só após implementação/testes individualizados. Plano detalhado: `docs/V250_GDD_PROGRESSAO.md`.
- Regra: V2.5 não pode ser declarada homologada sem CI, testes de equilíbrio de 30/90 dias, QA no Windows/navegador e aceite formal do titular.

## 05/11/2026 — V2.5.0-alpha.1: implementação inicial validada

- GDD, quatro patamares, 12 objetivos baseados no ledger e três marcos de reconhecimento em **Empresas → Dashboard → Jornada empresarial**.
- Checkpoints técnicos V2.5: **01 GDD, 02 Níveis e 03 Objetivos concluídos (3/8)**. Conquistas complexas, reputação, seis dilemas, tutorial com QA real e gate de diversão **não concluídos**.
- GitHub Actions 42120265061: **257 PASS / 0 FAIL**, seis cenários de estabilidade, HTML offline compilado identicamente, SHA-256 `21d4f8856d4bff1fd7af2eb9c496aa5cec3a8cc2fa75e67bdde10efb67df511c`.
- A meta de reserva pode ser coberta por capital próprio, mas capital não conta como receita nem desbloqueia conquistas de faturamento.
- `schemaVersion 9` e mecânica de V2.4.1 preservados. **V2.5.0-alpha.1 segue candidata para teste, NÃO homologada como V2.5.0 estável.** QA Windows não verificado.
