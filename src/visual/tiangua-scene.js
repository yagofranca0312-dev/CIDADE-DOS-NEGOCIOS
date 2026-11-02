/* CDN-V221: renderizador 2.5D exclusivo CE-TIANGUA, somente leitura. */
const CidadeTianguaCena=(()=>{
  'use strict';
  const DATA=__CDN_TIANGUA_LOTS_JSON__;
  const BASE='__CDN_TIANGUA_BASE_IMAGE__';
  const SPRITES=Object.freeze({
    mercado:'__CDN_TIANGUA_MARKET_SPRITE__',
    padaria:'__CDN_TIANGUA_BAKERY_SPRITE__',
    roupas:'__CDN_TIANGUA_CLOTHING_SPRITE__'
  });
  // O cenário é EXATAMENTE a arte aprovada. O lote 03 já possui uma fachada
  // arquitetônica pré-renderizada; ocupação altera apenas a placa da unidade.
  // As outras fachadas são sprites independentes, em escala compatível com o lote.
  const SIZES=Object.freeze({mercado:[199,166],padaria:[134,136],roupas:[182,158]});
  function innerFootprint(points,cx,cy,scale=.73){
    return points.map(([x,y])=>(cx+(x-cx)*scale).toFixed(1)+','+(cy+(y-cy)*scale).toFixed(1)).join(' ');
  }
  const FACADE_SIGN=Object.freeze({mercado:'MERCADO',padaria:'PADARIA',roupas:'ROUPAS'});
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byNumber=new Map(DATA.lots.map(l=>[l.number,l]));
  function imageFor(sector){return SPRITES[sector]||SPRITES.mercado;}
  function dimensions(sector){return SIZES[sector]||SIZES.mercado;}
  function svgMap(city,units,selectedLot){
    if(city?.id!=='CE-TIANGUA')throw Error('Cena exclusiva do município CE-TIANGUA');
    const unitMap=new Map((Array.isArray(units)?units:[]).filter(u=>u.cityId===city.id&&byNumber.has(u.lot)).map(u=>[u.lot,u]));
    const chosen=Number.isInteger(selectedLot)&&selectedLot>=1&&selectedLot<=18?selectedLot:null;
    const parts=[
      '<svg class="v221-city-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 664" role="group" aria-label="Mapa isométrico fictício de Tianguá com 18 lotes">',
      '<image class="v221-urban-base" x="0" y="0" width="1536" height="664" href="'+BASE+'" pointer-events="none" preserveAspectRatio="none"/>',
      '<g class="v221-owned-buildings" aria-hidden="true" pointer-events="none">'
    ];
    // Ordem estável de profundidade; nunca desenhar o edifício 03 por cima de si mesmo.
    for(const unit of [...unitMap.values()].sort((a,b)=>byNumber.get(a.lot).cy-byNumber.get(b.lot).cy)){
      const l=byNumber.get(unit.lot),sector=unit.sector;
      if(l.number===3){
        // Fachada do lote 03 já está na arte aprovada. Sua placa muda com a empresa
        // REAL, sem inserir outro prédio nem tocar na imagem-base.
        const label=FACADE_SIGN[sector]||'EMPRESA';
        parts.push('<g class="v221-original-building-sign" data-building-for="3" data-sector="'+escape(sector)+'" pointer-events="none" transform="translate(785 239)">');
        parts.push('<rect x="0" y="0" width="85" height="21" rx="3" fill="#08273b" fill-opacity=".96" stroke="#edc36d" stroke-width="1.2"/>');
        parts.push('<text x="42.5" y="14.7" text-anchor="middle" font-size="11.8" font-family="system-ui,Arial" font-weight="900" fill="#fff1ca">'+label+'</text></g>');
        continue;
      }
      // Sprites menores, calibrados pelo terreno, preservam a leitura das ruas.
      const [w,h]=dimensions(sector),anchor=l.buildingAnchor;
      const width=Math.min(132,w*.64,l.rx*1.30);
      const height=width*h/w;
      const groundY=l.cy+l.ry*.40;
      parts.push('<image data-building-for="'+l.number+'" data-sector="'+escape(sector)+'" href="'+imageFor(sector)+'" x="'+(anchor[0]-width/2).toFixed(1)+'" y="'+(groundY-height).toFixed(1)+'" width="'+width.toFixed(1)+'" height="'+height.toFixed(1)+'" opacity=".98" pointer-events="none"/>');
    }
    parts.push('</g><g class="v221-interactive-lots">');
    for(const l of DATA.lots){
      const unit=unitMap.get(l.number),selected=chosen===l.number;
      const status=unit?'sua empresa':'disponível';
      const p=l.footprint.map(point=>point.join(',')).join(' ');
      const aria='Lote '+String(l.number).padStart(2,'0')+', '+status+(selected?', selecionado':'');
      parts.push('<g class="v221-lot'+(selected?' is-selected':'')+(unit?' is-owned':'')+'" data-lot="'+l.number+'" data-owned="'+!!unit+'" role="button" tabindex="0" aria-pressed="'+selected+'" aria-label="'+escape(aria)+'">');
      parts.push('<title>'+escape(aria)+'</title>');
      if(selected){
        if(l.number!==3){
          // Contorno INTERNO ao terreno, sem drop-shadow; não invade a estrada.
          const inner=innerFootprint(l.footprint,l.cx,l.cy);
          parts.push('<polygon class="v221-selection-fill" points="'+inner+'" fill="#19b5f6" fill-opacity=".10" pointer-events="none"/>');
          parts.push('<polygon class="v221-selection-line" points="'+inner+'" fill="none" stroke="#87e8ff" stroke-width="2.4" stroke-linejoin="round" pointer-events="none"/>');
        }
        // No lote 03 a seleção é SÓ no marcador numérico. Nada atravessa a fachada.
      }
      // Hit area acompanha o terreno; nenhum brilho/render pode sair desse footprint.
      parts.push('<polygon class="v221-lot-hit" points="'+p+'" fill="transparent" stroke="none" pointer-events="fill"/>');
      if(l.number===3)parts.push('<rect x="758" y="149" width="170" height="163" fill="transparent" pointer-events="all"/>');
      const [x,y]=l.labelAnchor;
      parts.push('<rect x="'+(x-23)+'" y="'+(y-15)+'" width="46" height="30" rx="12" fill="'+(unit?'#6c4b12':'#082e32')+'" stroke="'+(selected?'#9eeaff':unit?'#f9c263':'#87a19c')+'" stroke-width="1.6" pointer-events="none"/>');
      parts.push('<text x="'+x+'" y="'+(y+7)+'" text-anchor="middle" font-family="system-ui,Segoe UI,Arial" font-size="18" font-weight="850" fill="#fff7e8" pointer-events="none">'+String(l.number).padStart(2,'0')+'</text>');
      parts.push('</g>');
    }
    // A legenda na arte original continha CONTAGENS DEMONSTRATIVAS.
    // Cobrir exatamente essa área por uma legenda viva do jogo (mesmas coordenadas SVG),
    // que continua alinhada mesmo com zoom/redimensionamento.
    const amount=unitMap.size,free=18-amount;
    parts.push('<g class="v221-live-legend" aria-hidden="true" pointer-events="none">');
    parts.push('<rect x="15" y="529" width="202" height="115" rx="13" fill="#071b2e" stroke="#c6a56a" stroke-width="1.3"/>');
    for(const [i,color,label] of [[0,'#93b870',free+' disponíveis'],[1,'#f0bf66',amount+' empresa'+(amount===1?'':'s')],[2,'#19b5ec','seleção ativa']]){
      const y=555+i*30;
      parts.push('<rect x="33" y="'+(y-9)+'" width="19" height="19" rx="4" fill="'+color+'"/>');
      parts.push('<text x="63" y="'+(y+5)+'" font-size="15" font-weight="700" font-family="system-ui,Arial" fill="#e7eff3">'+escape(label)+'</text>');
    }
    parts.push('</g>');
    parts.push('</g></svg>');
    return parts.join('');
  }
  return Object.freeze({svgMap,LOTS:Object.freeze(DATA.lots.map(x=>x.number)),SCENE_ID:'CE-TIANGUA'});
})();