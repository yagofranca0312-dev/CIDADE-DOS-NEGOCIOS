# Implantação V2.4.0-alpha.3 — Patch C: Fiscal Operacional (simulação)
**Base homologada:** V2.4.0-alpha.2, `releases/v2.4.0-alpha.2-homologada`, commit `63fd0218f8e18da209b5cd7d4af154d868d1e03f`.
**Destino autorizado:** `main`. **Patch C:** implementado, testes e homologação prática a verificar.

## Modelo operacional
- Ativação opt-in por estabelecimento, somente da competência corrente do jogo em diante. Sem tarefas anteriores ao primeiro mês ativado.
- A partir do encerramento de cada competência, três tarefas de conferência interna: vendas (dia 5), estoque (dia 8) e razão (dia 12 do mês seguinte). Fechamento administrativo até o dia 15 do mês seguinte.
- Datas são regras do jogo e não equivalem a prazos fiscais oficiais. Tarefas vencidas são visualmente sinalizadas, continuam concluíveis, sem multa ou pagamento automático.
- Fechar requer as três conferências concluídas e reconciliação atual do razão. Captura um resumo gerencial da competência (resultado operacional e fluxo da unidade) em evento auditável.
- As operações `FISCAL_OP.ATIVAR`, `FISCAL_OP.CONCLUIR_TAREFA`, `FISCAL_OP.FECHAR` não geram lançamentos no livro contábil, tributos, receitas, multas, encargos ou guias.
- O antigo cenário tributário didático `FISCAL.ATIVAR_CENARIO` / `FISCAL.PAGAR_SIMULADO` continua independente. Pagamento de tributo só é permitido se o cenário fiscal preexistente tiver apuração aberta, com saldo suficiente; não há tributos por filial.
- Eventos de auditoria persistem os status; schemaVersion continua 9, compatível com saves existentes.
- Listagem no Administrativo → Fiscal, por unidade e competência, com ações de ativar, revisar e fechar.

## Gate
- `npm run check` aprova todos os testes e reproduz o `index.html` sem diferenças.
- Confirmar: nenhuma rotina antes do opt-in; calendário prospectivo; guardas; não duplicar ações; compatibilidade de save; conciliação; pagamentos apenas pelo cenário antigo.
- Após atualização local, o jogador deve verificar em navegador real e homologar o Patch C separadamente.

**Limites:** não gera CNPJ, escrituração fiscal oficial, obrigação acessória, SPED, EFD, PGDAS-D, Reinf, eSocial, DCTFWeb, DARF, DAS, CBS/IBS exigíveis, nem interpreta regime tributário real. Números e datas do checklist são valores fictícios.
