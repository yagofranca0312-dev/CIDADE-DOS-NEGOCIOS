# Histórico de versões — Cidade dos Negócios

## V3.0.0 — Consolidação integral da V2 (AUDITORIA, sem release homologada; 07/11/2026)

**Não representa nova versão liberada.** O executável na `main` continua identificado como `3.0.0-alpha.1` (Patch A), já incorporado pela PR #38; a última **release formalmente homologada** é `2.9.0`, checkpoint `releases/v2.9.0-homologada`. A PR de [auditoria #39](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/pull/39) está **DRAFT**, sem merge, sem homologação da V3.0.

- **Etapa 1 — plano/gates:** dossiê `docs/V300_CONSOLIDACAO_INTEGRAL_GATES.md`, oito checkpoints: consolidar V2 antes da interface imersiva V3.1.
- **Etapa 2 — integração:** quatro regressões abrangendo mercado, RH, Fiscal Operacional, Paralegal, crédito, contratos, concorrência, logística, contabilidade e Patch A; CI [335 PASS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42416696608).
- **Etapa 3 — contratos:** oito regressões de única porta do motor, único lançamento de compras, vendas, idempotência e relatórios não mutantes; CI [343 PASS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42417243617). Riscos de fórmulas paralelas de RH e de propostas de compras registrados, sem afirmar dupla contabilização.
- **Etapa 4 — saves:** dezoito regressões de schemas 2–9 e rollback com motor original V2.9 homologado, checksum e corrupção; CI [361 PASS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42418650812). Ainda sem QA Windows e saves pessoais.
- **Etapa 5 — estabilidade:** três regressões novas, benchmark de oito painéis em DOM simulado com 30/365/1.825 dias, backups e HTML. O checksum passou a ser calculado apenas por **Executar Diagnóstico** no painel Sistema; em carreira artificial de cinco anos o custo médio observado caiu de ~2.110 ms para ~102 ms no executor. CI [364 PASS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42425405336). Persistência por `localStorage` ainda é risco de perda de progresso em caso de quota cheia.
- **Etapa 6 — documentação:** README corrigido para distinguir código atual, versão estável, programa V3.0 e fases históricas; ROADMAP recebe um estado vigente sem apagar seu histórico; este CHANGELOG separa fatos de implementação e homologação; criado [guia atual de gameplay, fiscal e backups](docs/JOGAR_GUIA_V300.md). **Validação da etapa 6:** [CI #42427216125](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42427216125), **370/370 testes PASS, zero falhas**, com seis testes de documentos; contratos fiscais, links, menus, versão e histórico verificados. PASS documental **não** significa homologação V3.0.
- **Etapa 7 — contrato V3.1 somente leitura:** adaptador de desenvolvimento `src/contracts/v31-read-model.mjs` (fora do HTML atual), contrato versionado `CIDADE_V31_READ_V1` e [documento técnico](docs/V300_CONTRATO_UI_V31.md). Onze testes verificam 30 cidades, 18 lotes, filiais, eventos recentes/paginados, ofertas de ações sem `dispatch`, isolamento de estado/RNG e atualização por revisão/worldId. [CI #42428343258](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42428343258): **381/381 testes PASS**, benchmarks e HTML reproduzível. **Nenhuma interface V3.1 criada, nenhum novo comando nem efeito econômico.**
- **Etapa 8 — auditoria de prontidão GO/NO-GO:** [parecer final](docs/V300_GATE08_GO_NO_GO.md) com oito checkpoints, 18 requisitos de aceitação (4 com evidência, 14 pendentes), risco aberto de `localStorage`, scripts `npm run audit:release` e `npm run audit:release:require-go`. O primeiro registra **NO_GO** sem declarar homologação; o segundo **bloqueia a liberação com exit code 2**. Oito testes novos; [CI #42429308063](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42429308063) **389/389 PASS**, benchmark e HTML reproduzíveis. Resultado **NO-GO PARA RELEASE**, com PR #39 DRAFT, `main` e V2.9 intactas.
- **Saneamento P0-01 — proteção do salvamento local (branch de auditoria, sem merge):** `src/ui/app.js` passou a persistir e verificar o **estado candidato antes da ativação**; falhas de quota/permissão/leitura/serialização recusam o comando sem confirmar nem avançar calendário, estoque ou caixa. Importação e restauração seguem a mesma regra. [Relatório técnico](docs/V300_P0_PERSISTENCIA_TRANSACIONAL.md); 11 testes novos usam funções reais da UI em `vm` com motor genuíno e armazenamento simulado. `index.html` recompilado para coincidir com a fonte. [**CI #42431354313 — 400/400 PASS, 0 FAIL**](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42431354313), benchmarks e build/HTML com SHA-256 reproduzível. **QA Windows/file://, save pessoal e quota real ainda não realizados; RG-06 e RG-12 permanecem abertos.**
- **Próximos passos (saneamento, não nova etapa homologada):** executar QA real de quota/saves/rollback em Windows; revisar PR-01/PR-02, validar desktop/mobile, reunir provas e refazer gate 08. **Não publicar/mergear por continuidade automática nem iniciar V3.1 visual antes da V3.0 apta.**

**Invariantes:** `schemaVersion=9`; nenhum tributo real, nenhum envio de declarações, nenhuma mudança nas fórmulas do motor econômico por esta etapa documental. O fiscal didático de 2026 e o checklist Fiscal Operacional são subsistemas distintos. O HTML único foi recompilado na Etapa 5; a Etapa 6 não altera gameplay.

---


## 3.0.0-alpha.1 — Patch A Economia e Balanceamento (candidata, 07/11/2026)

- Três perfis de risco para capital de giro, com reservas de 14/7/3 dias de custos fixos e metas de cobertura de 4/7/12 dias de demanda por SKU.
- Cotações de compra por fornecedor existente, saldo de caixa, entregas pendentes e capacidade real; estimativa de demanda baseada em até 7 observações passadas ou referência inicial.
- Cenários de preço ilustrativos de 92%/100%/108% do preço atual, com sensibilidades de demanda e margem bruta potencial. Preços não são alterados por consulta.
- Novo comando explícito `ECONOMIA.COMPRAR_PLANO`: valida revisão e cotação, usa motor de compras atual, gera estoque em trânsito, diminui caixa, preserva ledger e idempotência.
- Alertas de unidade subcapitalizada, passivos superiores ao caixa após a compra, possível ruptura e margem unitária negativa.
- Mercado → Compras: painel de estratégia, proposta detalhada, comparação e confirmação; sem vendas, pagamentos, crédito ou compras automáticos.
- **331/331 testes PASS, 0 FAIL** e seis famílias de benchmarks aprovadas na [CI #42413908821](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42413908821). Simulações 30/90/365 dias com três perfis, controle sem estoque e expansão descapitalizada; **na data desse teste da candidata** a integração à `main` ainda era pendente. **Situação posterior:** Patch A integrado à `main` no commit `871df2b1cd133bcad717c0194a474a35fbabcd3c`, mantendo QA Windows e homologação V3.0 pendentes.
- `schemaVersion 9` e backups V1/V2 preservados. Último checkpoint estável: `releases/v2.9.0-homologada`. [Especificação](docs/V300_PATCH_A_ECONOMIA_BALANCEAMENTO.md).


## 2.9.0 — QA, balanceamento e consolidação (homologação formal em 07/11/2026)

- Relatório gerencial **somente leitura**, 30/90 dias: receita, CMV, despesas, margem, tributos simulados, resultado, caixa, passivos, demanda atendida/perdida e contribuições de cada unidade.
- Alertas quantitativos de liquidez, baixa cobertura dos custos fixos, ruptura de abastecimento e margem negativa, sem gastos, empréstimos ou vendas automáticas.
- **Formato JSON V1 preservado** como backup tradicional e compatível com rollback para V2.8.
- **Formato JSON V2 opcional, reversível** com dicionário de chaves repetidas e checksum, sem perder eventos, lançamentos, produtos ou datas; só importável em V2.9+.
- Painel em Sistema com diagnóstico de qualidade, comparação de tamanhos, alertas e exportação compacta mediante ação do jogador.
- Doze novos testes; **316/316 PASS, 0 FAIL** na CI da candidata `42405817482`, benchmarks V2.4.1, V2.6, V2.7, V2.8 (até 1.832 dias) e V2.9 (90/365 dias) aprovados; CI de integração candidata à `main` `42406067465` também **SUCCESS**. Nos cenários 90/365, redução de tamanho do backup em **67,2%/67,5%**, sem excluir histórico.
- **Aceite formal expresso em 07/11/2026.** A versão final V2.9.0 será publicada apenas após CI de promoção e da `main` aprovadas. O diagnóstico detectou demanda não atendida de **100% e 59,7%** nos cenários respectivos; **não significa equilíbrio econômico comprovado**. QA real Windows, navegador, importação efetiva de save de usuário e diversão **sem evidências**, registrados como ressalvas. Guardar backup tradicional V1 antes de atualizar; rollback preservado na V2.8.0. [Registro](docs/HOMOLOGACAO_V290.md) · [Plano](docs/V290_QA_BALANCEAMENTO_CONSOLIDACAO.md).


## 2.8.0 — Produção e logística integrada (homologação formal, 07/11/2026)

- Rotas por índice fictício (não km ou ETA reais) e frete calculado por volume, sem fonte geográfica externa.
- Remanejamento entre lojas com baixa física, trânsito, chegada e compensação interfilial, sem receita nem CMV.
- Centro de distribuição opcional com custo fixo e quitação própria de obrigação já reconhecida, estoque, capacidade 2.000 e compras de fornecedores, incluindo desconto simulado de 25% em trechos com CD.
- Padaria: farinha como insumo, produção 1:3, custo industrial incorporado ao estoque, capacidade diária e rastreio de lotes.
- Validade de pães/bolos somente novos, redução de estoque e despesa de desperdício reconhecida uma vez, inclusive perda em trânsito.
- Sugestões de compras e transferências puramente informativas e editáveis; ação exige comando confirmado.
- Conciliação de estoque e trânsito por unidade/CD, razão geral e compensação interna em zero; save `schemaVersion 9` preservado.
- Quatorze testes específicos de logística; **304/304 testes automatizados PASS, 0 FAIL** na CI de candidata `42141983053`, mais benchmarks históricos, concorrência, crédito e 90/365/1.832 dias com 3–5 unidades. CI da `main` candidata `42142233230` também PASS.
- **Homologação formal expressa do titular em 07/11/2026.** A promoção final exige revalidar a compilação 2.8.0 e o CI da `main`. **QA manual Windows, BAT, navegador e jogabilidade não comprovados**, documentados como ressalva, sem aprovação fictícia. Backup JSON obrigatório antes de atualizar; checkpoint da V2.7 preservado. [Registro](docs/HOMOLOGACAO_V280.md) · [Detalhes](docs/V280_PRODUCAO_LOGISTICA.md).


## 2.7.0 — Crédito, contratos e riscos financeiros (homologada formalmente, 05/11/2026)

- Financiamento empresarial fictício: limite proporcional ao histórico de vendas, até R$ 30.000 de principal em aberto; 3, 6, 12 ou 24 períodos de 30 dias; juros de 1,8% por período, calculados proporcionalmente quando há amortização antecipada.
- Comando idempotente de crédito `CREDITO.CONTRATAR`; entrada em caixa e em `LOAN_PAYABLE`, **nunca em REVENUE**. Juros em despesa/`INTEREST_PAYABLE`; multas limitadas a 20% do principal, renegociação por até duas vezes sem perdão silencioso.
- Fornecimento contratado: até seis contratos ativos, pedidos de 7/14/30 dias (2–12 ciclos), custo fixo, compra paga na data, rastreio no pedido e entrega no estoque. Falha de pedido gera multa fictícia de 2%; rescisão gera multa fictícia de 5% dos compromissos não cumpridos.
- Calendário 30/90/180 dias distingue passivos já reconhecidos de compras futuras e juros não contabilizados; estresse sem vendas não desconta principal duas vezes.
- Nova tela nas Finanças, regressões de crédito e novo benchmark de 90/365/1.825 dias. `schemaVersion=9` preservado para saves legados.
- **Homologação formal:** titular autorizou expressamente em 05/11/2026 após a CI `42136048056` aprovada. Candidata validada com **290/290 testes PASS, zero falhas**, seis benchmarks históricos, quatro cenários de concorrência e três benchmarks financeiros de 90/365/1.825 dias. **QA manual Windows/browser e balanceamento subjetivo não comprovados**. V2.6.0 conservada como rollback. Registro: [HOMOLOGACAO_V270.md](docs/HOMOLOGACAO_V270.md); especificação: [V270_CREDITO_CONTRATOS_RISCOS.md](docs/V270_CREDITO_CONTRATOS_RISCOS.md).


## 2.6.0 — Jornada Empresarial integral + Economia Viva (homologada formalmente, 05/11/2026)

- Incorpora pendências funcionais da V2.5: oito conquistas sem bônus arbitrários, três desbloqueios, tutorial contextual, reputação baseada em amostra e seis dilemas executados por comandos econômicos auditáveis com sete dias de observação.
- Implementa 90 rivais persistentes por cidade/setor, mercado finito compartilhado, decisões limitadas de preço, estoque, caixa e expansão, seis tipos de acontecimentos locais e painel com alertas.
- Preserva saves `schemaVersion=9` e migrações antigas; concorrência é opt-in em carreiras anteriores e ativada explicitamente após criação de carreira nova na interface.
- Formata JSON de backup de modo compacto apenas quando a versão indentada excederia o limite seguro; checksum e conteúdo intactos. Mantém formato histórico para arquivos menores.
- CI: 275 testes PASS, zero falhas, seis benchmarks legados e quatro cenários de concorrência (365 dias em três estilos/regiões + 1.825 dias com cinco unidades) PASS.
- **Homologação formal:** aceite expresso de Yago em 05/11/2026 após CI; **QA Windows/browser e equilíbrio percebido não foram comprovados**. Manter backup e V2.4.1 como recuperação histórica. Versão promovida de `2.6.0-rc.1` para `2.6.0` sem mudança de regras econômicas.
- Evidência de aceite, limitação e snapshot: [HOMOLOGACAO_V260.md](docs/HOMOLOGACAO_V260.md). Detalhes: [V260_PATCH_INTEGRAL.md](docs/V260_PATCH_INTEGRAL.md).


## 2.5.0-alpha.1 — Jornada Empresarial (candidata, 05/11/2026)

- GDD da jornada documenta investir → decidir → operar → consequência → objetivo; metas de curto, médio e longo prazos.
- Relatório determinístico `progressionReport` lê unidades, calendário e lançamentos efetivos; 12 objetivos e níveis calculados, com comprovação e progresso.
- Painel em **Empresas → Dashboard**, com marcos, metas e tutorial opcional, sem alterar navegação principal.
- Nenhuma recompensa econômica ou nova obrigação tributária; `schemaVersion 9` preservado.
- Reputação com efeitos, seis dilemas e homologação V2.5.0 **não** estão implementados nesta alpha.
- **Estado verificado:** CI 42120265061 PASS, 257 testes aprovados, 6 benchmarks, HTML reproduzível; QA Windows e homologação final da V2.5 pendentes. Ver `docs/V250_ALPHA1_IMPLANTACAO.md`.


## 2.4.1 — Estabilização financeira e qualidade (homologação formal, 05/11/2026)

- Baixa explícita e idempotente de despesas operacionais reconhecidas anteriormente como contas a pagar: débito em `PAYABLE`, crédito em `CASH`, sem duplicar `EXPENSE`. Pagamento parcial por estabelecimento; RH/DP e tributos simulados mantêm seus próprios pagamentos.
- Projeção da unidade ativa inclui despesa estimada de folha no resultado e passivo futuro; informa obrigações operacionais, salários já apurados e tributos didáticos já contabilizados, com ressalvas de escopo.
- Cópia de segurança local verificada antes de importar ou descartar uma carreira, opção de recuperação e tratamento de falha de armazenamento.
- Testes novos para integridade, idempotência, histórico e saves; benchmark de 30/365/1.825 dias com 1 e 5 unidades no CI.
- **Status final:** aceite formal de homologação expresso pelo titular em 05/11/2026; CI da RC1 aprovado (250/250, seis benchmarks e HTML reproduzível), a ser repetido na release estável. Teste manual Windows/browser ainda não possui evidência documentada.
- **Origem:** V2.4.0 estável preservada. Sem mudança no `schemaVersion 9`.

## 2.4.0 — Homologação final dos patches administrativos A–C (04/11/2026)

- Paralegal, RH/DP e Fiscal Operacional fictícios homologados formalmente, com 243 testes automatizados aprovados e HTML offline reproduzível.
- Checkpoint `releases/v2.4.0-homologada`; sem presumir QA manual Windows não documentada.

## 2.3.0 — Homologação final do ciclo A–D (03/11/2026)

- **Patch A — Navegação:** Cidade, Empresas, Mercado e Administrativo, 13 subáreas e atalhos legados preservados.
- **Patch B — Mercado:** reposição inteligente com modos crítico/ideal/personalizado, compras multi-SKU, comparação de fornecedores, ajuste opcional ao caixa e confirmação explícita.
- **Patch C — Empresas:** Dashboard e gestão de unidades; análises e comparativos por período, cidade, ramo e unidade.
- **Patch D — Administrativo:** Finanças com tesouraria/fluxo de caixa; Contabilidade com DRE/balanço/razão/conciliação; Fiscal preservado; RH/DP e Paralegal informativos sem simulações fictícias.
- Homologação **expressamente solicitada pelo titular** nesta conversa após implantação do Patch D. Isso constitui autorização de release; não comprova execução independente de todos os cenários manuais no Windows.
- Regras econômicas e fiscais do motor preservadas em A–D (exceto identificador técnico VERSION). Caixa e tributos consolidados não são distribuídos artificialmente entre filiais.
- Formato de save **schema 9** preservado; funcionamento offline em HTML único. CI completo e reprodutibilidade obrigatórios antes da publicação.
- **Snapshot homologado:** releases/v2.3.0-homologada, criado após merge e CI da main. V2.3.0 não engloba a reforma tributária ampliada (reservada para V3.0).


## 2.3.0-alpha.3 — Patch C homologado pelo jogador (03/11/2026)

- Dashboard empresarial: receita, margem, resultado operacional e após tributos, estoque, alertas e tributos do grupo.
- Minhas Empresas com busca e filtros por cidade e ramo, mantendo abertura, seleção e caixa compartilhado.
- Análises realizadas: filtros por unidade, cidade, ramo e período; tendências por lançamentos.
- Comparativos: unidade, cidade e ramo, com ordenação por receita, margem, resultado ou estoque.
- Regras econômico-fiscais, compras do Patch B e save schema 9 intactos; nenhum rateio fictício de impostos/caixa por filial.
- 212 testes automatizados PASS da candidata. Homologação expressamente solicitada pelo jogador em 03/11/2026; versão intermediária alpha.3.
- Identificador de tela 2.3.0-alpha.3. Ainda não representa a V2.3.0 final, reservada ao Patch D.

## 2.3.0-alpha.2 — Patch B versionado, disponível para teste (03/11/2026)

- Reposição Inteligente em Mercado > Compras: críticos, meta ideal e seleção personalizada.
- Comparação de fornecedores, pedido multi-SKU confirmado e ajuste opcional ao caixa.
- Sem compras automáticas não confirmadas; estoque em trânsito e limites considerados.
- 205 testes automatizados PASS, zero falhas; HTML offline reproduzível, CI do Patch B.
- Schema 9; motor econômico, contabilidade e fiscal preservados, salvo número de versão.
- NÃO HOMOLOGADO funcionalmente no Windows: publicado para teste do jogador, aguardando aceite.
- Patch C segue em branch própria; V2.3.0 final depende de C e D.


## 2.3.0-alpha.1 — Patch A homologado pelo jogador (02/11/2026)

- Navegação principal em quatro áreas: Cidade, Empresas, Mercado e Administrativo.
- Menus internos: 4 subáreas em Empresas, 4 em Mercado e 5 departamentos em Administrativo.
- Fiscal integrado ao Administrativo; controles e avisos existentes mantidos. Atalhos legados preservados.
- Menu adaptado para dispositivos móveis; componentes e formulários operacionais preservados.
- Aceite prático do jogador em Windows em 02/11/2026, após instalação isolada e teste do Patch A.
- Motor econômico, regras fiscais e contábeis inalterados (exceto VERSION); schema 9 e saves preservados.
- **Escopo:** homologação intermediária do Patch A. A V2.3.0 final depende da conclusão de B, C e D.
- **Publicação normal:** após CI e integração à main; snapshot estável específico do Patch A.


## 2.1.0-rc.1 — identidade visual e clareza de jogo (02/11/2026)

- Logotipo SVG, favicon offline e arte da referência KEYART otimizada e incorporada.
- HUD de quatro indicadores reais, com expansão acessível das métricas no celular.
- Inspetor contextual mais claro e painéis de Mercado, Finanças e Fiscal uniformizados.
- Simulação, contabilidade, fiscal e schema 9 preservados sem novas mecânicas.
- 162 testes locais PASS e QA em seis resoluções. Candidata pendente de homologação prática.

> **V2.0 homologada pelo jogador em 02/11/2026**, snapshot `releases/v2.0.0-homologada`, commit `ac3e840b71d3551026f62cc6a04c9173f553f9d7`. O jogo mantém a identificação técnica `2.0.0-rc.1`.

## 2.0.0-rc.1 — consolidação, cidade protagonista e UX (02/11/2026)

- Quatro áreas de navegação; Fiscal como subseção de Finanças; Configurações isoladas.
- Mapa SVG maior com inspeção contextual e seleção de unidades existentes; informações secundárias recolhíveis.
- Mercado e relatórios organizados em painéis expansíveis; HUD compacto e navegação inferior no celular.
- Renderização do mapa e views de Mercado/Finanças extraídas para arquivos de origem; HTML final permanece único, offline.
- Motor congelado salvo número de versão; schema 9 mantido, saves e histórico V1.9 íntegros.
- Testes golden V1.9×V2.0, regressões, interface em cinco larguras e fluxo de operações em navegador.
- V1.9 homologada por aprovação do jogador, snapshot `releases/v1.9.0-homologada` no commit `575c54c6`.
- Homologação prática da V2.0 confirmada posteriormente pelo jogador em 02/11/2026. Sem novos sistemas de gameplay.


## 1.9.0-rc.1 — Simulação Tributária Brasileira (02/11/2026)

- Modo padrão sem apuração tributária; opt-in expresso para hipótese de comércio Simples Anexo I (somente competências 2026 delimitadas e começando no mês posterior).
- Base de alíquotas nominais/deduções da LC 123/2006, faixa e RBT12 anualizada para início de atividade, com precisão em centavos e rótulo **simulado**.
- IBS/CBS 2026 como índices-testes meramente informativos; sem passivo automático. Competências 2027+ sinalizadas `UNSUPPORTED` para apuração efetiva.
- Escrituração fictícia segregada: `TAX_EXPENSE`, `TAX_PAYABLE`, pagamento independente; DRE, BP e fluxo realizado conciliáveis.
- Preserva caixa único, rede de filiais, histórico, RNG; migra saves 2–8 para schema 9 sem imposto retroativo.
- Aba Fiscal existente agora contém resumo, ativação consciente, relatórios e pagamentos, sem adicionar navegação principal.
- Build e versionamento verificados em título, abertura, topo, rodapé e arquivos de download. V2.0 reservada apenas à consolidação interna e visual de jogo.
- **Status:** candidata; validação Windows/homologação pendentes.


## 1.8.0-rc.1 — demonstrações contábeis e conciliação (02/11/2026)

- Plano de contas com grupos e naturezas; classificação opcional de novos journals; preservação dos anteriores.
- DRE por período/unidade/grupo, balanço consolidado com identidade patrimonial, fluxo de caixa realizado e reconciliação.
- Fechamento gerencial mensal somente leitura; não cria lançamentos nem altera o RNG.
- Preserva schema 8 e compatibilidade direta com o save V1.7 homologado.
- Cinco opções internas de leitura financeira, sem novas abas principais; revisão ampla visual reservada à V2.0.
- Versão unificada nas telas, build e nome do pacote; homologação Windows pendente.


## 1.7.0-rc.1 — PIB oficial, comparador e versão única (02/11/2026)

- PIB total de 2023 (SIDRA/IBGE, tabela 5938, variável 37) para os 30 municípios.
- Modelo fictício com ajuste regional limitado a ±8 p.p.; sem confundir atividade econômica com renda domiciliar.
- Painel comparador de índices de demanda por cidade. REGIC/PIB per capita pendentes de verificação e não exibidos como valores oficiais.
- Migração schema 2–7 para 8, preservação de saldos, inventário, histórico e RNG.
- Corrige rodapé antigo `V1.5.0-RC.1` e referência da introdução; versão sincronizada entre motor, tela inicial, badge, rodapé, pacote e arquivo.
- V2.0 permanece dedicada à consolidação técnica e visual — sem novas mecânicas.
- Candidata: necessita CI e homologação real em Windows.


## 1.6.0-rc.1 — economia regional (02/11/2026)

- Inclusão verificada dos códigos IBGE e população estimada 2026 dos 30 municípios, com fonte, período e versão offline.
- Modelagem fictícia de diferenças regionais: fator de demanda de 80% a 130%, elasticidade de preços e referência concorrencial por porte.
- Observatório econômico separa indicador oficial de parâmetro simulado; PIB 2023 e REGIC 2018 aparecem explicitamente como não integrados.
- Distritos isométricos com skyline, altura e densidade ilustrativos por faixa de porte, mantendo 18 lotes interativos.
- Save schema 7; preservação de filiais, estoques, RNG, saldos, ledger, eventos e históricos existentes; mudança apenas na simulação futura.
- V1.5 homologada no Windows; snapshot de recuperação preservado. V1.6 candidata aguardando homologação.

## 1.5.0-rc.1 — expansão empresarial (02/11/2026)

- Até cinco estabelecimentos em cidades, setores e lotes distintos, com caixa compartilhado e operações separadas.
- ID de estabelecimento vinculado a lançamentos novos e aos indicadores de cada filial; matriz recebe historicamente lançamentos legados, sem modificar valores anteriores.
- Visões financeiras consolidadas ou individuais; caixa não é dividido artificialmente.
- Demanda compartilhada entre estabelecimentos do mesmo ramo/cidade; simulação econômica única por calendário.
- Migração validada schema 2/3/4/5 → 6; backup anterior à atualização é indispensável para rollback.
- V1.4 validada no Windows pelo jogador e preservada em `releases/v1.4.0-homologada`.
- Testes estruturais, econômicos e navegador. V1.5 ainda aguarda homologação no Windows.

## 1.4.0-rc.1 — estratégia e equilíbrio econômico (02/11/2026)

- Campanhas de desconto por SKU e prazo determinado; motor altera preço efetivo e elasticidade da demanda sem trocar preço de tabela ou criar vendas manuais.
- Painel de capital de giro, cobertura de caixa, ponto de equilíbrio aproximado e riscos.
- Custos variáveis (CMV), despesa fixa operacional e despesa não recorrente separados no realizado.
- Cenários puros de 7/30/90 dias com estoque, recebimentos previstos, caixa e obrigações estimados; nenhuma projeção se transforma em lançamento.
- Backtests determinísticos 90/180/365 dias e regressões de migração de saves.
- Save schema 5 com migração conservadora de 2/3/4; versões antigas não leem schema 5.
- V1.3 homologada no Windows pelo usuário e preservada; V1.4 ainda aguarda homologação prática.

## 1.3.0-rc.1 — inteligência de mercado e abastecimento (01/11/2026)

- Demanda diária estimada para todos os SKUs, inclusive sem estoque; apuração de não atendidos e potencial de faturamento perdido (sem reconhecimento contábil de receita não realizada).
- Preços por fornecedor e prazos de entrega simulados; limite diário de fornecimento por produto.
- Pedidos pagos contabilizados como ativo em trânsito; entregas no vencimento movimentam ativo para inventário sem movimentar caixa novamente.
- Valoração de estoque com custo médio ponderado por SKU, CMV conciliado em centavos.
- Estoque mínimo, meta, cobertura prevista e sugestão de reposição, sempre com confirmação manual de encomendas.
- Schema 4 com migração conservadora de versões 2 e 3; necessidade de backup antes da atualização. Sem alteração de dados históricos de vendas e CMV.
- Bateria de testes estruturais, contábeis, integração e interface; homologação no Windows ainda pendente.

## 1.2.1-rc.1 — hotfix de vendas automáticas (01/11/2026)

- Bloqueia novas vendas manuais no motor e remove carrinho/checkout da UI.
- Apresenta painel de demanda e vendas simuladas com resultados por SKU e comprovantes consolidados do dia.
- Registra estimativa apenas quando há estoque, atendidas e não atendidas em eventos de auditoria.
- Mantém registros manuais anteriores íntegros, sem alterar caixa, CMV, datas ou ledger histórico.
- Preserva schema 3 e os números da simulação econômica anterior; novas observações não mudam o RNG.
- Validada pelo usuário em Windows; preservada na branch releases/v1.2.1-homologada.

## 1.2.0-rc.1 — gestão comercial multitem (candidata)

- Três SKUs iniciais por ramo e cadastro de novos produtos até 40 por estabelecimento.
- Compras de estoque por produto e fornecedor fictício, com custo unitário, caixa e valor de inventário reconciliados.
- Carrinho com venda à vista de múltiplos itens, receita e CMV registrados atomicamente, além de vendas diárias simuladas por SKU.
- Painel de desempenho por produto e últimos movimentos comerciais.
- Migração validada de saves schema 2 para schema 3, preservando economia anterior e histórico agregado sem criar detalhes retroativos inexistentes.
- **Não é retrocompatível com a V1.1.1:** exporte backup JSON antes de atualizar. A migração é somente para frente.
- Mantém filtros financeiros manuais, integridade contábil e transparência fiscal `NOT_COVERED`.
- Homologação prática no Windows pendente.

## 1.1.1-rc.1 — hotfix de filtros financeiros manuais

- Relatório não acompanha automaticamente o avanço dos dias do mundo.
- Campos especializados: data de corte, dia, competência mês/ano, trimestre/ano, semestre/ano, ano e intervalo inicial–final.
- Novo recorte `semester` e `range` no relatório financeiro, sem alteração do ledger ou dos saves.
- Validação de datas impossíveis, intervalos invertidos e datas futuras do jogo.
- Botão opcional para selecionar a última data concluída explicitamente.
- Testes de regressão para recortes, isolamento de dados, preservação de save e interface.

## 1.1.0-rc.1 — 01/11/2026 (patch de gestão; candidata a homologação)

- Histórico consultável de alterações de preços, inclusive eventos presentes nos saves da V1.0.1.
- Atalhos que preenchem quantidades de compra (10, 50, 100, 250), sem compra automática.
- Demonstrativos por dia, competência mensal, trimestre, ano ou carreira inteira, com seleção da data de referência.
- Lucro bruto, CMV e resultado operacional derivados do ledger; saldos de caixa/estoque/obrigações sempre acumulados até a data-limite e devidamente rotulados.
- Sem mudança de `schemaVersion: 2`, sem migração de saves, sem alteração na lógica dos preços/vendas ou nos tributos não cobertos.
- Testes de compatibilidade e cálculos históricos acrescidos. Validação real da atualização no Windows pendente.


## 1.0.1-rc.1 — 01/11/2026 (hotfix HOMOLOGADO pelo usuário)

- Destaque visual legível do lote selecionado; remove rótulos numéricos permanentes no mapa para evitar poluição.
- Exibe preço atual da empresa separado do preço de referência do concorrente.
- Confirma a alteração do preço com o valor antigo e o novo, mantendo registro no journal de eventos.
- Retém formato do save (`schemaVersion: 2`), lógica econômica, transparência fiscal e compatibilidade com a V1 anterior.
- Aprovado em uso real pelo usuário: atualização via BAT, persistência automática da carreira sem reimportação e clareza do novo preço; homologação funcional confirmada.
- Status: base funcional homologada; evidência do usuário não equivale a auditoria externa universal.

## 1.0.0-rc.1 — 01/11/2026 (candidata jogável; publicação e homologação pendentes)

- Primeira economia executável: três tipos de loja, capital, abertura, compra/estoque, precificação, vendas, despesas e ledger em centavos com partidas equilibradas.
- Mundo com 30 cidades e 27 UFs; mapas isométricos ilustrativos clicáveis, sem fingir geografia real.
- Comandos transacionais com revisão única, idempotência, RNG persistente e auditoria de eventos.
- IA básica de preços dos concorrentes; simulação de 1/7/30 dias com datas determinísticas.
- Interface azul-marinho/dourado, mapa principal, abas Empresa/Mercado/Finanças/Fiscal/Sistema e layout responsivo.
- Exportação/importação de save JSON com checksum; migração conservadora de fundação CP-000 vazia; autosave local de melhor esforço.
- Fiscal com `NOT_COVERED`: nenhum cálculo de tributo ou declaração de legalidade simulada.
- Testes automatizados, geração de HTML único e verificações em Chromium isolado.
- **Não homologado:** validação do `file://` em Windows, funcionamento real do atualizador com repositório publicado e integrações fiscais ainda pendentes.

## 0.0.1 — CP-000/CP-001 (fundação)

- HTML de infraestrutura sem mecânicas; scripts de atualização e publicação; documentação de arquitetura.
