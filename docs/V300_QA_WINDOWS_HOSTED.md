# V3.0 — QA Windows hospedado: Chrome/Edge, `file://`, quota e saves sintéticos

**Data:** 07/11/2026 (America/Fortaleza).  
**Natureza da evidência:** **navegadores reais em Windows hospedado no GitHub Actions (headless)**, perfis temporários isolados, **sem acesso ao computador ou a saves pessoais de Yago**.  
**Branch:** `audit/v3.0-consolidacao-integral-v2-20261107`, PR #39 **DRAFT**.  
**Validação funcional observada:** [workflow QA Windows #42432384420](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42432384420), commit `5be38c812b32837fee5741644a8cd0e96c0676ff`. **SUCCESS, 33/33 checagens PASS, Chrome e Edge PASS**.  
**Implementação da prova:** [`tools/qa-windows-browser-v300.mjs`](../tools/qa-windows-browser-v300.mjs), executado por [`.github/workflows/qa-windows-v300.yml`](../.github/workflows/qa-windows-v300.yml). Biblioteca de automação usada **somente no runner**, `playwright@1.55.1` (sem adicionar dependência ao jogo).

## Ambiente e cobertura real

- **SO:** Windows NT 10.0.26100.0, executor Windows 11 hospedado pela GitHub, não instalação doméstica do jogador.
- **Navegadores:** Google Chrome 156 e Microsoft Edge 156 **reais**, modo headless, processos e perfis persistentes separados.
- **Origem do jogo:** `file:///<caminho-temporário>/index.html`, arquivo HTML único offline, sem servidor e sem novos recursos de rede.
- **Dados usados:** carreiras inventadas exclusivamente para QA, incluindo JSON sintético produzido pela cópia do motor V2.9 formalmente homologado. Nenhuma pessoa/empresa real, nem arquivos privados.
- **Integridade:** entrada pela UI real (formulário, HUD de tempo, Configurações, botão Exportar e input Importar), sem simular `Core.dispatch` por fora da aplicação.

### 33 asserções observadas como PASS no workflow #42432384420

Os dois navegadores passaram em:

1. Inicialização `file://` e formulário de carreira;
2. Criação de carreira validada com `Core.importSave` do `localStorage`;
3. Selo de persistência visual após leitura de retorno;
4. Avanço de um dia pelo HUD visível e incremento de `revision`/`tick`;
5. Gravação de calendário/estado no save verificável;
6. **Quota REAL do `localStorage` atingida** por chave QA em origem `file://`, resultando em `QuotaExceededError`, sem mock de armazenamento;
7. **Comando recusado** após quota: save anterior inalterado, data visual não alterada;
8. Aviso explícito de operação **não confirmada**, sem sucesso falso;
9. Após liberar quota, um único novo dia confirmado (sem duplicidade);
10. Fechamento do processo de navegador, reinício com mesmo perfil e recuperação **integral** do save;
11. Exportação pelo botão original em arquivo JSON real no Windows: bytes iguais ao envelope recuperado;
12. Importação pelo input de arquivo em **outro perfil limpo**: estado e envelope preservados;
13. Migração de uma carreira **sintética V2.9** por importação na V3 alpha: `worldId/revision/tick/ledger` preservados;
14. Reabertura pelo motor V2.9 homologado de cópia sintética exportada pela V3: sem divergência de identidade/histórico;
15. Viewport 390 px emulado permanece com `game-shell` visível (**não prova compatibilidade mobile real**);
16. Nenhuma exceção JS fatal observada por navegador.

**Saída estruturada:** `V300_WINDOWS_BROWSER_QA`, 33 verificações, Chrome 156 e Edge 156. Quota artificialmente preenchida **com armazenamento real dos navegadores**, ~5.192.058 caracteres (Chrome) e ~5.192.016 caracteres (Edge) na chave isolada. Esse tamanho depende da quota específica do ambiente e **não é o limite universal de localStorage**.

## Observação técnica sobre SHA-256 e CRLF/LF

A primeira execução funcional gerou no Windows **1.486.310 bytes**, SHA-256 `39bc9a2dd02a122b303bb30a3f8c5f8a2f146d8eb3a3e7be4151954108c7c201`; o Linux havia gerado **1.479.945 bytes**, SHA-256 `3dea7a0560ae97ec6b994a470068ce7d72fd9eff18f07779584ef9095cb8e398`. O `git diff` considerava equivalentes linhas com CRLF/LF, mas os arquivos **não eram idênticos byte a byte**. Não confundir equivalência funcional com reprodutibilidade criptográfica.

**Ação corretiva no branch:** `tools/build.mjs` passa a serializar HTML em **LF canônico** (`replace(/\\r\\n?/g,'\\n')`); [`tools/verify-html-byte-identical-v300.mjs`](../tools/verify-html-byte-identical-v300.mjs) compara **hash SHA-256 de bytes reais** com `git show HEAD:index.html`, ultrapassando a limitação do `git diff`. Os resultados da prova **posterior** devem ser citados separadamente em seus commits e runners. A verificação do hash não é autorização para merge.

## Provas que permanecem pendentes

| Requisito | Evidência recebida | Estado válido |
|---|---|---|
| `RG-06` — proteção de persistência | Falha de quota reproduzida em Chrome/Edge reais e guarda confirmada em Windows hospedado | **PARCIAL**: não substitui modo gráfico do usuário, persistência prolongada e arquivo pessoal |
| `RG-08` — Windows/Chrome/Edge/`file://` e BAT | Chrome/Edge headless e `file://` testados | **PARCIAL**: `JOGAR_OFFLINE.bat` sem execução comprovada |
| `RG-10` — salvar/fechar/reabrir | Reinício real de navegador/mesmo perfil com checksum lógico do save | **PARCIAL**: não é desktop do jogador |
| `RG-12` — quota real e backup | Quota REAL reproduzida, operação recusada e JSON exportado/importado | **PARCIAL**: ainda sem arquivo pessoal nem operação manual do usuário |
| `RG-09` — `ATUALIZAR_E_JOGAR.bat` | Nenhuma execução real | **NÃO EXECUTADO** |
| `RG-11` — save pessoal autêntico | Somente fixture **sintética** | **NÃO EXECUTADO** |
| `RG-13` — QA visual desktop completo | UI navegada parcialmente; sem roteiro integral | **NÃO EXECUTADO** |
| `RG-14` — mobile real | Viewport desktop 390 px, **não aparelho** | **NÃO EXECUTADO** |
| `RG-15` — carreira longa navegador real | Benchmark separado Node/Linux, não longa carreira em browser | **NÃO EXECUTADO** |
| `RG-16` — gameplay e balanceamento integrados | Insuficiente para aceite do jogador | **NÃO EXECUTADO** |

Os outros bloqueios (`RG-05`, `RG-07`, candidata final `RG-17`, aceite `RG-18`) permanecem. A V3.0 ainda é **NO-GO**, a V2.9 continua a última homologada, a PR #39 segue DRAFT e `main` não foi tocada.

## Como repetir o ensaio automatizado (sem alterar a carreira pessoal)

O workflow do GitHub Actions executa automaticamente ao modificar código relevante na PR. Para rodar manualmente no clone Windows isolado, sem inserir saves reais:

```bash
npm run build
npm install --no-save --no-package-lock --ignore-scripts playwright@1.55.1
node tools/verify-html-byte-identical-v300.mjs
node tools/qa-windows-browser-v300.mjs
```

Os browsers Chrome e Edge precisam estar instalados; o script aborta fora do Windows. Os perfis são temporários e excluídos ao final. **Não executar o script a partir da única pasta de jogo com arquivos pessoais sem antes fazer cópias externas.**

### Próximo QA pessoal, não realizado

O roteiro `QA-W01` a `QA-W08` no [parecer da Etapa 8](V300_GATE08_GO_NO_GO.md) permanece a referência para um ensaio com **cópia de uma carreira real**, num Windows físico. Guardar backup JSON V1, registrar tamanho/hash, importar em pasta isolada, verificar saldo/estoque/razão, interromper armazenamento, fechar/reabrir e confirmar recuperação, testar BAT e comparar versões. Nenhum desses resultados deve ser registrado como PASS sem observação.

**Decisão:** avanço real em evidência de navegador e recuperação; **homologação NÃO CONCEDIDA**, pois os bloqueios pessoais e manuais ainda existem.
