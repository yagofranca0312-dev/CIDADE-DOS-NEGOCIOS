# V3.0.0 — Auditoria de migração, recuperação e rollback de saves (Etapa 4)

**Data:** 07/11/2026  
**Contrato:** checkpoint `3.0.0-04` do roadmap: carreiras e backups V2, corrupção rejeitada e preservação de saldos, estoque e histórico.  
**Base imutável para rollback:** branch `releases/v2.9.0-homologada`, commit `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`.  
**Candidata sob teste:** `3.0.0-alpha.1` com Patch A, sem aumento de `schemaVersion=9`.  
**Estado do gate:** **AUTOMAÇÃO CONCLUÍDA / QA WINDOWS E SAVES REAIS PENDENTES / NÃO HOMOLOGADO**.

## Evidência técnica reproduzível

O teste `tests/migration_rollback_v300.test.mjs` carrega os motores históricos já presentes em `tests/fixtures` e o motor exato da V2.9 homologada, copiado para:

- `tests/fixtures/core_v2_9_0_homologada.js`.
- Commit de origem `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`.
- **Git blob SHA-1 exato:** `048d174cd2e952d61a255c84c97dbb40dceaf50a`.
- O teste confirma a identidade do blob e sua versão `2.9.0`, antes de executar o rollback.

Não se trata de simulação de compatibilidade por um arquivo inventado: é o código original versionado da release estável, usado em execução isolada (Node VM).

## Matriz automática de origem e destino

| Origem do arquivo | Schema do estado | Formato produzido na origem | Destino V3.0 alpha | Expectativa testada |
|---|---:|---|---|---|
| V1.0.1 | 2 | Envelope V1 | Schema 9 | Preserva journal, eventos, IDs, caixa, estoque, RNG, tempo |
| V1.2.0 / V1.2.1 | 3 | Envelope V1 | Schema 9 | Idem; sem vendas retroativas |
| V1.3.0 | 4 | Envelope V1 | Schema 9 | Idem; ordens/estoque históricos preservados |
| V1.4.0 | 5 | Envelope V1 | Schema 9 | Idem; promoções/campos aditivos |
| V1.5.0 | 6 | Envelope V1 | Schema 9 | Idem; filiais e caixa centralizado |
| V1.6.0 | 7 | Envelope V1 | Schema 9 | Idem; dados regionais legados |
| V1.7.0 / V1.8.0 | 8 | Envelope V1 | Schema 9 | Idem; contabilidade sem recalcular passado |
| V1.9.0 / V2.0.0 | 9 | Envelope V1 | Schema 9 | **Sem migração**, roundtrip idêntico |
| **V2.9.0 homologada** | **9** | **V1 e compacto V2** | **V3.0 alpha** | **Roundtrip idêntico**, inclusive cenário com crédito, CD, RH e filiais |
| **V3.0 alpha com Patch A** | **9** | **V1 e compacto V2** | **V2.9.0 homologada** | **Importação exata e continuidade de dia na V2.9** |
| CP-000 vazio | 1 | Documento JSON legado | V3.0 alpha | Migração permitida sem fabricar capital, vendas ou histórico |
| CP-000 com atividades | 1 | Documento JSON legado | V3.0 alpha | **Rejeitado**, preservando original |

**Limites da evidência:** são fixtures determinísticas do repositório, não arquivos originais de jogadores. A V2.9 homologada foi exercitada diretamente; *não* se afirma que versões anteriores à V2.9 aceitam o compacto V2 ou todos os eventos originados na V3. Carreiras históricas de todas as subversões V2.1–V2.8 não possuem snapshots independentes de cada versão nesta matriz.

### Checks de preservação em cada origem

1. `economy.ledger` integral e na mesma ordem; nenhum lançamento retroativo.
2. `audit.events` e `audit.commands` integrais; IDs/ordem preservados, sem eventos inventados.
3. `calendar.tick/date` e `rng.seed` sem reinicialização.
4. Dinheiro do grupo, receita acumulada, estoque físico e identificador da matriz equivalentes.
5. Após migração, `balanceSheet` e `reconciliationReport` conciliados.
6. Após exportação/importação nos envelopes V1 e V2 compacto, `JSON.stringify(state)` idêntico ao original pós-migração.

## Matriz de corrupção e rejeição

| Problema | Comportamento exigido e verificado no core |
|---|---|
| Alteração de um campo sem recalcular checksum | Rejeitar por divergência do checksum |
| Schema futuro `10`, com checksum recalculado | Rejeitar por incompatibilidade estrutural |
| Estoque físico adulterado com checksum recalculado | Rejeitar por divergência de estoque/contabilidade |
| IDs de eventos duplicados, checksum válido | Rejeitar por duplicação |
| Envelope desconhecido ou codec compacto incompatível | Rejeitar antes de entregar o estado |
| Dicionário compacto inconsistente | Rejeitar na decodificação |
| JSON malformado | Lançar `SyntaxError` e não entregar estado |
| CP-000 com atividade | Rejeitar migração não suportada |

O motor `Core.importSave()` **não recebe a referência do estado ativo e não a substitui**. A troca efetiva do save em uso pertence à camada de interface (`src/ui/app.js`): a UI importa e valida, exige confirmação, tenta preservar cópia anterior, muda o estado temporariamente e procura fazer escrita com leitura de retorno. A integridade e a atomicidade do armazenamento do navegador **não estão comprovadas por testes do core** e exigem ensaio manual por dispositivo/navegador.

## Contratos de rollback

- **V3.0 alpha → V2.9 homologada:** exportar preferencialmente **V1 tradicional**, ou **V2 compacto** se o arquivo tradicional exceder o limite; os dois formatos passaram no teste automatizado diretamente no motor V2.9. O Patch A é indisponível como comando na V2.9, mas um save após compra estratégica foi lido nela sem alteração contábil e continuou por um dia com efeitos equivalentes no cenário testado.
- **V3.0 alpha → V2.8 ou anterior:** **NÃO PROMETER COMPATIBILIDADE PLENA**. O compacto V2 exige V2.9+; exportar V1. Recursos ou eventos criados após a versão de destino podem não ser reconhecidos por executáveis antigos. Testar cópia, não o único save.
- **V2.9 → V3.0 alpha:** não requer migração de schema, preserva os registros e permite continuar. Fazer cópia externa do JSON antes de atualizar.
- **Qualquer downgrade:** versão do executável e esquema do save são conceitos distintos. Igualdade `schemaVersion=9` é necessária, mas **não suficiente** para garantia universal de comportamento em toda carreira.

## Checklist de QA manual obrigatório (NÃO EXECUTADO)

O gate só pode mudar de **PARCIAL** para **PASS** quando houver execução documentada no Windows com um JSON real e uma cópia do executável estável.

- [ ] Registrar Windows, navegador/versão, caminho de `index.html`, SHA-256 do executável e data do teste.
- [ ] No jogo atual, exportar **backup JSON tradicional V1** em pasta externa; conferir arquivo presente e não vazio.
- [ ] Exportar backup **compacto V2** e conferir arquivo independente; não substituir o tradicional.
- [ ] Anotar os valores antes do teste: data, caixa, estoque por unidade, pedidos pendentes, receita, razão, passivos e quantidade de eventos.
- [ ] Importar cópia V2.9 em V3.0 alpha, comparar indicadores, histórico e IDs.
- [ ] Importar cópia V3.0/Patch A em **executável V2.9 preservado em pasta separada**, testar um dia e comparar balancete/eventos; não sobrescrever a instalação.
- [ ] Simular JSON adulterado, sem modificar arquivo válido; confirmar erro e carreira atual preservada após recarregar.
- [ ] Simular tentativa de importação sem armazenamento disponível/quota; confirmar que a carreira anterior é restaurável (inclusive após reiniciar o navegador).
- [ ] Reabrir a página por `file://` no **mesmo** navegador/perfil; validar persistência local. Testar navegador diferente sem assumir compartilhamento de `localStorage`.
- [ ] Confirmar recuperação pelo botão de *carreira anterior* e por importação de JSON externo; conferir que backups não se sobrescrevem silenciosamente.
- [ ] Registrar falhas, capturas, logs e aceite do titular; sem essa evidência **NÃO HOMOLOGAR**.

### Riscos de volume de save

- `src/core/game.js` restringe exportação/importação a **25 milhões de caracteres** de JSON; a UI também bloqueia arquivo acima de **25 milhões de bytes**.
- O benchmark anterior em CI gerou save de aproximadamente **21,3 MB** para cinco unidades e 1.825 dias; o tamanho **não é** garantia de caber em `localStorage`. A quota real varia por navegador, contexto `file://` e dispositivo.
- A interface usa `localStorage` para a cópia corrente e uma cópia anterior; duas cópias grandes podem exceder quota. Sempre manter backup externo, preferencialmente em **dois locais distintos**.

**Conclusão da etapa:** automação de migração/rollback e casos de corrupção completada somente quando confirmada CI verde no SHA correspondente. Checklist manual permanece bloqueador formal do gate `3.0.0-04` e da homologação `3.0.0-08`. Não alterar a `main`, não mudar schema, não publicar release nem homologar por inferência.
