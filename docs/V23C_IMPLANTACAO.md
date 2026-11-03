# Cidade dos Negócios — Patch V2.3-C — Dashboard e Análises Empresariais

**Base:** `v2.3.0-alpha.2` publicada na main; snapshot `releases/v2.3.0-alpha.2-patch-b-publicada`.  
**Branch:** `feature/v2.3-c-dashboard-empresas`.  
**Estado:** candidata em branch isolada, ainda não homologada.  
**Identificador exibido:** `v2.3.0-alpha.2` durante teste; Patch C não foi versionado definitivamente.  
**Save:** schema 9 preservado; nenhum campo persistente adicionado.

## Entrega C

- Empresas > Dashboard: receitas acumuladas, margem bruta, resultado operacional, resultado após impostos simulados, caixa compartilhado, estoque físico, tributos simulados a pagar e alertas operacionais.
- Empresas > Minhas Empresas: preserva abertura e seleção de unidades; acrescenta busca e filtros por cidade/ramo, margem, estoque e trânsito.
- Empresas > Análises: escopo por grupo, unidade, cidade e ramo; períodos toda a carreira, 7/30/90 dias, mês atual e intervalo personalizado. Tendência de receita e resultado operacional a partir do ledger realizado.
- Empresas > Comparativos: agrupamento por unidade, cidade e ramo, com filtros de período, cidade e ramo; ordenação por receita, resultado, margem ou estoque.
- Diferencia indicadores acumulados, período histórico, estoque atual e valores estimados. Série de toda a carreira mostra até 12 meses visuais, enquanto os KPIs consideram toda a carreira.
- Não há cálculo de tributo por filial, caixa individual inventado, saldo paralelo, projeções automáticas ou criação de CNPJ fictício.
- Leitura do `Core.financialReport` existente; `src/core/game.js` e regras do Patch B não modificados.
- JavaScript e CSS incorporados ao HTML offline reproduzível.

## Validação

1. Conferir os 4 destinos principais e 13 subáreas existentes.
2. Conferir Dashboard com receita, margem, resultado, estoque e alertas reais.
3. Criar/usar 2 unidades, filtrar por cidade e ramo e conferir seleção de filial.
4. Comparar períodos e intervalos personalizados; bloquear data futura/inválida.
5. Confirmar que comparações por unidade/cidade/ramo conciliam receitas e resultado operacional.
6. Verificar que não existe caixa nem tributo artificial por filial.
7. Reexecutar testes econômicos, compras em lote do Patch B, saves/import/export e mapa da Cidade.
8. Testar responsividade em telas pequenas e navegador local Windows.

**Regra:** CI PASS antes de publicar candidata na main; publicação para teste do jogador não equivale a homologação. A homologação funcional exige aceite expresso. Patch D permanece reservado para reorganização definitiva dos departamentos administrativos e integração V2.3 final.
