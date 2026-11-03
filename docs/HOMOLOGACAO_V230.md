# HOMOLOGAÇÃO FINAL — CIDADE DOS NEGÓCIOS V2.3.0

**Data:** 03/11/2026 (horário de Fortaleza).  
**Produto:** Cidade dos Negócios, jogo offline de HTML único.  
**Versão final:** 2.3.0.  
**Estado:** homologação expressamente autorizada pelo titular, condicionada à conclusão do CI e à publicação na main.  
**Base técnica da candidata:** commit 6a8d8ef6a891d2688233734c5f58658b3bf17915, correspondente ao Patch D publicado para teste.  
**Branch de release:** release/v2.3.0-homologacao-final.  
**Destino:** main; criar snapshot releases/v2.3.0-homologada no commit final, após CI PASS.

## Evidência de autorização

Após a conclusão e publicação da candidata do Patch D, o titular respondeu: **"HOMOLOGUE"**. Esta manifestação autoriza a homologação final do ciclo A–D e o versionamento definitivo 2.3.0. Não deve ser interpretada como relatório de testes manuais independentes ou comprovação de cada cenário específico em Windows.

## Escopo homologado (A–D)

| Patch | Resultado efetivamente entregue |
| --- | --- |
| A | Quatro áreas principais, 13 subáreas, roteamento por departamentos e atalhos anteriores compatíveis |
| B | Reposição inteligente e compras de múltiplos SKUs com verificação de estoque, trânsito, fornecedor, caixa e confirmação |
| C | Dashboard, filtros de unidades, análises históricas e comparativos por empresa/cidade/ramo/período |
| D | Tesouraria em Finanças, DRE/balanço/razão/conciliação em Contabilidade, Fiscal preservado e RH/DP e Paralegal informativos |

## Invariantes

- schemaVersion 9, importação e exportação da carreira preservadas.
- Motor econômico e regras fiscais sem alteração de lógica: alteração do identificador VERSION para 2.3.0 apenas.
- Caixa e tributos pertencem ao grupo; nenhuma conta bancária ou tributo é rateado artificialmente a unidades.
- As telas empresariais usam lançamentos realizados; cenários projetados continuam explicitamente sinalizados.
- Pedidos de compra exigem ação do jogador; propostas não executam compras.
- Fiscal didático permanece diferenciado de obrigações reais; RH/DP e Paralegal não simulam salários, encargos ou CNPJ.
- O atualizador normal deve buscar a main, e o jogo precisa abrir offline pelo index.html.
- A reforma tributária ampliada permanece fora do escopo desta versão, reservada ao planejamento V3.0.

## Critérios de publicação

1. GitHub Actions aprova `npm run check` sem falhas.
2. `npm run build` reproduz exatamente o `index.html` commitado, sem diff.
3. A branch final é integrada à main sem conflitos.
4. CI acionado na main confirma build, testes e integridade.
5. A branch imutável de recuperação `releases/v2.3.0-homologada` aponta ao commit homologado; preservadas também as branches históricas v2.2.1 e alpha.3.

## Limites da evidência

A autorização formal foi dada pelo titular na conversa. Os testes automatizados demonstram regressões conhecidas, mas não substituem auditoria visual manual de cada navegador e resolução nem comprovam explicitamente a reimportação da carreira pessoal após esta release. Não alegar tal realização sem registro específico. Se uma regressão for detectada depois, tratar como hotfix versionado e preservar a trilha de homologação.
