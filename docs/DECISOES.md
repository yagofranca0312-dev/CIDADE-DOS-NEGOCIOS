# Registro de decisões técnicas (ADR)

## ADR-001: um HTML de distribuição
- **Estado:** aceito no CP-000.
- **Contexto:** usuário deseja jogo sem servidor nem arquivos externos de execução.
- **Decisão:** `index.html` contém CSS/JS e recursos necessários; testes e docs ficam fora da distribuição.
- **Consequência:** bundles e scripts externos proibidos em runtime; modularidade precisa ser lógica.

## ADR-002: mutação de estado por um único canal
- **Estado:** aceito no CP-000.
- **Decisão:** estado oficial isolado; módulos de tela consomem snapshots; comandos passam pelo motor.
- **Consequência:** evita dupla contabilização e interfaces com regras paralelas.

## ADR-003: simulador determinístico
- **Estado:** aceito como contrato de futuras mecânicas.
- **Decisão:** PRNG controlado por seed, eventos ordenados, relógio único e comando uma única vez.
- **Consequência:** regressões reproduzíveis; calibrar desempenho antes de escalar.

## ADR-004: backup portável como requisito de lançamento
- **Estado:** aceito no CP-000.
- **Decisão:** JSON com versão do esquema, validação antes de carregar e exportação explícita.
- **Consequência:** nenhum save real usado em QA; `file://` não é tratado como armazenamento confiável universal.

## ADR-005: privacidade e governança inicial
- **Estado:** proposta operacional, a confirmar após criar repositório.
- **Decisão proposta:** repo privado, branch `main`, feature branches e PRs para mecânicas, checks automáticos e nenhuma licença pública implícita.
- **Consequência:** proteções de branch dependem de permissões GitHub; não alegar ativação sem verificação.
