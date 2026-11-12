# V3.3.3-B — Agenda Executiva integrada ao motor único

**Status:** CANDIDATA DEPENDENTE DO PATCH A; sem homologação de A ou B e sem promoção a `main`.
**Branch:** `feat/v3.3.3-b-agenda-integrada`, derivada de `feat/v3.3.3-a-central-confiabilidade` (commit `256b9f4cfa45b31e08acfe06518f96c1f43eae2c`).
**Escopo:** microetapa B/E, integração da agenda. Patches C/D/E não iniciados.

## Contrato
- `createV333DecisionEngine.agenda(state,{limit,occurrences})` é leitura pura de compromissos; a UI repassa `createTracker().inspect(state).all` (não a lista filtrada de avisos dispensados).
- `FIS-01` e `FIS-02` são **as mesmas ocorrências** da Central. Cada compromisso da Agenda referencia `occurrenceId`, `scope`, `evidence`, `route` e `focus` do motor A.
- Para `FIS-02`, o prazo da Agenda é a **primeira data válida de tarefa pendente** do relatório canônico de operações fiscais; a data geral do período permanece como contexto separado. Se não houver data verificável, não mostrar como compromisso datado.
- Financiamentos e contratos usam **somente** `Core.financialCommitmentsReport(state,30).events` e tipos `LOAN_SCHEDULE`, `LOAN_DUE`, `SUPPLIER_COMMITMENT`. Cada item preserva certeza, referência, data e valor; `RECOGNIZED_PAYABLES`, folha e `FIN-01` sem vencimento não geram prazo.
- A Agenda mantém até três ocorrências ordenadas como **vencido → hoje → previsto**, por data e ID. Não inventa dia, prazo ou severidade econômica.
- Dispensa da Central é visual/efêmera e **não elimina** compromisso da Agenda; regularização real remove a ocorrência na próxima leitura. Nenhuma compra, pagamento ou baixa é executada.
- Em compromisso fiscal com `businessId` diferente da empresa ativa, o botão indica a unidade e conduz a gestão de empresas antes de navegar; seleção manual. Seleção contextual automática e Ações Rápidas integradas são responsabilidade do Patch C.
- `schemaVersion=10` e `package.json.version=3.3.2`, motor de simulação, mapa, regras tributárias e saves preservados.

## Gate B
- B-01…B-10: identidade e deduplicação, comprovantes e datas, status de atraso, dispensa, troca de empresa, leitura real e ausência de comandos.
- CI Linux: `npm run check`, benchmarks e HTML byte a byte.
- QA Windows hosted Chrome/Edge `file://`, mobile emulado, IndexedDB/saves sintéticos e carreira longa; testes próprios da UI e inspeção de tarefas fiscais.
- Homologação funcional e visual pelo titular pendente. Patch A também permanece sem GO humano.
- Manter PR B como Draft sobre A; não mesclar, não publicar, não antecipar C/D/E.
