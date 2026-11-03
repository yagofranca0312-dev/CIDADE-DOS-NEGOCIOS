# Cidade dos Negócios — Patch V2.3-A — Implantação isolada

**Origem:** `releases/v2.2.1-homologada` (`9fbdc2446584c58c4171ebd6db3deaa7ec7c7a7e`).  
**Branch:** `feature/v2.3-a-navegacao`.  
**Status:** aceito e homologado funcionalmente pelo jogador em Windows; versão intermediária `2.3.0-alpha.1` aprovada para publicação na `main` após CI. A V2.3.0 final depende dos patches B–D.  
**Identificação do motor:** `2.3.0-alpha.1` para o Patch A; `schemaVersion=9` preservado. Próximo patch receberá seu próprio identificador pré-final.

## Mudanças

- Quatro abas principais: Cidade, Empresas, Mercado e Administrativo; Configurações permanece ferramenta separada.
- Empresas: Dashboard, Minhas Empresas, Análises, Comparativos. Análises/Comparativos sinalizam futura entrega do Patch C.
- Mercado: Compras, Estoque, Vendas e Outros. Os controles existentes foram relocados, sem mudar as regras de compras. Reposição em lote pertence ao Patch B.
- Administrativo: Finanças, RH/DP, Contabilidade, Fiscal, Paralegal. RH/DP e Paralegal têm placeholders honestos; demonstrativos continuam em Finanças até Patch D.
- Compatibilidade com atalhos existentes para `goto('financas')` e `goto('fiscal')`; Fiscal preserva os avisos e confirmações atuais.
- Navegação apenas em estado efêmero, fora do `GameState`; suporte a teclas de navegação das subabas e barras roláveis em smartphones.
- HTML único offline compilado com os recursos existentes; mapa e assets V2.2.1 preservados.

## Preservação técnica

`src/core/game.js` não foi modificado. `schemaVersion=9`, contabilidade, RNG, regras fiscais, lançamentos e saves não foram alterados. Versão de produto `2.3.0-alpha.1` para a entrega intermediária. Não equivale à homologação final `2.3.0`.

## Testes/gates

Executar `npm run check`, testar 13 subáreas e quatro destinos principais, navegação legada, compra, preço, abertura, Fiscal, filtros, backup JSON e responsividade. A suíte automatizada não prova persistência nativa Windows `file://`; teste prático pendente. **Homologação funcional e pedido de publicação expressos pelo titular em 02/11/2026.** Merge condicionado a CI PASS; integração final V2.3.0 continua exigindo homologação separada.
