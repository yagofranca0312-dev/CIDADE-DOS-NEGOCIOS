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
