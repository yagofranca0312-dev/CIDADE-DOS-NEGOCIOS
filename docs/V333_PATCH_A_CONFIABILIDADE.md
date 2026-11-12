# V3.3.3-A — Contrato de implantação: Fundação e Confiabilidade

**Projeto:** Cidade dos Negócios · **Ciclo:** V3.3.3 A/E · **Base protegida:** V3.3.2 homologada.
**Natureza:** candidata de código, sem publicação. **Não** iniciar B/C/D/E nem alterar a `main` sem GO do titular.

## Objetivo

Criar o motor determinístico único das ocorrências que futuramente alimentarão **Assessores, Agenda Executiva e Ações Rápidas**. Este patch corrige a confiabilidade do núcleo de assessoria, sem alterar as decisões econômicas do jogo.

## Linha de base auditada

- Fonte econômica: `src/core/game.js`; `Core.businesses`, `Core.inventoryReport`,
  `Core.operatingPayablesReport` e `Core.fiscalOperationsReport` permanecem canônicas.
- UI anterior: `src/ui/v31-immersive.part.js` gera avisos na própria camada visual.
- Defeito A-01: estoque era monitorado somente pela unidade ativa e mudança de unidade gerava falsa resolução.
- Defeito A-02: `SUP-01` estoque baixo e `SUP-02` estoque zerado tinham IDs diferentes e a piora poderia ser classificada como resolução.
- Problema adicional: dispensa reabria com qualquer variação de quantidade ou centavos, sem mudança material de situação.
- Agenda V3.3.2 (`v332AgendaItems`) e dock de ações **não serão integrados ainda**: isso pertence aos Patches B/C.

## Contrato de ocorrência (V333-A-1)

Cada ocorrência tem:

`id` único, `category`, `rule`, `role`, `severity`, `phase`, `scope`,
`evidence`, `sourceVersion`, `dateReference`, `signature`, `status`,
`route`, `focus`, `requiresUnit`, `title` e `message`.

- **Identidade independente do estado:** `SUP|businessId|productId`, mesmo quando a regra muda de SUP-01 para SUP-02. FIN-01 por empresa, FIS-01 por guia, FIS-02 por empresa+competência.
- **Escopo completo:** varrer unidades usando *view* rasa do estado com `world.activeBusinessId` virtual por unidade. Nenhuma seleção de empresa nem propriedade do save original é alterada.
- **Gravidade:** `urgente > atenção > informativa`, ordenação determinística com desempate por ID.
- **Assinatura material:** apenas fase, gravidade e regra. Mudança de centavos e pequenas oscilações dentro da mesma condição não reapresentam um alerta dispensado. Agravo material, como estoque zerado, reabre.
- **Histórico efêmero:** `createTracker()` acompanha mudanças dentro da sessão e de um `worldId` exclusivo, limitado a 80 eventos. Não há armazenamento em IndexedDB/localStorage/save.
- **Resolução:** apenas quando a fonte canônica deixa de reportar a condição. Uma troca de unidade não remove a ocorrência, já que o motor examina todas as unidades.
- **Agravamento/melhoria:** transições de prioridade geram evento distinto. Não classificar como resolvida a evolução da mesma condição.
- **Dispensa:** silencia visualmente a ocorrência vigente, não baixa dívida nem cria lançamento. Ocorrências continuam disponíveis internamente para acompanhamento.

## Segurança de navegação

Os cartões agora transportam `data-v332-business-id` quando há empresa específica.
Até o Patch C, se a empresa ativa for diferente da indicada no cartão, o jogo **não executa nem prepara a operação na unidade errada**: informa a divergência e abre a gestão de empresas, exigindo seleção manual. A seleção contextual automática é reservada para o Patch C.

## Limites explícitos

- Não alterar `src/core/game.js`, `SCHEMA_VERSION=10`, `package.json.version=3.3.2`, mecânica fiscal ou cálculos.
- Não persistir novos metadados nos saves.
- Não inventar prazo financeiro nem usar alíquota real: fiscal é simulação.
- COM-01 continua bloqueada sem janelas comerciais auditadas.
- UI de Agenda e Ações Rápidas permanece idêntica; a fonte única será conectada nas próximas microetapas.
- A Central continua sem transações automáticas: compras/pagamentos só mediante confirmação nos formulários existentes.

## Gate A — testes obrigatórios

- A-01: monitoramento simultâneo de duas empresas sem alterar a selecionada.
- A-02: alternar empresa não marca resolução.
- A-03: estoque baixo para zerado conserva ID e gera agravamento sem falsa resolução.
- A-04: diferenciar trânsito de estoque físico; aviso não sugere compra desnecessária.
- A-05: dispensa não baixa passivos, não repete por mudança numérica pequena e reabre por agravamento.
- A-06: regularização real gera resolução uma só vez.
- A-07: carreira diferente não herda avisos nem histórico de outra.
- A-08: FIN-01 sem vencimento inventado; saldo zero encerra a condição.
- A-09/A-10: guias fiscais e checklists por competência respeitam fonte e situação.
- A-11: IDs deduplicados, ordem estável, SEM COM-01 fictício.
- A-12/A-13: leitura no Core real, save schema 10, HTML único e ausência de rede/gravação no motor.
- Compatibilidade: regressões V3.3.2, build Linux, Chrome/Edge Windows, mobile e saves sintéticos.

**Critério de conclusão:** GitHub Actions Linux e Windows inteiramente verdes, documentação e evidências da PR, seguido de aceite do titular. CI verde **não significa homologação**, e PR permanece sem merge na `main`.

## Rollback

`releases/v3.3.2-homologada` aponta para a V3.3.2 vigente. A branch candidata é independente. O atualizador `ATUALIZAR_E_JOGAR.bat` continua recebendo a `main` homologada.
