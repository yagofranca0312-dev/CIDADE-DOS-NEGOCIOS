# Homologação formal — Cidade dos Negócios V2.7.0

**Data do aceite:** 05/11/2026 (America/Fortaleza).
**Titular:** Yago França da Silva.
**Manifestação explícita:** “homologue” após entrega e integração da V2.7.0-alpha.1.
**Objeto:** promoção da candidata testada `2.7.0-alpha.1` para `2.7.0`, sem alterações das regras econômicas ou fiscais.
**Classificação:** HOMOLOGAÇÃO FORMAL DO TITULAR, com **ressalvas de QA manual**.

## Evidência objetiva na candidata

- PR #32 integrado à `main`, commit `88d5046fda450ab15c886ca065181239a05a4ee0`.
- CI do commit na `main`, execução `42136048056`: **SUCCESS**, incluindo `npm run check`, benchmark histórico e verificação de `index.html` reproduzível.
- CI integral da candidata, execução `42135780283`: **SUCCESS**, com **290 testes aprovados, zero falhas**, benchmarks históricos (V2.4.1), concorrência (V2.6) e financiamento (V2.7).
- Três cenários financeiros com financiamento e fornecedores: 97 dias, 372 dias e 1.832 dias (incluindo os 7 dias iniciais de elegibilidade), com save round-trip, conciliação de estoque e balanço, e sem injeção artificial de capital.
- Motor contábil e `schemaVersion 9` preservados; saves antigos não recebem financiamentos ou passivos retroativos; `economy.financing` é opcional.
- V2.6.0 está preservada no checkpoint `releases/v2.6.0-homologada`, anterior à promoção.

## Declaração de aceite

A solicitação “homologue” é autorização suficiente do titular para registrar **aceite formal de release**. A homologação não representa confirmação de testes manuais inexistentes nem execução de atualização no computador do titular.

## Ressalvas e riscos remanescentes

1. Não foi fornecida prova de execução prática no Windows por `ATUALIZAR_E_JOGAR.bat`, abertura do jogo `file://`, persistência real do navegador, dispositivos móveis ou testes de interface com jogador.
2. A análise automatizada verifica integridade, não prova adequação econômica, diversão ou sustentabilidade de estratégias; os cenários prolongados incluem caixa baixo e encargos em atraso.
3. Empréstimos e contratos são **simulações fictícias** do jogo; não existem obrigações financeiras, bancárias ou fiscais externas.
4. Exportar e preservar backup JSON antes de atualizar o jogo. A versão V2.6.0 permanece disponível para rollback, ainda que não seja promessa de compatibilidade reversa perfeita com novas operações V2.7.

## Gate técnico da promoção

1. Atualizar motor, `package.json`, HTML-base e testes da versão para `2.7.0` sem alterar os parâmetros econômicos.
2. Recompilar o `index.html` offline e verificar resultados de `npm test`, `npm run bench:stability`, `npm run bench:competition`, `npm run bench:finance`.
3. Confirmar CI da `main` após merge final com `git diff --exit-code -- index.html`.
4. **Somente após o passo 3**, criar `releases/v2.7.0-homologada` no SHA do merge final.
5. A homologação formal não altera automaticamente saves locais, não remove backup e não confirma QA Windows.

**Próxima ação prática recomendada:** usar o BAT com backup JSON e validar manualmente juros, amortização, inadimplência, renegociação, contratos de fornecedores, rescisão e saldos antes de dar a QA manual como encerrada.
