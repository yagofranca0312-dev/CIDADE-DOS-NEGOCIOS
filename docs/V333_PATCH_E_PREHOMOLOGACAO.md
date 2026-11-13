# V3.3.3 — Patch E/E · Qualidade e pré-homologação global

**Status documental:** `NO_GO_RELEASE` até autorização expressa do titular. Este documento não registra homologação nem publicação.

## Escopo acumulado

- Patch A — confiabilidade das ocorrências por empresa, IDs estáveis e histórico efêmero.
- Patch B — Agenda Executiva com origem canônica; FIN-01 sem prazo permanece fora da Agenda.
- Patch C — navegação contextual com `EMPRESA.ATIVAR` persistido, sem executar compras/pagamentos/preços.
- Patch D — Central de Operações com Equipe, Agenda, Ações, filtros e acessibilidade/responsividade.
- Patch E — auditoria cruzada, testes adversariais adicionais, proteção de fontes estáveis, gate documental e roteiro de aceite.

## Defeito encontrado e correção pontual (E-DEF-001)

Na Central expandida, se há ocorrências ativas globalmente mas o filtro de severidade/empresa retorna zero, o código tentava acessar `visible[0].severity`. Isso podia lançar erro e interromper a UI. O Patch E altera apenas a guarda visual para `visible.length?visible[0].severity:'normal'`. Sem efeito no Core, save, mapa, datas ou pendências.

## Invariantes verificados

1. Estado econômico, fiscal, ledger, estoques e seleção da unidade só mudam em comandos explícitos existentes, não ao abrir abas, filtrar, dispensar ou consultar.
2. Históricos/dispensas em memória são separados por `worldId`, não migram entre carreiras ou gravações. Um compromisso datado mantém visibilidade na Agenda quando a recomendação é dispensada.
3. Estoque abaixo do ponto e estoque físico zerado preservam identidade única de produto; mudança de unidade não gera falsa resolução.
4. Passivo operacional sem data não ganha vencimento; FIS-01/FIS-02 somente com data registrada, fontes financeiras `Core.financialCommitmentsReport`.
5. Ações contextualizadas mantêm unidade, produto e rota, falham de forma segura para ocorrências desatualizadas, e exigem confirmação para qualquer transação.
6. `index.html` é executável offline, gerado de fontes auditáveis e com identidade de bytes Linux/Windows.
7. Fontes protegidas (Core, economia, cena, loteamento, IndexedDB, versão publicada e atualizador) têm blobs imutáveis identificados em `V333_RELEASE_READINESS.json`.
8. HTML da V3.3.3 candidata **permanece com cabeçalho/versão de distribuição V3.3.2 até GO**. Sem modificar `schemaVersion=10` nem introduzir migrações.

## Gate automatizado

- Linux: `npm run check`, regressões antigas e E-01…E-14, benchmarks e `node tools/v333-release-gate.mjs`.
- Windows: Chrome/Edge offline `file://`, suíte C/D, QA específico E, BAT/rollback, migração IndexedDB, mobile emulado e carreiras de 365/1.825 dias.
- O gate E produz `NO_GO` intencionalmente sem autorização expressa. `node tools/v333-release-gate.mjs --require-go` deve recusar o release até evidências documentadas, versão final e permissão de publicação.
- Os relatórios do GitHub Actions devem ser associados ao **SHA final** desta PR; uma falha histórica em SHA superado não aprova nem invalida sozinha a candidata corrigida.
- Auditoria não é confirmação de que saves pessoais, PC e celular físicos foram testados.

## Roteiro de aceite funcional pelo titular

1. Exporte o backup JSON da carreira atual da V3.3.2; guarde cópia fora da pasta do jogo.
2. No GitHub, obtenha apenas o `index.html` candidato da branch E; abra diretamente no navegador Chrome/Edge, **sem executar o atualizador ou substituir a instalação principal**.
3. Teste primeiro em uma carreira sintética: duas empresas, avisos de estoque das duas, filtro que oculta todos os avisos, volta para “Todas” e abre Equipe/Agenda/Ações.
4. Dispensar um aviso deve ocultá-lo somente da Central; o histórico registra a dispensa e nenhuma operação econômica é disparada. Checklists fiscais datados continuam na Agenda.
5. Em outra unidade, clique no aviso de estoque; a empresa de destino e o produto devem aparecer corretos. Não confirme compras. Volte ao mapa, teste 18 lotes, zoom e visualização.
6. Feche e reabra o HTML; confirme que a carreira e a movimentação econômica permanecem preservadas. Repita no celular físico se for critério exigido.
7. Abra `ATUALIZAR_E_JOGAR.bat` **somente depois de publicação homologada**, nunca com a candidata em Draft.
8. Se aceitar a CI hospedada no lugar dos testes físicos, declare isso explicitamente, sabendo que nenhum dispositivo nem save privado foi validado.

## Decisão

**Código testado ≠ homologação.** Após CI Linux+Windows no SHA final, o Patch E pode receber `TECHNICAL_PASS` e ficar preparado para GO do titular. Promoção exige autorização explícita para publicar a V3.3.3; somente então criar commit de versão 3.3.3, recompilar HTML, revalidar CI, integrar PRs A→E em ordem, proteger rollback V3.3.2 e criar checkpoint estável.

**Até lá:** PRs #52–#56 em Draft, nenhuma integração em `main`, tag, release, mudança de versão nem update do jogo principal.
