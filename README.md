# 🏙️ Cidade dos Negócios 1

**Versão:** `1.0.1-rc.1` — **hotfix de usabilidade da candidata jogável**, homologação estável ainda pendente.  
**Formato:** um `index.html` autônomo, com CSS e JS incorporados; sem internet ou instalação obrigatória para jogar.  
**Data-base do planejamento:** 01/11/2026.

## Hotfix 1.0.1-rc.1

- O lote selecionado aparece em uma etiqueta destacada sobre o mapa, sem sobrecarregar a cidade com 18 rótulos permanentes; cada lote preserva sua identificação acessível.
- A aba Mercado exibe lado a lado **seu preço atual** e a **referência independente do concorrente**.
- Após atualizar o preço, uma mensagem mostra o valor anterior e o novo; o evento já era auditável.
- Não foram alterados economia, formato de save (`schemaVersion: 2`), RNG, regras fiscais ou comportamento do atualizador.

## O que já funciona

- Criar uma carreira em qualquer uma das **30 cidades brasileiras previstas**: 27 capitais/DF, Tianguá, Sobral e Ubajara (Fortaleza já está entre as capitais).
- Explorar um **mapa isométrico fictício** de 18 lotes por cidade, selecionar um lote e abrir uma empresa comercial (mercado, padaria ou loja de roupas).
- Comprar estoque, definir preços, simular vendas diárias e enfrentar concorrência algorítmica básica.
- Avançar 1, 7 ou 30 dias; executar em reprodução automática 1×, 2× e 5× com pausa.
- Consultar caixa, receitas, despesas, custo de mercadorias, estoque e resultado **antes de tributos**.
- Fazer exportação e importação de saves `.json` com checksum, comando idempotente e eventos auditáveis; migração conservadora do save de fundação CP-000 vazio.
- Verificar integridade de estado/ledger no painel Sistema.

**Limites explícitos:** os parâmetros econômicos são **simulados e fictícios**, não estatísticas oficiais das cidades. **Nenhum tributo brasileiro está calculado** neste release; MT-01 informa `NOT_COVERED`, e não alíquota zero. A continuação do calendário após 2033 não representa atualização normativa. Apenas um estabelecimento é operável por carreira neste primeiro corte.

## Jogar no Windows

1. Extraia o ZIP e **abra `index.html` por duplo clique** no Chrome/Edge, ou clique em `JOGAR_OFFLINE.bat`.
2. Crie uma carreira, selecione lote, inaugure empresa, compre estoque e avance os dias.
3. Em **Sistema → Exportar minha carreira**, faça um backup `.json` após cada sessão.
4. Para carregar em outro PC/HTML, use **Sistema → Importar carreira**.
5. O armazenamento local do navegador é uma conveniência; **em `file://` pode variar conforme navegador/caminho**. O backup JSON é o método portátil recomendado.

### Atualizar pelo GitHub

O `ATUALIZAR_E_JOGAR.bat` foi preparado para obter a versão da branch `main` do repositório [CIDADE-DOS-NEGOCIOS](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS). **A V1 RC1 já está publicada no GitHub.** Veja [ATUALIZADOR_WINDOWS.md](docs/ATUALIZADOR_WINDOWS.md).

## Desenvolver

Requer Node.js ≥ 22. Nada é baixado por npm:

```bash
npm run build   # reúne src/core/game.js, src/ui/app.js e src/shell/* em index.html
npm test        # testes de motor, integração estrutural e atualizador
npm run check   # build reproduzível + testes
```

**Não editar `index.html` e `src/` em paralelo:** `index.html` é derivado de `src/` pela ferramenta de build. Os arquivos extras são **fontes/testes**, não necessários para jogar.

### Arquitetura

- C00: um controlador (`CidadeCore.dispatch`), comandos com ID, idempotência e commit lógico.
- M01: estado canônico (`schemaVersion: 2`), 30 cidades, empresa, ledger, calendário, auditoria e cobertura fiscal.
- M02/M04: data única por mundo, demanda e concorrente básico determinísticos.
- M03: eventos confirmados no mesmo commit; consultas não alteram o jogo.
- M05: exportação/importação com checksum FNV1A32 (detecção acidental de corrupção, **não** autenticação criptográfica); armazenamento local de melhor esforço.
- M06: verificação do ledger, estoque e estado, sem reparação silenciosa.
- MT-01: presença de metadados de cobertura sem cálculos legais (`NOT_COVERED`).

## Qualidade e publicação

Os testes automatizados comprovam apenas os cenários executados. Não substituem o ensaio por duplo clique no Windows e um ciclo real de salvamento/reabertura. A marca `rc.1` será mantida enquanto os gates críticos não estiverem validados.

Documentação histórica inicial: [checkpoint CP-000](docs/00_CHECKPOINT_CP000.md), [arquitetura](docs/ARQUITETURA.md), [roadmap](docs/ROADMAP.md), [atualizador Windows](docs/ATUALIZADOR_WINDOWS.md). O **pacote local** inclui as sete especificações e o guia do programador em `docs/especificacoes/`. Esses documentos não entram no publicador inicial por conterem referências a fontes privadas do projeto.

## Privacidade

O repositório identificado está **público**. Não inclua credenciais, saves pessoais ou informações de clientes nos commits. O jogo não envia dados para servidores. Nenhuma licença de redistribuição adicional é concedida neste pacote.