# V3.3.2-B — Dock, ações rápidas e agenda

Status: **IMPLEMENTAÇÃO CANDIDATA** sobre a candidata V3.3.2-A, mantendo `main` na V3.3.1. Contrato `CDN-CONTRATO-V332-001`, Gate B.

## Diferenças do Patch A
- Dock desktop: comandos `Empresas`, `Mercado`, `Compras`, `Estoque`, `Financeiro`, `Fiscal`, `Preços`, `Administrativo`, `Relatórios`, `Configurações` e `Mais`.
- Mobile: dock legível, com os cinco destinos originais preservados e `Mais` para departamentos complementares.
- Inferior esquerdo: **Agenda & Ações Rápidas** recolhível, 4 botões para `Repor Estoque`, `Pagar Contas`, `Preços`, `Fiscal`.
- Rotas verificadas: `mercado:compras` + `#restock-assistant`, `mercado:estoque`, `mercado:outros` + `#price-form`, `administrativo:financas` + `#payable-operating-form`, `administrativo:fiscal`, `administrativo:contabilidade`, `sistema:saves`.
- O roteador de atalho apenas abre modal/aba e tenta focar a ação. Não emite `Core.dispatch`, compra ou pagamento.
- Sem empresa ativa nos atalhos dependentes: mensagem explicativa e abertura do dashboard de empresas; sem operação silenciosa.
- A agenda enumera somente datas verificáveis: prestações/contratos da API `financialCommitmentsReport`, guias `fiscal.assessments` e checklists da API `fiscalOperationsReport`. Histórico e passivos sem prazo *não* são rotulados como vencimentos.
- Navegação mobile com barra horizontal quando necessário. Respeita o dock e a proporção nativa do SVG, sem zoom/corte.
- A metade inferior direita fica livre para a Central de Gestão do Patch C; não há nova recomendação implementada nesta fase.

## Aceitação e Gates
- **B-01** abrir preços / reposição / fiscal / finanças em no máximo dois toques a partir do mapa (sem seleção de empresa);
- **B-02** alternar lotes e retornar ao mapa com foco preservado;
- **B-03** sem empresa, redirecionamento claro;
- **B-04** agenda restrita a vencimentos respaldados;
- **B-05** não alterar save ao abrir/fechar menus/agenda;
- **B-06** Chrome/Edge Windows + mobile emulado + build, regressões e carreira longa;
- **B-07** inspeção visual pessoal do titular e GO explícito antes do Patch C/merge.

A versão exibida permanece **3.3.1**, pois o release 3.3.2 requer todos os gates previstos. Nenhum patch C será iniciado automaticamente.
