# Cidade dos Negócios — Patch V2.3-D — Administrativo

**Base:** V2.3.0-alpha.3 / Patch C homologado.  
**Branch:** feature/v2.3-d-administrativo-departamentos.  
**Status:** implementação isolada para teste, não homologada.  
**Versão exibida nesta candidata:** 2.3.0-alpha.3 (motor preservado até fechamento final).  
**Save:** schema 9, sem migração.

## Distribuição efetiva

- **Finanças:** Tesouraria e fluxo de caixa realizado, categorias de entradas/saídas, obrigações, mercadorias pagas em trânsito, resultado operacional e cenários estratégicos de projeção. Caixa centralizado é exibido apenas para o grupo; contribuições das unidades não viram saldos bancários.
- **Contabilidade:** DRE gerencial, balanço consolidado, resumo contábil, conferência/conciliação e razão dos lançamentos. Painel e livro contábil originais, sem duplicação de IDs.
- **Filtros:** um único conjunto de controles (período, grupo/unidade e datas) compartilhado por Finanças e Contabilidade. Na aba Fiscal ou outras áreas fica oculto; sem mudança de save.
- **Fiscal:** os recursos existentes de demonstração tributária permanecem no setor próprio, sem novas regras fiscais; cenário opt-in e aviso educativo preservados.
- **RH/DP:** espaço declarativo; não simula pessoal, salários, folha ou encargos.
- **Paralegal:** espaço declarativo; não cria CNPJ, inscrições, licenças, atos societários nem custos.
- Navegação legada para Finanças, Fiscal e atalho novo Contabilidade.
- Mercado, Cidade e Empresas permanecem como nas entregas A, B e C.

## Proteções

- Leitura somente: informações de tesouraria calculadas a partir de Core.financialReport e Core.cashFlowStatement, já existentes.
- Core econômico, lógica fiscal, datas, RNG, journal, revisões e estrutura de salvamento não modificados.
- Balanço de unidade não é inventado. O balanço consolidado permanece identificado como relatório do grupo.
- Filtros não alteram carreira. Valores sem equivalente por filial aparecem como Somente grupo.
- O número 2.3.0 final será aplicado depois dos testes e da homologação final do ciclo.

## Gates obrigatórios

1. Build reproduzível do HTML offline, npm run check e testes de departamento.
2. Navegação de cinco departamentos, atalhos legados e filtros compartilhados, com IDs únicos.
3. Valores do caixa e obrigações do ledger, sem tributos/saldo bancário artificiais por filial.
4. Contabilidade: DRE, balanço, razão e conciliação; Fiscal preservado.
5. Regressões completas dos patches A/B/C, saves import/export, mapa e dados econômicos.
6. Testes de interface responsiva em Windows e celular, especialmente as abas internas.
7. Aceite explícito do titular antes da homologação final da V2.3.0.

**Publicação de candidata para teste na main não significa homologação.**
