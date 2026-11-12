# V3.3.2-C — Central de Gestão: contrato de implantação e Gate C

**Projeto:** Cidade dos Negócios · **Contrato:** CDN-CONTRATO-V332-001 · **Data:** 11/11/2026
**Estado:** implementação candidata sobre `feat/v3.3.2-b-atalhos-agenda`, sem publicação.
**Invariantes:** V3.3.1 publicada imutável; schema 10; nenhum comando econômico, nova alíquota, compra, pagamento ou mudança de preços disparada pela equipe.

## Objetivo
Oferecer uma **Central de Gestão** com nomenclatura empresarial privada, mensagens inteligíveis e comprováveis, evidência por regra, prioridade, ações contextuais e histórico visual.

## Motor de recomendações
- **SUP-02**: produto da *unidade ativa* com estoque físico igual a zero; distinguir mercadoria em trânsito. Urgente sem trânsito, atenção com trânsito.
- **SUP-01**: estoque físico positivo, porém `Core.inventoryReport.alert === true`; o relatório canônico já considera estoque em trânsito. Ações: `mercado:compras` e `#restock-assistant`.
- **FIN-01**: saldo operacional pendente por unidade em `Core.operatingPayablesReport`. Não há vencimento confiável: nenhuma data é inferida. Ação: `administrativo:financas` e formulário `#payable-operating-form`.
- **FIS-01**: `fiscal.assessments` em status OPEN/OVERDUE com `amount > paid`; guia vencida somente quando `dueDate < calendar.date`. Ação: `administrativo:fiscal`.
- **FIS-02**: tarefas de `Core.fiscalOperationsReport` não concluídas, agrupadas por estabelecimento e competência. Severidade urgente somente com tarefa `ATRASADA`; não confundir checklist educacional com exigência legal real.
- **COM-01**: **DEPENDÊNCIA — NÃO ATIVADO**. Falta validação de janela de comparação de vendas por produto com dados observados suficientes, evitando aviso especulativo de baixa saída.
- **Nomenclatura na interface:** Gerente de Suprimentos, Controller Financeiro, Analista Tributário. Gerente Comercial reservado para COM-01 fundamentado.

Cada registro inclui `id` estável por regra/unidade/objeto, papel, severidade, evidência, data da carreira, rota existente, status e assinatura material. Ordenação: urgente > atenção > informativa; mesma regra não repete cards no mesmo estado. Quando muda a evidência, um aviso anteriormente dispensado pode reaparecer.

## UI e comportamento
- Desktop: prévia compacta da equipe na área inferior direita, onde o Patch B reservou espaço, com expansão temporária.
- Mobile: prévia recolhível, painel completo acima da barra inferior quando solicitado. Sem deixar mapa permanentemente coberto e sem mudar a razão 1536×664.
- Indicador superior **Alertas de Gestão**: quantidade **visível e ativa**, distinta dos eventos históricos.
- Ações: **Ver equipe**, **Ativas/Histórico**, **Detalhes** (evidência), **Ir à ação** (apenas navegar), **Dispensar** (somente visual).
- Ao detectar condição resolvida, retirar da lista ativa e adicionar ao histórico visual como resolvida.
- **Persistência do histórico:** somente em memória durante a sessão e por `worldId`; não há escrita em save, IndexedDB, localStorage ou sincronização. Ao atualizar/reabrir, o histórico visual recomeça. Isso é uma limitação explícita, não erro de contabilidade.
- Limite de exibição expandida: 50 mensagens; o indicador contabiliza todas as recomendações ativas não dispensadas. Histórico visual restrito aos 80 registros recentes da sessão.
- Estado vazio: **Nenhuma ação prioritária identificada neste momento.** Isso não certifica inexistência de risco.
- Não usar pop-ups automáticos repetitivos, notificações push ou notificações geradas por IA. O alerta surge naturalmente na prévia/contador quando o estado muda.

## Validações obrigatórias — Gate C
1. **REC-01**: estoque físico zero, em trânsito, reposição real; não duplicar SUP-01 e SUP-02.
2. **REC-02**: guia simulada OPEN/OVERDUE exibe aviso; PAID/SETTLED ou saldo zero remove.
3. **REC-03**: FIN-01 não exibe dia de vencimento inexistente.
4. **REC-04**: carreira sem unidade nem pendência não recebe falsa urgência.
5. **REC-05**: IDs estáveis, sem spam em renders repetidos, severidade correta e causa resolvida no histórico.
6. **SAFE-01**: abrir Central, abas, detalhes, dispensar, acionar atalho e voltar ao mapa não mudam revisão/ledger/save.
7. **A11Y/UI**: foco, Escape, cartões legíveis, mobile 320/390/768, desktop 1366/1920, painel recolhível sem deformar mapa.
8. **OFF/REG**: `npm run check`, Chrome/Edge Windows, persistência IndexedDB, carreiras longas e HTML offline canônico.

## Critério de aprovação
**CI verde é somente TESTADO TECNICAMENTE.** Para autorização de D, titular precisa conferir a experiência no navegador e dar GO. Não realizar merge na `main` e não alterar a tag da versão por conta própria.

## Retrocesso
`main` V3.3.1 commit `46fe340410ba1efde0a47d36adc8cda32b270cc5`; Patch A PR #48, Patch B PR #49. A candidata C se baseia no HEAD da branch B e sua PR deve usar **B como base**, para não misturar gates.
