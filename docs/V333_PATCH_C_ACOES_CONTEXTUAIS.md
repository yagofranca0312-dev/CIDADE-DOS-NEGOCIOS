# V3.3.3-C/E — Ações Rápidas e navegação contextual

**Status:** IMPLEMENTAÇÃO CANDIDATA, pendente de homologação funcional (Patches A e B seguem Draft).
**Base:** `defb0e1c5dea273f0ef071beb8d70ef0e4613f28` / PR #53 (V3.3.3-B/E). Branch `feat/v3.3.3-c-acoes-contextuais`.
**Fronteira:** Patch C/E; D/E e E/E não iniciados.

## Contratos
- Motor puro `createV333DecisionEngine.planQuickAction(state,request)` retorna plano `READY`, `NEEDS_UNIT`, `STALE_OCCURRENCE`, `INVALID_ROUTE`, `INVALID_UNIT`, `INVALID_PRODUCT` ou `NO_CAREER`. A identidade `occurrenceId` é novamente checada no estado atual; não confiar em atributos de rota adulterados.
- O clique `Ir à ação` no assessor, ou item datado da Agenda, ativa a unidade de origem somente quando necessária, via `commit('EMPRESA.ATIVAR',{businessId})`. Esse comando de UI pré-existente grava apenas a seleção de unidade e auditoria; **não é comando econômico**. Se persistência durável falhar, rota abortada (fail-closed).
- Após confirmação, a UI abre a seção original. Ocorrências SUP selecionam o produto no formulário de compra **sem preparar/pagar pedido**; FIN-01 seleciona a unidade no formulário de passivos operacionais **sem preencher valor nem efetuar baixa**.
- Atalhos genéricos Repor Estoque, Pagar Contas, Preços e Fiscal continuam abrindo a tela correspondente. Sem empresa, atalhos que exigem unidade conduzem à área Empresas.
- Registro fiscal simulado, prazo, severidade e foco da Central/Agenda preservados; ausência de data não gera vencimento. `schemaVersion=10`, `package.json=3.3.2`, motor econômico, save, regras fiscais, cidade e geometria inalterados.

## Gate C
- C-01…C-10: identidade de aviso, unidade inativa, validação read-only, aviso desatualizado, proteção de rotas, prova de `EMPRESA.ATIVAR`, produto e passivo, sem mutação econômica.
- Linux `npm run check`, benchmarks, HTML canônico e testes cumulativos de A+B.
- Suite específica \`tools/qa-windows-v333c.mjs\`: clique real em alerta de outra unidade em Chrome/Edge, desktop e mobile emulado, ativação persistida, produto pré-selecionado, sem mutação econômica; repetição não grava.
- Windows hospedado: Chrome/Edge via `file://`, mobile emulado, IndexedDB e saves sintéticos, benchmark UI 365/1825; não equivale a hardware ou save pessoal.
- Inspeção funcional do titular ainda necessária nos Patches A/B/C. **Não mesclar na `main`, não publicar V3.3.3, não iniciar Patch D automaticamente.**
