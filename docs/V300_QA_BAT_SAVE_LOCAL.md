# Cidade dos Negócios — Saneamento P0-03: QA de BAT, atualizador e saves privados

**Data de auditoria:** 07/11/2026 (America/Fortaleza).  
**Branch:** `audit/v3.0-consolidacao-integral-v2-20261107`; PR #39 **DRAFT**, sem merge.  
**Evidência executada:** [GitHub Actions Windows #42434425027](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42434425027), commit `54e1212bde92d513cad5adbf7e1e29a8f53edcbe` — **SUCCESS**, **19/19 verificações de BAT/PowerShell PASS** e, no mesmo runner, **33/33 asserções Chrome/Edge PASS**, hash HTML byte-idêntico PASS.  
**Limitação:** o ZIP, a API e o navegador do atualizador foram **interceptados por fixtures locais**; nenhum endpoint oficial foi consultado por esse teste, nenhum arquivo real de jogador foi lido e nenhum navegador do computador de Yago foi acessado.

## 1. Escopo e separação de risco

Este ciclo **não executou** `ATUALIZAR_E_JOGAR.bat` na instalação pessoal. O atualizador original em `tools/Atualizar-E-Jogar.ps1` segue o `main` do GitHub; atualmente o `main` aponta para **`3.0.0-alpha.1`**, enquanto a **V2.9.0** é a última release formalmente homologada. Assim, executar o atualizador no diretório de uso pessoal **pode promover uma alpha ainda não homologada**, e não é recomendado antes de um release aprovado.

O objetivo foi primeiro provar, em Windows hospedado, a segurança das operações de **instalação isolada, caminho com espaços, backup, erros, downgrade, restore e rollback** sem comunicação com o GitHub real.

## 2. Resultados observados — Windows hospedado

O roteiro [`tools/qa-windows-bat-updater-v300.ps1`](../tools/qa-windows-bat-updater-v300.ps1) usou **os dois BAT originais** e uma **cópia do PowerShell original** em diretórios temporários. Para executar o PS1 sem rede, o processo-filho substituiu somente `Invoke-RestMethod`, `Invoke-WebRequest` e `Start-Process` por funções controladas: a resposta de commit era um SHA fictício, o ZIP já existia localmente e a abertura foi apenas registrada em log temporário.

| Grupo | Provas PASS | Limite da conclusão |
|---|---|---|
| **BAT offline** | `JOGAR_OFFLINE.bat` rejeitou HTML ausente com exit 1; abriu uma cópia fictícia com caminho contendo espaços e exit 0 | Não certifica associação `.html` e janela gráfica no computador do usuário |
| **BAT do atualizador** | Falha quando PS1 ausente; executou PS1 stub da pasta correta e propagou exit 0/2 | Wrapper foi testado; a integração real com o GitHub não foi executada |
| **Atualizador PS1 original** | ZIP artificial aplicado, HTML e novo documento copiados, SHA gravado somente após sucesso | API de GitHub, ZIP e abertura do browser estavam interceptados no processo de teste |
| **Proteção de saves** | `saves/`, `backups/`, `_atualizador/`, `.env`, `*.save.json` permaneceram **byte a byte inalterados** | Prova em arquivos fictícios; não valida o save pessoal |
| **Backup e idempotência** | Cópia do HTML original preservada; mesmo commit não baixou novamente | Dependente da qualidade da amostra e do caminho isolado |
| **Erros e retorno seguro** | Falha de API preservou HTML e exit 2; downgrade recusado; ZIP sem HTML recusado | Não cobre todas as falhas possíveis de rede, disco e permissões |
| **Rollback** | Falha deliberada após início da cópia restaurou HTML original e não gravou a versão; arquivos privados intactos | Não substitui ensaio em disco real com permissão/antivírus próprios |

**Resultado formal:** `V300_WINDOWS_BAT_UPDATER_QA` **PASS**, **19 assertions**. O controle de browser no mesmo workflow repetiu **33/33 PASS** com Chrome 156/Edge 156 e `file://`, mas **em modo headless**.

## 3. Verificador de save pessoal — ferramenta pronta, sem execução em arquivo privado

**Script:** [`tools/validar-save-pessoal-local-v300.mjs`](../tools/validar-save-pessoal-local-v300.mjs).  
**Testes de privacidade:** [`tests/personal_save_private_v300.test.mjs`](../tests/personal_save_private_v300.test.mjs), usando apenas uma carreira fabricada e um arquivo corrompido.

No **clone local** do repositório ou da branch de auditoria, com Node 24 instalado, executar **somente em uma CÓPIA externa** de um save:

```powershell
node tools/validar-save-pessoal-local-v300.mjs "C:\CAMINHO\PARA\COPIA_DA_CARREIRA.json"
```

O script lê o arquivo, valida o envelope/checksum, executa um round-trip com o motor V3 e verifica compatibilidade de invariantes com o motor V2.9 original. Imprime somente **SHA-256, tamanho, schema, resultados técnicos e ressalvas**; não imprime nome do jogador, empresa, movimentações, valores ou caminho completo. Não grava nenhum arquivo, não cria logs e não faz upload.

**Atenção:** um resultado `PASS_LOCAL_INTEGRITY` **não prova** que a importação gráfica, o botão do Windows, o armazenamento local e o rollback completo funcionaram no computador do jogador. A verificação V2.9 do validador é uma verificação de invariantes, não licença para reabrir qualquer save V3 em produção V2.9. A prova com arquivo pessoal **não foi executada** aqui e não pode ser declarada PASS.

## 4. Roteiro seguro que resta no computador pessoal

1. **Antes de qualquer ensaio**, fechar o jogo e exportar o JSON tradicional V1. Guardar duas cópias fora da pasta do jogo. Calcular SHA-256 e verificar se ambas são idênticas. Não colocar o save no GitHub, em issue pública ou em anexos públicos.
2. Usar **pasta separada de teste**, diferente da instalação de uso diário e da pasta V2.9 homologada, com o `index.html` compilado da **branch auditada**, `JOGAR_OFFLINE.bat` e ferramentas. Não usar o atualizador ligado ao `main` para promover alpha no ambiente pessoal.
3. Executar o verificador local acima na **cópia**. Conferir o status e guardar o relatório somente em arquivo privado/local, se desejar.
4. Testar `JOGAR_OFFLINE.bat` em **Chrome/Edge visíveis**, importar cópia de save real, conferir caixa/estoque/competências/eventos/razão, avançar um dia e fechar/reabrir o navegador.
5. Testar `ATUALIZAR_E_JOGAR.bat` **somente com simulador offline/ambiente temporário controlado**, nunca na pasta com o único save pessoal, até haver um atualizador seguro apontando para release homologada.
6. Testar manualmente uma recuperação por backup externo e depois um rollback em **cópia** da V2.9, sem sobrescrever o arquivo original, e registrar diferenças.
7. Registrar SO, versões do Chrome/Edge, SHA-256 do HTML, versão `3.0.0-alpha.1`, capturas sem PII, status `PASS/FAIL/BLOCKED`, riscos residuais e critérios de aceite. Falha gera novo bug/commit, nunca liberação automática.

## 5. Matriz de liberação atualizada, sem promover homologação

- **`RG-09`: `PARTIAL`**. Foi provada a semântica de BAT + PS1 original com ZIP e API **simulados** no Windows hospedado. Não foi realizada atualização online da instalação do usuário nem instalação real da release, e o `main` atual não é uma release homologada.
- **`RG-08`: `PARTIAL`**, pois houve ensaio Windows real hospedado do `JOGAR_OFFLINE.bat` (em arquivo artificial), mas não validação da janela gráfica pessoal.
- **`RG-11`: `NOT_EXECUTED`**. O validador foi criado e testado contra dados sintéticos; **nenhum save pessoal real foi fornecido ou utilizado**.
- **`RG-06/10/12`: `PARTIAL`**, com evidência do Chrome/Edge hospedados da rodada anterior.
- **`RG-13/14/15/16`: `NOT_EXECUTED`** (QA GUI completo, mobile físico, carreira longa e aceite de jogabilidade).
- **`RG-17`: `NOT_CREATED`; `RG-18`: `NOT_GRANTED`**. A versão final V3.0 não foi promovida.

**Decisão desta etapa:** **QA técnico dos instaladores e ferramenta de validação local concluídos**; **homologação geral permanece NO-GO**. A `main`, a release V2.9 e os saves pessoais permanecem intocados. A PR #39 continua DRAFT.
