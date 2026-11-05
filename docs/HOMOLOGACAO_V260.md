# Homologação formal — Cidade dos Negócios V2.6.0

**Data:** 05/11/2026 (America/Fortaleza)
**Aprovador:** Yago França da Silva, titular do projeto
**Ato explícito:** pedido direto “homologue”, após entrega integral da V2.6.0-rc.1 e discussão do próximo passo.
**Situação:** HOMOLOGAÇÃO FORMAL DO TITULAR, com ressalva de testes manuais não comprovados.
**Escopo:** promoção do código já validado da V2.6.0-rc.1 para `2.6.0`, sem inclusão de novas regras de jogo.

## Evidência objetiva disponível antes do aceite
- PR #30 integrado à `main`, commit `2266a2a71a72eec8c95020485f88f3ccc9a99542`.
- CI `42127902802` para essa `main`: **PASS** (build HTML reproduzível, testes, benchmark e verificação de diff).
- CI `42127273627` da candidata: **275/275 testes PASS**, 0 FAIL; benchmarks históricos e novos cenários de concorrência PASS.
- Cenários da concorrência: 365 dias conservador em Tianguá, equilibrado em Fortaleza, agressivo em São Paulo; 1.825 dias com cinco unidades; ledger, save e importação íntegros.
- `schemaVersion 9` sem migração forçada; 90 rivais persistentes, mercado finito, seis eventos e escolhas empresariais contabilizadas, com ativação explícita para saves anteriores.
- Versionamento de recuperação anterior: `releases/v2.4.1-homologada`.

## Declaração de homologação
O titular aprovou expressamente a versão após a implantação integral. Esta declaração é **aceite formal de release**; não é afirmação de teste manual realizado no Windows.

### Ressalvas mantidas
- Sem comprovação nesta sessão de execução no Windows, abertura pelo BAT, persistência efetiva no navegador `file://`, interface em todas as resoluções ou avaliação humana de diversão e justiça econômica.
- A análise automatizada de equilíbrio não assegura que todas as estratégias sejam lucrativas; no cenário de Fortaleza o caixa foi reduzido. Convém validar com carreira real antes de excluir a V2.4.1.
- Preservar exportação JSON de saves e a referência estável anterior; não converter saldos históricos ou simulações em fatos financeiros reais.

## Gate de promoção e manutenção
1. `const VERSION`, `package.json` e textos do HTML devem indicar `2.6.0`.
2. O HTML offline deve ser reconstruído reprodutivelmente, com testes de regressão e benchmarks da V2.6.0 aprovados.
3. Somente após CI do commit final, registrar branch `releases/v2.6.0-homologada` no GitHub.
4. O BAT continua apontando para `main`, sem alterar arquivos de backup e saves protegidos. A homologação não executa a atualização no computador do titular.

**Próxima etapa do roadmap:** especificação e implantação V2.7.0 — Crédito, contratos e riscos financeiros, depois de consolidar a evidência de release.
