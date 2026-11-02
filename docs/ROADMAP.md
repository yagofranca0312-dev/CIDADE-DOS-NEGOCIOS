# Roadmap — Cidade dos Negócios

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
