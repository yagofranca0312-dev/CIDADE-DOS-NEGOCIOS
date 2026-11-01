# CP-000 — Evidências de validação

**Data:** 2026-11-01  
**Escopo:** HTML de pré-produção sem mecânicas.

## Testes locais de estrutura

- Execução: `npm test` em Node.js `v22.16.0`.
- Resultado: **7 PASS / 0 FAIL**.
- Inclui: HTML único, CSS e JS embutidos, sintaxe JS, ausência de dependências de rede, módulos mínimos, contrato de save e registro do checkpoint.

## Smoke test de interface em Chromium

- Chromium headless com Playwright no ambiente de validação.
- HTML carregado diretamente como conteúdo do documento por `page.set_content`, sem buscar URL externa.
- Viewports **320, 390, 768 e 1280 px**: inicialização sem erros JS, botão Diagnóstico PASS, sem overflow horizontal observado.
- Viewport **390 px**: exportação de JSON, leitura do arquivo baixado e reimportação PASS.

## Limites conhecidos

- A política do ambiente de validação bloqueou `file://` com `ERR_BLOCKED_BY_ADMINISTRATOR`; não foi possível testar a abertura direta via arquivo local nessa sessão. Isso **não** demonstra defeito no HTML; é uma restrição do ambiente.
- Nenhum teste de simulação ou gameplay foi feito, pois ainda não existem mecânicas.
- GitHub Actions remota, regras de proteção, publicação do repositório e PRs **não executados neste checkpoint local**.
- Testes estruturais não substituem testes futuros de recuperação de saves, integridade do motor ou longas execuções.
