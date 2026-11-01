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
