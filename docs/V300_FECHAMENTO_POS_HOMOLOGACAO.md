# Cidade dos Negócios — fechamento técnico pós-homologação V3.0.0 (08/11/2026)

**Situação da versão:** V3.0.0 já HOMOLOGADA POR EXCEÇÃO pelo titular na PR #41, `main` e `releases/v3.0.0-homologada` no commit `7f18cb97c69ced792afd186c450b0206a2e6e1b9`. A homologação ordinária continua registrada como NO-GO histórico (5/18 requisitos verificados). Este lote **não reescreve nem reaplica a release original**.

## Missão do lote consolidado

Reunir o controle pós-release num único ciclo Linux + Windows em CI, de modo a não confundir execução de testes sintéticos com prova de QA no computador do jogador. A matriz histórica `docs/V300_READINESS_EVIDENCE.json` e o termo `docs/V300_OWNER_EXCEPTION.json` ficam preservados. Não alterar motor, `schemaVersion=9`, saves, economia, tributação fictícia, read-model de V3.1 ou o HTML executável.

## Evidência técnica já disponível (em SHA anterior, CI concluída)

- Linux: 431/431 testes de regressão, benchmark e build aprovado — [workflow](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42507651867).
- Windows hospedado: 19/19 BAT/PS1 com rede simulada, 33/33 armazenamento e browsers, 66/66 fluxos empresariais, 12/12 migração IndexedDB, 6/6 mobile emulado e 4/4 cenários de carreira de 1.825 dias — [workflow](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42507651978).
- `main` promovida: [CI após merge aprovada](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42511043677).
- A auditoria por contrato `npm run audit:postrelease` adiciona relatório legível por máquina, validado nos testes Node. No Windows o resumo é arquivado como artifact quando o workflow realmente executar e concluir.

## Delimitação exata dos requisitos

| Grupo | Verificação no repositório/CI | Permanência da lacuna |
|---|---|---|
| RG-05 | Matriz de integração e gates verificada por scripts e testes existentes | Cobertura operacional humana integral não comprovada |
| RG-06 e RG-12 | Persistência fail-closed, quota e readback: suítes Windows hospedadas | Falhas físicas, permissões e instalação do jogador não reproduzidas |
| RG-08/09/10 | `file://`, BAT, atualização sintética, fechar/reabrir e migrar | Atualizador pessoal real e instalação Windows pessoal não certificados |
| RG-11 | Migração de fixtures da V2.9 até V3.0 automatizada | **Save privado autêntico NÃO testado** |
| RG-13 | Navegação de menus e fluxos reais em Chrome/Edge headless | Inspeção visual humana completa e máquina pessoal pendentes |
| RG-14 | Mobile emulado 320/390/768px com toque e screenshot | **Dispositivo físico NÃO testado** |
| RG-15 | 365/1.825 dias com IndexedDB em browsers hospedados | Carga e hardware pessoais não testados; 21,2 MB de exportação em 5 unidades |
| RG-16 | Testes de consistência econômica e rotas integradas | **Diversão e balanceamento orgânico não homologados por observação humana** |

**Aprovação de auditoria de repositório não converte `PARTIAL` ou `NOT_EXECUTED` em `VERIFIED`.** Se a CI do novo commit falhar, este lote continua não liberado. Caso aprove, o saneamento de governança/testes fica tecnicamente concluído, mas as provas físicas e pessoais permanecem pendentes ou dispensadas pela autorização anterior.

## Baseline para a V3.1

A V3.1 pode iniciar em branch separada a partir do código integrado e CI aprovada, sem tocar no checkpoint imutável `releases/v3.0.0-homologada`. O primeiro trabalho é `3.1.0-01` — protótipo city-first — usando `docs/V300_CONTRATO_UI_V31.md`, e sem criar segundo motor contábil/econômico.

**Controle final:** ao terminar, registrar a URL do PR, SHA e ambos workflows neste documento ou no PR. Não criar uma nova marca `18/18` e não fechar a issue #40 sem decidir explicitamente o critério de QA pessoal pendente.
