# Cidade dos Negócios — Patch V2.3-B — Mercado e Reposição Inteligente

**Base:** main / Patch A homologado (v2.3.0-alpha.1; commit 399a37c9d03abbf884f599621f6b6744e054090b).
**Branch:** feature/v2.3-b-reposicao-inteligente.
**Estado:** candidata isolada, não homologada e não integrada à main.
**Versão exibida:** v2.3.0-alpha.1 até homologação específica do Patch B.
**Save:** schemaVersion 9 preservado.

## Escopo

- Mercado > Compras: assistente de pedido consolidado com vários produtos, mantendo a compra individual.
- Mercado > Estoque: link para abastecimento, preservando estoque, meta, cobertura, mínimo e trânsito.
- Modos: somente críticos (estoque físico + trânsito menor ou igual ao mínimo), completar estoque ideal e personalizar.
- Comparação de fornecedores; botões de menor preço e menor prazo; um fornecedor por pedido.
- Quantidades sugeridas via Core.inventoryReport; respeita limites diário/por SKU, teto de 2000 unidades, depósito 100000 e mercadorias pendentes.
- Revisão editável, prévia do custo, caixa compartilhado e saldo após a encomenda.
- Se o custo exceder caixa, bloqueio e ajuste explicitamente solicitado pelo jogador, priorizando menor cobertura e desempate determinístico.
- Somente confirmação explícita emite um único comando COMPRAS.REGISTRAR. Sem compra recorrente automática.
- Timer interrompido ao preparar; proposta invalidada por operação econômica, mudança de unidade ou importação de save.
- Core econômico e fiscal inalterado; sem migração de save.

## Gates

Rodar npm run check (197 testes legados + novos testes B), conferir build reproduzível, validar compra múltipla atômica, limites, ausência de mutação durante proposta, caixa e recebimento. Teste Windows com file:// e persistência de carreira requer validação prática. Nenhuma publicação em main ou homologação sem aprovação do titular.

## Próximas entregas

Após aceite do Patch B, atualizar a versão intermediária e publicar para uso normal. Patch C trará dashboards de Empresas; Patch D concluirá Administrativo e integração V2.3.0.
