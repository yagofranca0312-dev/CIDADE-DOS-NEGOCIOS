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

## Estado 02/11/2026 — V1.8 HOMOLOGADA, V1.9 PLANEJADA

- **V1.8.0-rc.1 homologada** por confirmação expressa do jogador; snapshot preservado em `releases/v1.8.0-homologada` no commit `66bdab08547daec1df50eca3d6b1967a2a664d2c`.
- **V1.9:** sistema tributário brasileiro **simulado, parcial e documentado**, com motor fiscal temporal, Simples comércio em hipótese delimitada, Reforma Tributária educativa e integração ao ledger somente de cálculos efetivamente cobertos; plano `docs/PLANO_V19.md`. **Ainda não implementada.**
- **V2.0:** consolidação/refatoração da arquitetura e reformulação da UX/UI com identidade de jogo empresarial, sem introduzir novos sistemas.
