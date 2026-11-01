# Atualizador Windows — Cidade dos Negócios

**CP-001 · 2026-11-01 · Integração de atualização local**

## Instruções (uso diário)

Coloque `ATUALIZAR_E_JOGAR.bat`, `JOGAR_OFFLINE.bat` e a pasta `tools/` dentro da mesma pasta que contém `index.html`:

`<pasta do jogo>\cidade-dos-negocios`

Faça **dois cliques em `ATUALIZAR_E_JOGAR.bat`**. O script consulta o commit `main` do repositório `yagofranca0312-dev/CIDADE-DOS-NEGOCIOS`, baixa o arquivo ZIP daquela revisão, substitui apenas os arquivos publicados e abre `index.html` no navegador padrão. Quando a revisão já é a mesma, não baixa o ZIP.

Use `JOGAR_OFFLINE.bat` para abrir o HTML local sem internet.

## O que é protegido

- Não remove arquivos locais extras que não existam no GitHub.
- Não altera `_atualizador/`, `saves/`, `backups/`, `.git/`, `node_modules/`, `.env` e arquivos `*.save.json` e `*.backup.json`.
- Antes de substituir um arquivo diferente, cria uma cópia em `_atualizador/backups/<data_hora>/`.
- Se ocorrer erro de cópia, tenta reverter os arquivos da operação e abre o jogo local se existir.
- Guarda o SHA do commit instalado em `_atualizador/versao.txt`.
- Não faz upload de nenhum dado para o GitHub. Somente consulta e baixa arquivos públicos.

## Limitações e segurança

- Testado estruturalmente, mas **a execução real no Windows da máquina do usuário ainda depende de teste local**.
- Requer Windows com PowerShell 5.1+ e internet para atualizar. Não requer Git instalado.
- O jogo continua sendo um único arquivo HTML independente; os scripts servem somente para instalação e atualização.
- O atualizador segue `main`, que é uma linha de desenvolvimento. Apenas commits aprovados deveriam entrar em `main` para que as atualizações sejam seguras. Idealmente, no futuro, mudar para releases assinadas/tags estáveis.
- GitHub atualmente público. Não enviar segredos ou saves pessoais ao repositório.
- Arquivos locais que possuam o mesmo nome dos publicados podem ser substituídos, com cópia de backup. Arquivos de dados pessoais devem permanecer nos locais protegidos.
- Se o GitHub estiver indisponível, o jogo anterior abre localmente, e o atualizador avisa que não está atualizado.

## Solução de problemas

- Se `index.html` não abrir, confira se os executáveis `.bat`, a pasta `tools` e o HTML estão todos dentro da pasta indicada.
- Se surgir erro de rede, confira acesso a `github.com` e `api.github.com`.
- Se a cópia falhar por permissão, feche editores que possam bloquear os arquivos e tente novamente.
- Se a janela fechar com erro, abra um Prompt de Comando na pasta do jogo e execute `ATUALIZAR_E_JOGAR.bat` para observar a mensagem.

## Primeira publicacao no GitHub (apenas uma vez)

**Registro histórico:** o script `PUBLICAR_PRIMEIRA_VERSAO.bat` foi criado quando o repositório estava vazio. **A V1 RC1 já foi publicada diretamente no GitHub. Não execute o publicador inicial novamente.** O script, agora legado:

1. Confirma que a conta/repo corresponde ao repositorio esperado e que `main` ainda esta vazia.
2. Solicita confirmacao explicita para publicar o codigo em repositorio PUBLICO.
3. Verifica todos os arquivos permitidos, inicializa Git local e cria commit da fundacao.
4. Executa `git push -u origin main`, usando Git Credential Manager para login quando necessario.
5. Nao executa `--force`, nao apaga arquivos e **nao inclui saves/arquivos pessoais**.

Se falhar por falta de configuracao de identidade: no terminal, configure seu nome e email no Git (`git config --global user.name ...` e `git config --global user.email ...`) e execute o publicador novamente. Nao e necessario compartilhar essas informacoes pelo chat.

Se o repositorio ja tiver commits, o publicador recusa a primeira publicacao para proteger o historico e indica que sera preciso sincronizar pelo fluxo Git normal.
