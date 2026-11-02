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
  const SIZES=Object.freeze({mercado:[199,166],padaria:[134,136],roupas:[182,158]});
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
    // Painter's algorithm: os edifícios mais próximos ao rodapé são desenhados depois.
    for(const unit of [...unitMap.values()].sort((a,b)=>byNumber.get(a.lot).cy-byNumber.get(b.lot).cy)){
      const l=byNumber.get(unit.lot),sector=unit.sector;
      const [w,h]=dimensions(sector),anchor=l.buildingAnchor;
      const width=w*1.06,height=h*1.06;
      parts.push('<image data-building-for="'+l.number+'" data-sector="'+escape(sector)+'" href="'+imageFor(sector)+'" x="'+(anchor[0]-width/2)+'" y="'+(anchor[1]-height)+'" width="'+width+'" height="'+height+'" pointer-events="none"/>');
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
        parts.push('<polygon class="v221-selection-fill" points="'+p+'" fill="#19b5f6" fill-opacity=".16" pointer-events="none"/>');
        parts.push('<polygon class="v221-selection-line" points="'+p+'" fill="none" stroke="#75e7ff" stroke-width="5" stroke-linejoin="round" pointer-events="none"/>');
      }
      // Hit area acompanha o terreno; nenhum brilho/render pode sair desse footprint.
      parts.push('<polygon class="v221-lot-hit" points="'+p+'" fill="transparent" stroke="transparent" stroke-width="8" pointer-events="all"/>');
      const [x,y]=l.labelAnchor;
      parts.push('<rect x="'+(x-23)+'" y="'+(y-15)+'" width="46" height="30" rx="12" fill="'+(unit?'#6c4b12':'#082e32')+'" stroke="'+(selected?'#9eeaff':unit?'#f9c263':'#87a19c')+'" stroke-width="1.6" pointer-events="none"/>');
      parts.push('<text x="'+x+'" y="'+(y+7)+'" text-anchor="middle" font-family="system-ui,Segoe UI,Arial" font-size="18" font-weight="850" fill="#fff7e8" pointer-events="none">'+String(l.number).padStart(2,'0')+'</text>');
      parts.push('</g>');
    }
    parts.push('</g></svg>');
    return parts.join('');
  }
  return Object.freeze({svgMap,LOTS:Object.freeze(DATA.lots.map(x=>x.number)),SCENE_ID:'CE-TIANGUA'});
})();