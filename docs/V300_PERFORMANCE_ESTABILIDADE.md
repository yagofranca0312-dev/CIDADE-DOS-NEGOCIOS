# V3.0.0 — Desempenho, estabilidade e limites operacionais (Etapa 5)

**Data:** 07/11/2026 (America/Fortaleza)  
**Escopo:** checkpoint `3.0.0-05` do roadmap original: estabilidade longa, saves, abertura e alternância de painéis e tamanho do HTML único.  
**Baseline de release:** V2.9.0 homologada; código sob teste `3.0.0-alpha.1` com Patch A preservado.  
**Estado:** **AUTOMAÇÃO INSTRUMENTADA / QA REAL DE NAVEGADOR PENDENTE / V3.0 NÃO HOMOLOGADA.**

## 1. Benchmark incorporado ao CI

- **Instrumentação:** `tools/benchmark-v300-consolidation.mjs`.
- **Execução:** `npm run bench:consolidation` (também na etapa nomeada do `.github/workflows/ci.yml`).
- **Proteção estrutural:** `tests/performance_v300_stage5.test.mjs` verifica que checksum do save completo não seja recalculado simplesmente ao abrir Sistema, e que o diagnóstico continue disponível por clique.
- **Fontes medidas:** motor e renderizadores reais da branch, com um **DOM mínimo simulado** e a imagem SVG do mapa substituída por *stub*. São medidas de **CPU JavaScript em Node 24/Linux**, não pintura, layout, FPS, tempo de resposta de input nem velocidade de `localStorage` em um navegador.
- **Casos:** 30 dias/1 unidade, 365 dias/5 unidades e 1.825 dias/5 unidades, com RH e Fiscal Operacional fictícios em uma carreira determinística. Para chegar a cinco unidades, a fixture adiciona capital **somente dentro do teste**; isto não significa que o jogo realize aportes automáticos.
- **Checagens:** saldo e balanço conciliados, serialização JSON tradicional/compacta reversível, zero mutações do snapshot por relatórios e renderizadores, amostras de oito áreas da UI, tamanho do HTML gerado, tamanhos de save e latência por operação.
- **Comparação independente:** benchmark histórico `tools/benchmark-v241.mjs`, 30/365/1.825 dias com 1 e 5 unidades, preservado como era.

### Resultado da primeira medição, antes da correção de navegação

**CI inicial [#42424869357](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42424869357), SUCCESS**, commit `73b1d1b9da2a6124fe3d33b7052f7ed3d08d98ed`. Na época, **361/361 testes PASS**.

| Cenário | Simulação (somente motor) | Exportação tradicional | Compacto reversível | Sistema (média por render sob DOM simulado) |
|---|---:|---:|---:|---:|
| 30 dias / 1 unidade | 18,4 ms | 76.963 bytes | 26.608 bytes | 15,19 ms |
| 365 dias / 5 unidades | 539,9 ms | 4.251.576 bytes | 1.385.051 bytes | 429,47 ms |
| **1.825 dias / 5 unidades** | **9.504,1 ms** | **21.312.692 bytes** | **6.966.345 bytes** | **2.109,96 ms** |

Na carreira de cinco anos, a exportação V1 tradicional levou **2.202,09 ms**, a compactação **2.555,68 ms** e a reimportação V2 compacta **2.748,95 ms** no executor. O custo de relatório isolado permaneceu menor (por exemplo, financeiro **3,89 ms**, QA **6,88 ms**), mas a tela Sistema disparava **`Core.diagnostics(state)`**, cujo checksum `FNV1A32` percorria o JSON inteiro a cada renderização. É uma operação de **integridade**, não uma garantia criptográfica de autenticidade.

### Correção cirúrgica de desempenho

No `src/ui/app.js`, a navegação da aba **Sistema** agora apresenta dados básicos baratos (versão, unidades, data, eventos) e informa que o **checksum é calculado sob demanda**. O botão existente **Executar Diagnóstico** continua verificando o estado, calculando o checksum e mostrando o resultado. Nenhum comando, evento, journal, saldo, save, versão ou schema foi alterado por essa otimização. O `index.html` foi obrigatoriamente regenerado pelo build oficial para permanecer idêntico às fontes.

**Medição posterior:** verificar no log do CI final `BENCH_V3005.panelSamples` do cenário 1.825/5 e anexar comparação antes/depois ao gate. Não interpretar ganho em DOM simulado como comprovação de tempo real no Windows.

## 2. Problemas de volume e seus limites

**Limites observados no código:**

- `MAX_SAVE_CHARS = 25_000_000`: limite de caracteres dos envelopes V1/V2, validado pelo motor.
- Na interface, importação de arquivo acima de **25.000.000 bytes** é recusada; bytes UTF-8 e caracteres JSON não são sempre equivalentes.
- Na carreira de cinco anos/5 unidades, o save tradicional com **21,3 MB** ocupa cerca de **85% do limite de exportação**; o compacto reversível tinha cerca de **7,0 MB** e reduziu o tamanho em **67,5%**.
- O benchmark observou **9.191 registros de journal**, **20.293 eventos**, e **365.065 caracteres** no maior conteúdo HTML de painel escrito pelo DOM simulado. Este número é dado de laboratório, não uma medida real de elementos DOM ou memória de navegador.
- `saveLocal()` salva por padrão o **formato tradicional V1** em `localStorage`; não muda automaticamente para compacto. A disponibilidade e a quota de armazenamento por `file://` são dependentes de navegador.
- `commit()` atualiza o estado em memória e chama `saveLocal()`, mas não desfaz a ação se o armazenamento local falhar. Portanto, em uma carreira grande, pode existir **progresso em memória que ainda não foi persistido**, acompanhado de mensagem de aviso. **Risco de perda de progresso após fechar o navegador** caso o usuário não exporte JSON externo.

**Risco de regressão/decisão:** a compactação preserva histórico, mas também consome CPU e pode exceder quotas locais. Não automatizar exclusão de eventos, redução de precisão, downgrade de schema ou substituição de backup estável somente para reduzir arquivo.

## 3. Crescimento de trabalho da UI

A função `render()` processa componentes de várias áreas mesmo quando a aba principal não está ativa: mapa, grupo, comparações, comércio, rivalidade, fiscal, RH e paralegal. A aba Sistema era especialmente cara pelo checksum completo (corrigido sob demanda). Além disso:

- `renderRH()` monta o histórico de folhas da unidade sem paginação.
- `renderFiscalOperations()` inclui competências abertas sem um limite de paginação, preservando tarefas antigas ainda pendentes.
- `renderFinances()` mostra somente os últimos 8 lançamentos na listagem, embora os cálculos reportem o período completo.
- `renderCredit()` limita a 25 eventos visíveis do calendário, e `renderLogistics()` limita parte das listas; tais limites são **visuais**, nunca cortes do save.
- A navegação do DOM simulado é um indício do custo JS, mas não comprova reflow, pintura, mobile responsivo ou consumo real de heap no Chrome.

**Pendências de engenharia para análise:** renderização condicional de painéis ocultos, paginação/virtualização em listas históricas, diagnóstico sob demanda, tratamento de save local insuficiente, e estratégia de persistência para carreiras muito longas. Não reduzir acesso a tarefas históricas abertas sem solução de paginação.

## 4. Checklist de aceitação manual (NÃO EXECUTADO)

- [ ] Windows: registrar CPU/RAM, versão do navegador, modo `file://`, SHA-256 e resolução de tela.
- [ ] Abrir carreira real curta e longa; medir abertura de Cidade, Empresa, Mercado, Financeiro, Fiscal, RH, Sistema e Logística.
- [ ] Medir alternância entre abas com painel inicialmente oculto, histórico fiscal grande e centenas de folhas.
- [ ] Medir interação responsiva em desktop e mobile, incluindo clique/tap no mapa e altura da página.
- [ ] Abrir/fechar e recarregar o jogo; validar que o estado pós-recarga corresponde ao último comando confirmado.
- [ ] Testar quota cheia ou armazenamento bloqueado, salvar e recuperar backup JSON externo sem perder a carreira anterior.
- [ ] Testar os limites próximos a 25 milhões de caracteres, arquivo de importação >25 MB e backup compacto > quota.
- [ ] Registrar FPS ou tempo de navegação medido em navegador real, capturas, eventuais travamentos e evidência de aceite.

## 5. Critério de gate

- **Automação:** testes e benchmarks reproduzíveis da branch, com métricas por ciclo e por painel, integridade e tamanho. É necessário CI verde no commit de fechamento.
- **Manual:** falta performance e persistência em navegadores/dispositivos reais, inclusive Windows e mobile.
- **Segurança de progresso:** risco de `localStorage` e exportação V1 grandes deve receber aceitação explícita ou correção com regressão.
- **Resultado:** `3.0.0-05` permanece **PARCIAL** até essas pendências. O gate geral `3.0.0-08` permanece **BLOQUEADO**.

**Próxima etapa:** `3.0.0-06`, documentação e tutorial canônicos (README, CHANGELOG, ROADMAP, limites de simulação/tributos), sem apagar a história da V2 ou homologar antecipadamente.
