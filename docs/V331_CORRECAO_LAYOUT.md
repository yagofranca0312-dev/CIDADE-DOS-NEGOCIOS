# Cidade dos Negócios · V3.3.1 · Correção de layout (microetapa)

**Pedido do titular — 10/11/2026.** Reverter o mapa ampliado da V3.3.0, manter a mesma composição/proporção vista na captura mobile tanto no mobile quanto no desktop e levar os controles de câmera ao lado do ritmo, na mesma faixa superior.

## Escopo implementado
- Remover a regra V3.3.0 que aplicava cover e ocultava parte da cidade.
- Renderizar a cena inteira, com proporção original: Tianguá 1536×664, mapa genérico 640×405.
- Usar largura mínima entre viewport horizontal e limite pela altura. Centralizar a arte vertical/horizontalmente sem distorção.
- Deslocar os botões `− | 100% | + | ⌂` do quadro separado para dentro do HUD, imediatamente após o seletor de ritmo. Em telas estreitas, a barra rola horizontalmente sem quebrar linha.
- Sem mudanças em lotes, setor, economia, fiscal, data, turnos, persistência ou schema 10.

## Limites de aceite
- Viewports 320×844, 390×844, 750×917, 768×900, 1366×900, 1920×1080 e 1920×600.
- Sem crop, stretch, zoom automático; imagem integral centralizada e controles alinhados no mesmo HUD.
- Testes automáticos Linux e Windows Chrome/Edge; validação visual do usuário no dispositivo como aceite de experiência.
- Esta é uma microetapa corretiva, não autoriza redesenho dos demais menus.

## Homologação
Os testes técnicos do pipeline podem aprovar comportamento e regressão. A homologação visual final depende do usuário conferir em seu monitor e dispositivo.
