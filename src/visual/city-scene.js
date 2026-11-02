/* CIDADE DOS NEGÓCIOS V2.2 — cena SVG isométrica, estritamente visual.
   Só consome city, ownedLots e lot; sem estado mutável, RNG, rede ou regras do jogo.
   Edifícios decorativos e atlas neutro NÃO representam atividades econômicas novas. */
const CidadeVisual=(()=>{
  'use strict';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tiers=Object.freeze({local:0,regional:1,grande:2,metropole:3});
  const roofs=Object.freeze(['#4b8295','#648d9b','#65808f','#587f79','#6f8295']);
  // Identidade gráfica estável por cidade, sem consumir RNG nem criar dado econômico.
  function cityHash(value){
    let h=2166136261;
    for(const c of String(value)){h=Math.imul(h^c.codePointAt(0),16777619);}
    return h>>>0;
  }
  // Atlas geométrico ilustrativo: comércio genérico, esquina, escritório baixo,
  // galpão neutro e construção urbana. Nenhuma forma confere funcionalidade.
  function building(x,y,kind,owned,scale=1){
    const h=[29,40,49,25,35][kind];
    const w=[20,19,17,25,20][kind];
    const roof=owned?'#edbd68':roofs[kind];
    const face=owned?'#c28a44':'#355f73';
    const shade=owned?'#a76a34':'#254659';
    const glass=owned?'#ffe3a6':'#a5d3df';
    const parts=[
      '<g class="v22-building" aria-hidden="true" pointer-events="none" transform="translate('+x+' '+y+') scale('+scale+')">',
      '<ellipse cx="2" cy="5" rx="'+(w+8)+'" ry="10" fill="#081927" opacity=".35"/>',
      '<polygon points="'+(-w)+','+(-h)+' 0,'+(-h-10)+' '+(w+2)+','+(-h)+' 2,'+(-h+11)+'" fill="'+roof+'" stroke="#a9c6c9" stroke-width="1.1"/>',
      '<polygon points="'+(-w)+','+(-h)+' 2,'+(-h+11)+' 2,11 '+(-w)+',1" fill="'+face+'"/>',
      '<polygon points="2,'+(-h+11)+' '+(w+2)+','+(-h)+' '+(w+2)+',1 2,11" fill="'+shade+'"/>',
      '<path d="M'+(-w)+' 1L2 11L'+(w+2)+' 1" fill="none" stroke="#1a3444" stroke-width="1.5"/>'
    ];
    if(kind===0||kind===3){
      parts.push('<polygon points="'+(-w-2)+',-15 1,-4 '+(w+4)+',-15 1,-24" fill="'+(owned?'#ffe0a2':'#70b7c2')+'" opacity=".88"/>');
      parts.push('<path d="M'+(-w+5)+' -13v9M'+(-w+12)+' -10v10" stroke="'+glass+'" stroke-width="2.6"/>');
      parts.push('<path d="M7 -13v10M15 -16v10" stroke="'+glass+'" stroke-width="2.6"/>');
    }else{
      for(let row=0;row<Math.min(3,Math.floor(h/13));row++){
        const cy=-h+15+row*12;
        parts.push('<path d="M'+(-w+6)+' '+cy+'v5m8 -9v6M9 '+(cy+2)+'v5M16 '+(cy-2)+'v5" stroke="'+glass+'" stroke-width="2.9" opacity=".85"/>');
      }
      parts.push('<path d="M-8 -5v9M12 -7v9" stroke="'+glass+'" stroke-width="3"/>');
    }
    if(owned)parts.push('<path d="M'+(-w+2)+' '+(-h+6)+'v'+(h-8)+'" stroke="#ffe7b3" stroke-width="2.3" opacity=".88"/><circle cx="0" cy="'+(-h-15)+'" r="3.8" fill="#ffda85"/>');
    parts.push('</g>');
    return parts.join('');
  }
  function tree(x,y,scale=1){
    return '<g class="v22-tree" aria-hidden="true" pointer-events="none" transform="translate('+x+' '+y+') scale('+scale+')">'+
      '<ellipse cx="3" cy="5" rx="11" ry="4" fill="#102636" opacity=".55"/>'+
      '<path d="M0 -3v-17" stroke="#8c7652" stroke-width="3"/>'+
      '<circle cx="-6" cy="-19" r="9" fill="#296e65"/>'+
      '<circle cx="5" cy="-23" r="11" fill="#3a8c77"/>'+
      '<circle cx="9" cy="-15" r="8" fill="#246b61"/>'+
      '</g>';
  }
  function svgMap(city,ownedLots,lot){
    const name=String(city?.name??'Cidade'),uf=String(city?.uf??'');
    const tierName=String(city?.sizeTier??'local');
    const tier=tiers[tierName]??0;
    const seed=cityHash(city?.id??name);
    const owned=new Set(Array.isArray(ownedLots)?ownedLots:[]);
    const chosen=Number.isInteger(lot)&&lot>=1&&lot<=18?lot:null;
    const parts=[
      '<svg class="v22-city-svg" viewBox="180 0 640 405" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Distrito comercial isométrico fictício de '+escape(name)+' com 18 lotes">',
      '<defs>',
      '<linearGradient id="v22-sky" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#1c516a"/><stop offset=".55" stop-color="#153d54"/><stop offset="1" stop-color="#0c273b"/></linearGradient>',
      '<linearGradient id="v22-platform" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#406a70"/><stop offset="1" stop-color="#203e4b"/></linearGradient>',
      '<pattern id="v22-road-dash" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M1 7H9" stroke="#b2bac0" stroke-width="1" opacity=".26"/></pattern>',
      '</defs>',
      '<rect x="180" y="0" width="640" height="405" fill="url(#v22-sky)"/>',
      '<path d="M180 112Q260 76 369 112T650 108T830 105V0H180Z" fill="#33817f" opacity=".12"/>',
      '<path d="M180 186Q293 135 398 176T820 155V405H180Z" fill="#0b2838" opacity=".42"/>',
      '<g class="v22-scenery" aria-hidden="true" pointer-events="none">',
      '<path d="M206 181L432 64L793 225L520 391Z" fill="#0a1f31" opacity=".65"/>',
      '<path d="M215 173L438 71L780 230L516 375Z" fill="url(#v22-platform)" stroke="#557e89" stroke-width="3"/>',
      '<path d="M218 182L435 78L766 232L515 363" fill="none" stroke="#749599" stroke-width="3" opacity=".4"/>',
      '<path d="M245 187L439 94L754 232L514 350" fill="none" stroke="#162f40" stroke-width="30" stroke-linejoin="round" opacity=".68"/>',
      '<path d="M245 187L439 94L754 232L514 350" fill="none" stroke="#d0b883" stroke-width="1.1" stroke-dasharray="6 17" opacity=".5"/>',
      '<path d="M292 148L641 303M362 112L714 265" fill="none" stroke="#7a9b95" stroke-width="2" opacity=".2"/>',
      '</g>',
      '<g class="v22-ambient-skyline" aria-hidden="true" pointer-events="none">'
    ];
    // Densidade decorativa de 4–13 imóveis neutros, conforme porte já existente.
    const count=4+tier*3;
    for(let i=0;i<count;i++){
      const x=230+i*(535/(count-1));
      const y=104+((seed>>>((i%4)*5))%19);
      const kind=(i+seed)%5;
      parts.push(building(Math.round(x),y,kind,false,.54+(.07*(i%3))));
    }
    parts.push('</g><g class="v22-street-details" aria-hidden="true" pointer-events="none">');
    // Vegetação, calçamento e mobiliário não são lotes nem agentes econômicos.
    for(let i=0;i<5+tier;i++){
      const x=220+i*109+(seed%17),y=191+i*21;
      parts.push(tree(x,y,.48+(i%3)*.12));
    }
    for(let i=0;i<4;i++)parts.push(tree(754+i*12,181+i*34,.44));
    parts.push('<path d="M210 214L484 378M706 194L768 226" stroke="#a3c4bf" stroke-width="1.7" stroke-dasharray="3 10" opacity=".34"/>');
    parts.push('</g><g class="v22-lot-layer">');
    // Mantém grade canônica V2.0: 3 linhas × 6 colunas e números 1–18.
    for(let row=0;row<3;row++)for(let col=0;col<6;col++){
      const n=row*6+col+1,x=392+(col-row)*57,y=100+(col+row)*27;
      const isOwned=owned.has(n),isSelected=chosen===n;
      const kind=(seed+n*13)%5;
      const label='Lote '+n+(isOwned?', sua empresa':', disponível')+(isSelected?', selecionado':'');
      const status=isOwned?'is-owned':'is-available';
      parts.push('<g class="v22-lot '+status+(isSelected?' is-selected':'')+'" data-lot="'+n+'" data-owned="'+isOwned+'" tabindex="0" role="button" aria-pressed="'+isSelected+'" aria-label="'+escape(label)+'">');
      parts.push('<title>'+escape(label)+'</title>');
      if(isSelected)parts.push('<ellipse class="v22-selection-halo" cx="'+x+'" cy="'+(y+10)+'" rx="52" ry="30" fill="#66c5ed" opacity=".22" pointer-events="none"/>');
      parts.push('<polygon class="v22-tile-shadow" points="'+x+','+(y-19)+' '+(x+42)+','+y+' '+x+','+(y+21)+' '+(x-42)+','+y+'" fill="#081e2b" opacity=".58"/>');
      parts.push('<polygon class="v22-tile-outline" points="'+x+','+(y-25)+' '+(x+45)+','+y+' '+x+','+(y+25)+' '+(x-45)+','+y+'" fill="'+(isOwned?'#6b5940':'#2c565c')+'" stroke="'+(isSelected?'#a8e8ff':isOwned?'#e7b969':'#709c9d')+'" stroke-width="'+(isSelected?3.8:2)+'"/>');
      parts.push('<polygon class="v22-plot" points="'+x+','+(y-20)+' '+(x+34)+','+y+' '+x+','+(y+20)+' '+(x-34)+','+y+'" fill="'+(isOwned?'#9b7848':'#476d70')+'" stroke="'+(isOwned?'#f5ce7b':'#8ea9a1')+'" stroke-width="1.3"/>');
      if(isOwned)parts.push(building(x,y-1,kind,true,1));
      else{
        // A laje vazia informa lote disponível; edifícios de fundo são externos ao jogo.
        parts.push('<path d="M'+(x-19)+' '+y+'l19 -10l19 10l-19 10Z" fill="#7da3a0" opacity=".23" pointer-events="none"/>');
        parts.push('<path d="M'+(x-14)+' '+(y+3)+'l14 -7l14 7" fill="none" stroke="#bedad3" stroke-dasharray="3 4" opacity=".6" pointer-events="none"/>');
      }
      parts.push('<rect x="'+(x-11)+'" y="'+(y+10)+'" width="22" height="12" rx="5" fill="'+(isOwned?'#241f19':'#183444')+'" stroke="'+(isOwned?'#ffdda0':'#8bb8bb')+'" stroke-width="1"/>');
      parts.push('<text x="'+x+'" y="'+(y+19)+'" text-anchor="middle" fill="'+(isOwned?'#ffe6b1':'#d2e9ea')+'" font-size="9" font-weight="800" pointer-events="none">'+String(n).padStart(2,'0')+'</text>');
      // Hit-area estável por lote: maior que o terreno, mas nunca bloqueia o restante da cidade.
      parts.push('<polygon class="v22-hit" points="'+x+','+(y-24)+' '+(x+43)+','+y+' '+x+','+(y+24)+' '+(x-43)+','+y+'" fill="transparent" pointer-events="all"/>');
      parts.push('</g>');
    }
    parts.push('</g>');
    parts.push('<g class="v22-overlay" aria-hidden="true" pointer-events="none">');
    parts.push('<rect x="193" y="14" width="304" height="47" rx="8" fill="#071a2a" fill-opacity=".87" stroke="#5b8992" stroke-opacity=".48"/>');
    parts.push('<text x="207" y="32" fill="#f7dfb0" font-size="15" font-weight="800" letter-spacing="1">'+escape(name.toUpperCase())+' · '+escape(uf)+'</text>');
    parts.push('<text x="207" y="49" fill="#a6ccd5" font-size="10" letter-spacing=".8">DISTRITO ILUSTRATIVO · PORTE '+escape(tierName.toUpperCase())+'</text>');
    if(chosen!==null){
      const selectedOwned=owned.has(chosen);
      parts.push('<rect x="193" y="351" width="253" height="37" rx="8" fill="#091e30" stroke="#e2b568" stroke-width="1.7"/>');
      parts.push('<circle cx="213" cy="369" r="5" fill="'+(selectedOwned?'#efbb69':'#70c6d8')+'"/>');
      parts.push('<text x="227" y="373" fill="#f5e4c2" font-size="12" font-weight="750">LOTE '+String(chosen).padStart(2,'0')+' · '+(selectedOwned?'SUA EMPRESA':'DISPONÍVEL')+'</text>');
    }
    parts.push('</g></svg>');
    return parts.join('');
  }
  return Object.freeze({svgMap});
})();
