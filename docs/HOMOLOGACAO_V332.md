# Homologação V3.3.2 — Cidade dos Negócios (12/11/2026)

## Decisão expressa do titular

Em 12/11/2026, após implementação e validação técnica dos quatro patches, o titular ordenou: **“publique no jogo principal, para que eu possa atualizar e ja deixe homologado”**.

**Decisão operacional:** GO expresso para publicar a V3.3.2 no repositório principal, considerá-la a versão estável homologada para uso e disponibilizá-la ao `ATUALIZAR_E_JOGAR.bat`. O titular aceitou que a homologação se fundamente em CI automatizada e no seu GO de publicação, sem exigir teste prévio adicional no computador ou celular pessoal. **Não se deve registrar testes físicos ou de saves privados que não ocorreram.**

## Base e escopo do pacote

- Origem protegida V3.3.1 na `main`, commit `46fe340410ba1efde0a47d36adc8cda32b270cc5`.
- Checkpoint de rollback anterior à publicação: `releases/v3.3.1-pre-v3.3.2`, apontando para o mesmo SHA.
- PRs sequenciais de implantação: [Patch A #48](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/pull/48), [Patch B #49](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/pull/49), [Patch C #50](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/pull/50) e [Patch D #51](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/pull/51).
- **V3.3.2-A**: oito indicadores superiores empresariais baseados no estado real, controles de tempo/câmera reorganizados, zoom nativo e arte proporcional.
- **V3.3.2-B**: dock responsivo, acesso rápido a compras, estoque, preços, finanças e fiscal, agenda com apenas datas existentes no jogo, atalhos sem operações econômicas automáticas.
- **V3.3.2-C**: Central de Gestão e Equipe Empresarial — Gerente de Suprimentos, Controller Financeiro, Analista Tributário —, alertas determinísticos, detalhes/evidência, histórico visual, dispensar e navegação contextual. Regra comercial COM-01 permanece inativa por falta de benchmark comparável.
- **V3.3.2-D**: polimento mobile/desktop, alvos de toque, foco por teclado, janela da equipe recolhível, HUD preenchido em monitores largos e correção da sobreposição do inspetor de lotes à dock em tablet.
- Identificador jogável promovido: `package.json.version = 3.3.2`, `CidadeCore.VERSION = 3.3.2`, HTML `v3.3.2`. **`schemaVersion=10` permanece inalterado**, sem nova migração por essa atualização.
- Distribuição: **`main/index.html`** offline, atualizado pelo `ATUALIZAR_E_JOGAR.bat`, sem instalador ou pasta separada para patch.

## Evidência técnica antes do GO

Candidata cumulativa A+B+C+D validada no commit `5ca017a1b9c0804e456d44d055102a7425468a9f`:

- [Linux — build canônico, testes, benchmark e gates: SUCCESS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/43135249466).
- [Windows hospedado — Chrome/Edge, file://, saves, carreira longa, mobile emulado: SUCCESS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/43135249354).
- [Capturas de UI](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/43135249354/artifacts/13906772988) e [capturas mobile](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/43135249354/artifacts/13907990091).
- As regressões incluíram viewport 320×700, 390×844, 430×932, 768×1024, 1024×768, 1366×768 e 1920×1080, pan/zoom, 18 lotes, navegação, saves, carreira de 365/1.825 dias e integridade do motor.

**Evidência do pacote com identificador V3.3.2 e publicação final:** será registrada com o SHA e a CI da `main` no comentário de fechamento da PR #51 e no checkpoint `releases/v3.3.2-homologada`. Esta seção distingue intencionalmente a CI da candidata anterior à mudança de número da confirmação final pós-merge.

## Proteções e ressalvas da homologação

1. As simulações fiscais e econômico-contábeis são fictícias/didáticas; não correspondem a guias ou legislação tributária real.
2. A Central informa e abre telas, **não compra, paga, altera preços ou liquida obrigações automaticamente**.
3. O histórico de recomendações é **efêmero por sessão**, não é parte do save. Dispensar alerta não baixa passivo.
4. COM-01 (Gerente Comercial de queda de vendas) permanece bloqueada sem janela validada.
5. Não houve teste no computador ou celular físico do titular nem inspeção de seu save pessoal. A CI Windows foi hospedada, com mobile emulado e dados sintéticos.
6. O atualizador faz backup local dos arquivos substituídos em `_atualizador/backups/`; o jogador deve **exportar separadamente backup JSON da carreira antes de atualizar**. Rollback de executável não garante compatibilidade retroativa de saves de versões mais novas, embora esta release não mude schema.
7. O snapshot `releases/v3.3.1-pre-v3.3.2` preserva o estado anterior do jogo.

## Procedimento de promoção

1. Validar `package.json`, `CidadeCore.VERSION` e IDs do HTML em 3.3.2 e `schemaVersion=10`.
2. Regenerar `index.html` com `npm run build`, garantir igualdade de bytes (CI e `git diff --exit-code -- index.html`).
3. Confirmar Linux e Windows SUCCESS no SHA candidato de release.
4. Integrar sequencialmente as quatro PRs, preservando A→B→C→D; executar CI da `main`.
5. Criar checkpoint `releases/v3.3.2-homologada` no commit final da `main` e verificar leitura do SHA.
6. Anexar SHA e evidências da distribuição final à PR #51. Não afirmar publicação concluída se as verificações falharem.

## Como atualizar o jogo principal

Feche o jogo, exporte o backup JSON da carreira e guarde fora da pasta do jogo. Na instalação atual, execute `ATUALIZAR_E_JOGAR.bat`; ele consulta a `main` e baixa a versão homologada. Confirme que a tela de abertura mostra **v3.3.2**. Não execute `PUBLICAR_PRIMEIRA_VERSAO.bat`; ele é histórico e não é o atualizador.
