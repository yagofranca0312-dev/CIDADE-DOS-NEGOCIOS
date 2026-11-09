# Homologação V3.1.0 — Cidade dos Negócios (09/11/2026)

**Status:** aceite formal e explícito do titular para promover e disponibilizar a V3.1.0 no projeto principal, **com ressalva estética aceita**. A confirmação técnica da publicação requer CI da `main` aprovada e checkpoint `releases/v3.1.0-homologada` apontando para o commit final.

## Decisão do titular

O titular solicitou em 09/11/2026: "gere o commit no projeto prinicipal e ja deixe homologado e pronto para que eu atualize, nao gostei exatamente de como ficou a cidade teremos que reconstruila futuramentem porem por agora fica como esta".

**Interpretação operacional:** V3.1.0 fica homologada como está para atualização; a reconstrução visual da cidade é uma **pendência planejada para outro ciclo**, não um bloqueador da release atual. Não afirmar que o visual foi aprovado esteticamente. Não iniciar a reconstrução nesta promoção.

## Identificação e provas

- Versão `package.json`: **3.1.0**; save `schemaVersion=9` (inalterado).
- Pull request integrada: [#44](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/pull/44), fonte validada `b877325b4b129e1122f16fdadd447e8902996e02`, merge `f590c245f1fd253719296239861af845f427bc87`.
- [Linux CI da candidata — SUCCESS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42706999236), no SHA da PR.
- [Windows Chrome/Edge — SUCCESS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42706999663), no mesmo SHA. Incluiu abertura offline `file://`, 320/390/768/1366, cliques em lotes, modais, mudança de câmera, saves e simulações longas em ambiente hospedado.
- A versão jogável continua no `index.html` único, compilado a partir das fontes do repositório. O atualizador Windows lê `main`, não a PR.
- **Etapas finais da publicação:** CI da `main` no SHA definitivo, redirecionamento/validação do snapshot `releases/v3.1.0-homologada`, leitura de confirmação. O comentário de fechamento da PR documentará SHA e evidências finais; não registrar a etapa como feita antes de sua execução.

## Escopo congelado da release

Cidade em tela cheia, HUD e dock, painéis Tycoon e subabas, câmera 100% na inicialização, SVG com letreiro decorativo e sem legenda residual. **Nenhuma remodelagem ou substituição da arte da cidade neste pacote.** Motor de simulação, contas, tributos fictícios e schema de salvamento preservados.

## Riscos expressamente não comprovados

- O titular manifestou insatisfação com a apresentação da cidade e decidiu usá-la provisoriamente. Isto **não é aceite estético**.
- Chrome/Edge Windows foram testados em ambiente de CI hospedado, e mobile emulado; **não** houve teste no PC ou celular físico do titular nem com os saves privados reais.
- Um backup externo tradicional da carreira deve ser feito antes da atualização; migrar apenas após conferência da pasta e do backup. Carreiras antigas e restores pessoais podem apresentar comportamentos não observados em CI.
- A reconstrução da cidade será avaliada separadamente, sem entrar nesta atualização.

## Atualização recomendada no Windows

1. Dentro do jogo antigo, **exportar backup da carreira (JSON tradicional V1)**; se possível, também gerar backup compacto. Guardar em local separado da pasta do jogo.
2. Fechar a aba do jogo e, na instalação já existente, executar `ATUALIZAR_E_JOGAR.bat`, que consulta o SHA atual da `main`, baixa ZIP da revisão, protege `_atualizador`, `saves`, `backups` e faz cópia dos arquivos substituídos.
3. Conferir que o jogo exibe **V3.1.0** e abre a carreira esperada; `JOGAR_OFFLINE.bat` abre sem atualizar.
4. Se ainda não possui os arquivos BAT/PS1 na mesma pasta, baixar o ZIP da `main` do repositório e extrair o pacote completo. Não executar `PUBLICAR_PRIMEIRA_VERSAO.bat`.

## Registro e congelamento

Manter `main` como fonte oficial para o atualizador, `releases/v3.1.0-homologada` como checkpoint histórico e a V3.0.0 em `releases/v3.0.0-homologada` como opção de rollback. Não retroeditar provas técnicas de V3.0 ou afirmar homologação física/visual não realizada. O problema de acabamento da cidade é um item de planejamento futuro sem prioridade/data definida.
