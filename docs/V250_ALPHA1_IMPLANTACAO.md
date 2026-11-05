# Implantação V2.5.0-alpha.1 — Jornada Empresarial

**Data:** 05/11/2026. **Base protegida:** `releases/v2.4.1-homologada`.
**Status de início:** candidato, sujeito a regressões e CI. **Sem homologação da V2.5.0.**

## O que foi implementado
- Relatório puro `Core.progressionReport(state)`, sem gravar estado: constata 4 patamares, 12 metas e 3 selos históricos, derivados de contas, empresas e tempo.
- Progresso de metas de múltiplos requisitos segue a **menor fração satisfeita**; cumprir apenas um dos critérios não basta.
- Vendas exigem classe `SALE` no livro; capital inicial não é receita. Metas financeiras usam saldo `CASH`, registros `REVENUE`, `COGS`, `EXPENSE` e prazo.
- Atalhos de reconhecimento: primeira venda, filial e primeira quitação operacional. Nenhuma premiação financeira, bônus de demanda ou lançamento retroativo.
- Painel recolhível em **Empresas → Dashboard**, com tutorial opcional e evolução demonstrada.
- `schemaVersion=9`; exportação/importação atuais intactas. Não usa rede e continua offline.

## Fronteiras explícitas
- **Não concluídos:** reputação com efeitos, seis dilemas novos, recompensa econômica auditada, testes reais de diversão, QA Windows/browser e V2.5.0 estável.
- Metas propostas são números de design, a calibrar com cenários reais de 30/90 dias; não declarar balanço garantido.
- Marcação de objetivos não ocorre por clique: o resultado vem exclusivamente do estado validado.
- Saves antigos exibem objetivos correspondentes ao histórico já realizado, sem gerar novos eventos no save.

## Gates
- [x] GDD inicial documentado.
- [x] Núcleo de progressão e interface implementados na branch de trabalho.
- [ ] Testes específicos e regressão global da alpha.1: aguardando CI.
- [ ] Reconstrução reprodutível de `index.html`: aguardando CI.
- [ ] Benchmark de 30/90 dias específico para progressão: ainda não registrado.
- [ ] QA manual de leitura da jornada no Windows/navegador: não comprovado.
- [ ] Aceite para homologação da alpha.1: não solicitado/registrado.
- [ ] Gate V2.5.0 final: não realizado.

## Critérios de avaliação por testes
1. Novas carreiras começam no patamar correspondente à abertura e sem venda fictícia.
2. Comprar estoque não conta como vender; vendas reais desbloqueiam o reconhecimento de primeira venda.
3. Avançar o tempo sem receita não concede patamar regional, nem margem positiva.
4. Dois relatórios consecutivos não alteram revision, RNG, ledger ou save.
5. Importar o mesmo save produz os mesmos objetivos e patamar.
6. A atualização não cria novo nível persistido nem duplica o menu principal.

## Procedimento de uso seguro
1. Faça backup JSON da carreira em `Sistema` antes de atualizar.
2. No jogo atualizado, consulte **Empresas → Dashboard → Jornada empresarial**.
3. Compare metas com resultados e calendário. Teste com uma carreira de poucos dias e com uma antiga.
4. Se houver divergência, preserve o JSON e retorne ao checkpoint V2.4.1; não edite manualmente o save.

**Próxima etapa:** corrigir eventuais regressões, registrar CI e balanceamento; somente depois considerar publicar a alpha.1 na `main` para teste.
