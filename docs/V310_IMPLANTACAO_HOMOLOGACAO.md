# Cidade dos Negócios V3.1.0 — Implantação e homologação

**Fonte:** roadmap HTML V2–V3 v2026.11.04/1. **Autorização:** protótipo e implantação aprovados pelo titular em 08/11/2026.

## Checkpoints 3.1.0-01 a 09
01. Cidade principal, dock e HUD; 02. zoom, pan e câmera em sessionStorage; 03. painéis contextuais sobre o mapa, usando os formulários originais; 04. cinco acessos globais e interface clássica; 05. lotes reais da carreira via read-model puro; 06. tempo comandado pelos botões antigos e notificações de eventos efetivos; 07. mobile com painéis inferiores; 08. teclado, Escape, foco e movimento reduzido; 09. build, testes de Node, Windows Chrome/Edge e regressões.

## Invariantes
Sem segundo dispatch, RNG, cálculo contábil, regra fiscal ou fluxo econômico. schemaVersion=9 preservado. Nenhuma função V3.2 (novos bairros, cenários vivos ou atlas) incluída.

## Homologação
Só promover e criar `releases/v3.1.0-homologada` após CI do SHA exato, QA Windows, merge aprovado, CI da main e readback do checkpoint. Aprovação formal do titular já foi dada para o projeto e sua implantação, **não é prova de testes manuais físicos**. Saves reais privados, celular físico, experiência subjetiva e instalação pessoal ficam fora do alcance da CI e não devem ser declarados testados. V3.0.0 permanece ponto de rollback.
