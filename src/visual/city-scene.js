/* CENA URBANA V2 — apresentação SVG, sem acesso ao estado ou RNG do jogo. */
const CidadeVisual=(()=>{
  'use strict';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function svgMap(city,ownedLots,lot){
    // SVG estilizado original: cada grupo tem identificação de lote, sem dependências externas.
    const seed=city.name.length+city.id.length;
    const urbanSize={local:0,regional:1,grande:2,metropole:3}[city.sizeTier]??0;
    const fragments=[`<svg viewBox="180 10 600 360" xmlns="http://www.w3.org/2000/svg" aria-label="Mapa isométrico fictício de ${escape(city.name)}">`,
      `<defs><linearGradient id="sea" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#1e5270"/><stop offset="1" stop-color="#0b2639"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="4"/></filter></defs>`,
      `<path d="M0 325 Q180 310 280 370 T800 340 L870 410H0Z" fill="#16516e" opacity=".42"/>`,
      `<path d="M145 155 L436 19 L813 196 L519 366Z" fill="#102d3b" opacity=".9"/>`];
    // Horizonte ilustrativo: escala visual relativa, sem geografia ou números oficiais.
    for(let i=0;i<3+urbanSize*5;i++){
      const cx=210+i*26, h=16+((i*19+seed)%24)+urbanSize*9;
      fragments.push(`<rect x="${cx}" y="${125-h}" width="13" height="${h}" rx="2" fill="#6da0a9" opacity=".24" pointer-events="none"/>`);
    }
    for(let row=0;row<3;row++)for(let col=0;col<6;col++){
      const num=row*6+col+1,x=392+(col-row)*57,y=91+(col+row)*26;
      const isOwn=ownedLots.includes(num),isSelected=lot===num;
      const ground=isOwn?'#9e8144':isSelected?'#3f8bb2':'#42665f';
      const roofs=['#487d8c','#316275','#607387','#597c80','#425a6b'];
      const roof=isOwn?'#e8b55f':roofs[(num+seed)%roofs.length];
      const height=isOwn?42:14+((num*7+seed)%4)*9+urbanSize*7;
      const xx=x,yy=y,wide=49,tall=23;
      fragments.push(`<g data-lot="${num}" tabindex="0" role="button" aria-label="Selecionar lote ${num}"><title>Lote ${String(num).padStart(2,'0')} · clique para selecionar</title>`);
      if(isSelected)fragments.push(`<ellipse cx="${xx}" cy="${yy+12}" rx="65" ry="37" fill="#6dc9ff" opacity=".16" filter="url(#glow)"/>`);
      fragments.push(`<polygon points="${xx},${yy-tall} ${xx+wide},${yy} ${xx},${yy+tall} ${xx-wide},${yy}" fill="${ground}" stroke="${isSelected?'#9bdbff':'#416773'}" stroke-width="${isSelected?3:1.7}"/>`);
      if((urbanSize>=2?num%11===0:num%5===0)&&!isOwn){
        fragments.push(`<path d="M${xx-7} ${yy+5}l-6-18h12l-6 18" fill="#42745c" stroke="#8fc09c" stroke-width="2"/><circle cx="${xx-6}" cy="${yy-10}" r="11" fill="#2d8d66"/><circle cx="${xx+7}" cy="${yy-12}" r="9" fill="#419672"/>`);
      }else{
        const cx=xx,cy=yy-3;
        fragments.push(`<polygon points="${cx-17},${cy-height} ${cx},${cy-height-8} ${cx+19},${cy-height} ${cx+2},${cy-height+10}" fill="${roof}" stroke="#9cc1cb" stroke-width=".7"/>`);
        fragments.push(`<polygon points="${cx-17},${cy-height} ${cx+2},${cy-height+10} ${cx+2},${cy+13} ${cx-17},${cy+2}" fill="${isOwn?'#bb873c':'#345569'}"/>`);
        fragments.push(`<polygon points="${cx+2},${cy-height+10} ${cx+19},${cy-height} ${cx+19},${cy+2} ${cx+2},${cy+13}" fill="${isOwn?'#e2a450':'#27485e'}"/>`);
        fragments.push(`<path d="M${cx-10} ${cy-height+14}v5 M${cx-3} ${cy-height+18}v5 M${cx+8} ${cy-height+17}v6" stroke="${isOwn?'#f7d99e':'#7ba9bf'}" stroke-width="2"/>`);
      }
      fragments.push(`</g>`);
    }
    const r=Math.floor((lot-1)/6),c=(lot-1)%6;
    const px=392+(c-r)*57,py=91+(c+r)*26;
    // Destaque sobreposto por último: lote legível sem 18 números concorrendo no mapa.
    fragments.push(`<g class="selected-lot-marker" pointer-events="none" aria-hidden="true"><path d="M${px} ${py-4}L${px} ${py-39}" stroke="#f4d49a" stroke-width="2"/><rect x="${px-55}" y="${py-69}" width="110" height="30" rx="8" fill="#0c2238" stroke="#f4d49a" stroke-width="1.6"/><text x="${px}" y="${py-49}" fill="#ffe1a1" text-anchor="middle" font-size="14" font-weight="800">LOTE ${String(lot).padStart(2,'0')}</text></g>`);
    fragments.push(`<text x="208" y="40" fill="#9fbfd2" font-size="15" font-weight="700" letter-spacing="3">${escape(city.name.toUpperCase())} · ${escape(city.uf)}</text><text x="208" y="60" fill="#7eabc0" font-size="10">DISTRITO COMERCIAL FICTÍCIO · PORTE ${escape(city.sizeTier.toUpperCase())}</text></svg>`);
    return fragments.join('');
  }
  return Object.freeze({svgMap});
})();
