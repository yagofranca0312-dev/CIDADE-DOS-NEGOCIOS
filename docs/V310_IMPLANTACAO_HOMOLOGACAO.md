# Cidade dos Negócios V3.1.0 — Implantação e homologação

**Fonte:** roadmap HTML V2–V3 v2026.11.04/1. **Autorização:** protótipo e implantação aprovados pelo titular em 08/11/2026.

## Checkpoints 3.1.0-01 a 09
01. Cidade principal, dock e HUD; 02. zoom, pan e câmera em sessionStorage; 03. painéis contextuais sobre o mapa, usando os formulários originais; 04. cinco acessos globais na dock, sem modo clássico; 05. lotes reais da carreira via read-model puro; 06. tempo comandado pelos botões antigos e notificações de eventos efetivos; 07. mobile com painéis inferiores; 08. teclado, Escape, foco e movimento reduzido; 09. build, testes de Node, Windows Chrome/Edge e regressões.

## Invariantes
Sem segundo dispatch, RNG, cálculo contábil, regra fiscal ou fluxo econômico. schemaVersion=9 preservado. Nenhuma função V3.2 (novos bairros, cenários vivos ou atlas) incluída.

## Homologação
Só promover e criar `releases/v3.1.0-homologada` após CI do SHA exato, QA Windows, merge aprovado, CI da main e readback do checkpoint. Aprovação formal do titular já foi dada para o projeto e sua implantação, **não é prova de testes manuais físicos**. Saves reais privados, celular físico, experiência subjetiva e instalação pessoal ficam fora do alcance da CI e não devem ser declarados testados. V3.0.0 permanece ponto de rollback.

## Retificação visual V3.1.0 (solicitada após PR #43)
A interface ERP em mapa encaixado não atende à fundação de tela única. Esta alteração substitui a disposição antiga por viewport 100% da tela, câmera com pan/zoom em coordenadas SVG, HUD e dock sobre a cidade, modais centrais com backdrop/Escape e toast em camada superior. O motor, schema 9 e backup permanecem inalterados; expansão de bairros e atlas continuam na V3.2.0. **A homologação visual da correção depende da validação do titular no navegador.** A PR #43 e o checkpoint original permanecem preservados como histórico.

## Acabamento city-first v3.1.0 — sem modo clássico
Barra lateral e botões de alternância retirados do HTML e da lógica. Onboarding em cartão compacto centralizado, com arte de fundo; controles do mapa separados do HUD. Janelas de Empresas, Mercado, Administração e Configurações usam título integrado a trilho fixo de abas iconizadas, com seleção iluminada. Cada subaba apresenta primeiro quatro KPIs confirmados do Core, seguidos do conteúdo operacional preservado. Relatórios, saldos e estoques são fatos da carreira simulada, não estimativas de alíquotas ou ponto de equilíbrio. A etapa de QA inclui 14 subabas e capturas desktop/mobile emulados. **Aceite visual do titular continua pendente e é requisito para homologar a revisão.**
