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
