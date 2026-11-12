import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const url=pathToFileURL(resolve('index.html')).href,out=join(process.env.RUNNER_TEMP||tmpdir(),'v310-visual-evidence');
mkdirSync(out,{recursive:true});
const results=[];
const v332GateDViewports=[
 {width:320,height:700},{width:390,height:844},{width:430,height:932},
 {width:768,height:1024},{width:1024,height:768},
 {width:1366,height:768},{width:1920,height:1080}
];
for(const channel of ['chrome','msedge'])for(const {width,height} of v332GateDViewports){
 const folder=mkdtempSync(join(tmpdir(),'cidade-v310-'+channel+'-'));let ctx;
 try{
  ctx=await chromium.launchPersistentContext(folder,{channel,headless:true,viewport:{width,height},isMobile:width<600,hasTouch:width<600});
  const page=ctx.pages()[0]||await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>document.body.dataset.storageReady==='ready');
  // Onboarding antes do início: card centralizado e integralmente dentro da viewport.
  const onboarding=await page.evaluate(()=>{
    const card=document.querySelector('.v31-onboard-panel').getBoundingClientRect();
    const art=document.querySelector('.onboarding-art').getBoundingClientRect();
    return {w:innerWidth,h:innerHeight,x:card.x,y:card.y,cardWidth:card.width,cardHeight:card.height,
      artWidth:art.width,artHeight:art.height,sidebarCount:document.querySelectorAll('.sidebar').length};
  });
  assert.equal(onboarding.sidebarCount,0,'Barra lateral antiga ainda existe no DOM');
  assert.ok(onboarding.cardWidth<=Math.min(500,width)+2,'Card de entrada desproporcional');
  assert.ok(onboarding.x>=-2 && onboarding.x+onboarding.cardWidth<=onboarding.w+2,
    'Card sai da largura: '+JSON.stringify(onboarding));
  assert.ok(onboarding.y>=-2 && onboarding.y+onboarding.cardHeight<=onboarding.h+2,'Card sai da altura');
  assert.ok(onboarding.artWidth>=width-2 && onboarding.artHeight>=onboarding.h-2,'Arte de fundo nao cobre viewport');
  await page.screenshot({path:join(out,channel+'-'+width+'-onboarding.png')});
  await page.locator('#player-name').fill('Jogador QA');await page.locator('#company-name').fill('Empresa QA');
  await page.locator('#start-city').selectOption('CE-TIANGUA');
  await page.locator('#career-form button[type=submit]').click();
  await page.locator('#v31-dock').waitFor({state:'visible'});
  // A inicializacao da carreira faz dois commits: CRIAR e CONCORRENCIA_ATIVAR.
  // Capturar o baseline da camera so depois da segunda gravacao estar duravel.
  await page.waitForFunction(async()=>{
    const raw=await CidadeDurableStore.readCurrent(CidadeCore);
    if(!raw)return false;
    const saved=CidadeCore.importSave(raw).state;
    return saved.audit.events.some(event=>event.type==='MUNDO.CONCORRENCIA_ATIVADA');
  },null,{timeout:45000});
  // Viewport real, sem menu lateral e sem altura de painel ERP.
  const geometry=await page.evaluate(()=>{
    const canvas=document.getElementById('map-canvas'),svg=canvas.querySelector('svg');
    const r=canvas.getBoundingClientRect(),sr=svg.getBoundingClientRect();
    const dock=document.getElementById('v31-dock').getBoundingClientRect();
    const sidebar=document.querySelector('.sidebar');
    const metric=(id)=>document.getElementById(id).textContent;
    return {width:innerWidth,height:innerHeight,map:{x:r.x,y:r.y,w:r.width,h:r.height},
      svg:{x:sr.x,y:sr.y,w:sr.width,h:sr.height},canvasScroll:{x:canvas.scrollLeft,y:canvas.scrollTop},
      mapTop:parseFloat(getComputedStyle(document.body).getPropertyValue('--v332-map-top')),
      mapBottom:parseFloat(getComputedStyle(document.body).getPropertyValue('--v332-map-bottom')),
      dock:{x:dock.x,w:dock.width},
      sidebarRemoved:sidebar===null,
      classicControls:document.querySelectorAll('#v31-classic-switch,#v31-classic-return').length,
      topbarHidden:getComputedStyle(document.querySelector('.topbar')).display==='none',
      scrollWidth:document.documentElement.scrollWidth,
      cash:metric('v31-hud-cash'),date:metric('v31-hud-date')};
  });
  // Regressão do card residual: nenhuma legenda herdada ocupa ou pinta o canto inferior esquerdo.
  const summaryLegacy=await page.evaluate(()=>[...document.querySelectorAll(
    '.map-legend,#v221-map-summary,.v221-summary-entries'
  )].map(el=>({selector:el.id?'#'+el.id:'.'+el.classList[0],
    display:getComputedStyle(el).display,rect:el.getBoundingClientRect().toJSON()})));
  assert.ok(summaryLegacy.length>=2,'Instrumentacao legada nao localizada');
  assert.ok(summaryLegacy.every(el=>el.display==='none'),'Card legado vazando no mapa: '+JSON.stringify(summaryLegacy));
    assert.equal(geometry.sidebarRemoved,true,'Sidebar ERP nao foi removida do HTML');
  assert.equal(geometry.classicControls,0,'Alternancia classica ainda existe');
  assert.equal(geometry.topbarHidden,true,'Topbar antigo ainda ocupa a tela');
  // V3.3.2-A: mapa integral na area sob as duas faixas informativas.
  assert.ok(Math.abs(geometry.map.x)<=2,'Mapa deslocado horizontalmente');
  assert.ok(Math.abs(geometry.map.y-geometry.mapTop)<3,'Area do mapa invade o HUD');
  assert.ok(Math.abs(geometry.map.w-width)<3,'Mapa perdeu largura da viewport');
  assert.ok(Math.abs(geometry.map.h-(geometry.height-geometry.mapTop-geometry.mapBottom))<4,
    'Reserva superior/inferior inconsistente');
  const ratio=1536/664;
  const expectedWidth=Math.min(width,geometry.map.h*ratio);
  const expectedHeight=expectedWidth/ratio;
  assert.ok(Math.abs(geometry.svg.w-expectedWidth)<5,'SVG cortado horizontalmente: '+JSON.stringify(geometry.svg));
  assert.ok(Math.abs(geometry.svg.h-expectedHeight)<5,'SVG distorcido: '+JSON.stringify(geometry.svg));
  assert.ok(Math.abs(geometry.svg.x-(width-expectedWidth)/2)<5,'Cidade fora do centro horizontal');
  assert.ok(Math.abs(geometry.svg.y-(geometry.map.y+(geometry.map.h-expectedHeight)/2))<5,'Cidade fora do centro vertical');
  assert.ok(Math.abs(geometry.canvasScroll.x)<3&&Math.abs(geometry.canvasScroll.y)<3,'Pan inicial inesperado');
  const cameraAlignment=await page.evaluate(()=>{
    const hud=document.querySelector('.v31-top-controls');
    const primary=hud.querySelector('.v332-hud-primary');
    const secondary=hud.querySelector('.v332-hud-secondary');
    const speed=document.getElementById('v31-hud-speed');
    const camera=hud.querySelector('.v31-camera');
    const cr=camera.getBoundingClientRect(),sr=speed.getBoundingClientRect();
    const hr=hud.getBoundingClientRect(),pr=primary.getBoundingClientRect(),ss=secondary.getBoundingClientRect();
    return {inside:camera.parentElement===secondary,
      nextToSpeed:speed.parentElement.classList.contains('v332-time-controls'),
      cameraTop:cr.top,speedTop:sr.top,cameraHeight:cr.height,speedHeight:sr.height,
      cameraPosition:getComputedStyle(camera).position,
      hudBottom:hr.bottom,primaryBottom:pr.bottom,secondaryTop:ss.top,
      primaryOverflow:primary.scrollWidth>primary.clientWidth,
      stripScrollWidth:hud.querySelector('.v332-kpi-strip').scrollWidth,
      stripClientWidth:hud.querySelector('.v332-kpi-strip').clientWidth,
      secondaryScrollWidth:secondary.scrollWidth,secondaryClientWidth:secondary.clientWidth};
  });
  assert.equal(cameraAlignment.inside,true,'Camera fora da segunda faixa do HUD');
  assert.equal(cameraAlignment.nextToSpeed,true,'Ritmo fora da faixa de tempo');
  assert.equal(cameraAlignment.cameraPosition,'static','Camera flutuante reapareceu');
  assert.ok(Math.abs(cameraAlignment.cameraTop+cameraAlignment.cameraHeight/2-
    (cameraAlignment.speedTop+cameraAlignment.speedHeight/2))<8,'Camera e tempo desalinhados');
  assert.ok(cameraAlignment.primaryBottom<=cameraAlignment.secondaryTop+3,'Faixas sobrepostas');
  assert.ok(cameraAlignment.hudBottom<=geometry.map.y+12,'HUD invade mapa util');
  if(width>=1500){
    const metricsFill=await page.evaluate(()=>{
      const strip=document.querySelector('.v332-kpi-strip');
      const all=strip.querySelectorAll('.v332-kpi');
      const end=all[all.length-1].getBoundingClientRect().right;
      return {end,stripEnd:strip.getBoundingClientRect().right};
    });
    assert.ok(Math.abs(metricsFill.stripEnd-metricsFill.end)<=8,
      'HUD desktop largo ainda deixou faixa vazia: '+JSON.stringify(metricsFill));
  }
  const headerMetrics=await page.evaluate(async()=>{
    const raw=await CidadeDurableStore.readCurrent(CidadeCore),saved=CidadeCore.importSave(raw).state;
    const daily=CidadeCore.financialReport(saved,'day',saved.calendar.date);
    const hasUnits=CidadeCore.businesses(saved).length>0;
    const overview=CidadeCore.overview(saved);
    const value=id=>document.getElementById(id).textContent.trim();
    return {cash:value('v31-hud-cash'),daily:value('v332-hud-sales'),result:value('v332-hud-result'),
      hasUnits,critical:value('v332-hud-stock'),advisory:value('v332-hud-advisory'),due:value('v332-hud-due'),
      expectedCash:CidadeCore.money(overview.cash),expectedDaily:hasUnits?CidadeCore.money(daily.revenue):'—',
      expectedResult:hasUnits?CidadeCore.money(overview.profit):'—'};
  });
  assert.equal(headerMetrics.cash,headerMetrics.expectedCash,'Caixa no HUD nao e o saldo');
  assert.equal(headerMetrics.daily,headerMetrics.expectedDaily,'Vendas do dia nao batem com ledger');
  assert.equal(headerMetrics.result,headerMetrics.expectedResult,'Resultado acumulado diverge do Core');
  assert.equal(headerMetrics.advisory,'0','Sem empresa, a Central nao deve inventar pendencias');
  assert.ok(headerMetrics.hasUnits?headerMetrics.critical.includes('item'):headerMetrics.critical==='—','Estoque ativo nao e identificado');
  assert.ok(headerMetrics.due==='—'||/em 3 dias|vencida/.test(headerMetrics.due),'Prazo do painel sem evidencia');
  assert.equal(await page.locator('#v31-camera-label').textContent(),'100%');
  assert.ok(geometry.scrollWidth<=width+4,'Rolagem horizontal fora do viewport');
  assert.ok(Math.abs(geometry.dock.x+geometry.dock.w/2-width/2)<=4,'Dock nao centralizada');
  assert.ok(geometry.cash!=='—' && geometry.date!=='—','HUD sem dados reais da carreira');
  // Patch A: no mobile, cada faixa e uma linha própria; scroll interno, sem 8 microcolunas.
  if(width<=768){
    const hud=await page.evaluate(()=>{
      const el=document.querySelector('.v31-top-controls'),r=el.getBoundingClientRect();
      const primary=el.querySelector('.v332-hud-primary').getBoundingClientRect();
      const secondary=el.querySelector('.v332-hud-secondary').getBoundingClientRect();
      const strip=el.querySelector('.v332-kpi-strip');
      return {height:r.height,primaryBottom:primary.bottom,secondaryTop:secondary.top,
        scrollableKpis:strip.scrollWidth>strip.clientWidth,
        pause:document.querySelector('#v31-hud-pause').textContent.trim(),
        day:document.querySelector('#v31-next-day').textContent.trim(),
        turns:document.querySelector('#v31-hud-turns').textContent.trim(),
        events:document.querySelector('#v31-alert-count').textContent.trim(),
        speedLabel:document.querySelector('#v31-hud-speed').getAttribute('aria-label')};
    });
    assert.ok(hud.height>=90&&hud.height<=125,'HUD mobile fora de duas faixas: '+JSON.stringify(hud));
    assert.ok(hud.primaryBottom<=hud.secondaryTop+3,'Linhas do HUD colidem');
    assert.equal(hud.scrollableKpis,true,'KPIs no mobile sem scroll horizontal');
    assert.ok(['▶','❚❚'].includes(hud.pause),'Controle de play perdeu acessibilidade');
    assert.equal(hud.day,'+1');
    assert.equal(hud.turns,'⏭');
    assert.match(hud.events,/^\d+$/);
    assert.equal(hud.speedLabel,'Velocidade do tempo');
  }
  // Componentes legados nunca podem aparecer por trás da dock.
  const residual=await page.evaluate(()=>({
    units:getComputedStyle(document.getElementById('unit-switch-container')).display,
    sidebar:document.querySelector('.sidebar-brand')?.getBoundingClientRect().width||0,
    cityInfoCount:document.querySelectorAll('.v221-city-info-trigger').length,
    switchHidden:getComputedStyle(document.getElementById('v221-city-switch-trigger')).display==='none'
  }));
  assert.equal(residual.units,'none','Unidade ativa legada ainda aparece');
  assert.equal(residual.sidebar,0,'Brand lateral residual ocupa o mapa');
  assert.equal(residual.cityInfoCount,0,'Botão Cidade duplicado ainda existe');
  assert.equal(residual.switchHidden,true,'Letreiro SVG ainda tem caixa de texto duplicada');
  const before=await page.evaluate(async()=>{
   const raw=await CidadeDurableStore.readCurrent(CidadeCore),s=CidadeCore.importSave(raw).state;
   return {revision:s.revision,tick:s.calendar.tick,cash:CidadeCore.overview(s).cash,schema:s.schemaVersion, lastCommand:Object.keys(s.audit.commands).slice(-1)[0],lastEvent:s.audit.events.at(-1)?.type};
  });
  // Gate B: abrir menu, agenda e rota sem empresa não pode alterar o save.
  const bBefore=await page.evaluate(async()=>{
    const raw=await CidadeDurableStore.readCurrent(CidadeCore);
    const st=CidadeCore.importSave(raw).state;
    return {revision:st.revision,checksum:CidadeCore.hash(JSON.stringify(st)),schema:st.schemaVersion};
  });
  assert.equal(await page.locator('#v332-bottom-zone').isVisible(),true);
  await page.locator('#v332-agenda-toggle').click();
  assert.equal(await page.locator('#v332-agenda-list').isVisible(),true);
  assert.equal(await page.locator('#v332-agenda-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#v332-agenda-toggle').click();
  assert.equal(await page.locator('#v332-agenda-list').isVisible(),false);
  await page.locator('#v332-more-toggle').click();
  assert.equal(await page.locator('#v332-more-menu').isVisible(),true);
  assert.equal(await page.locator('#v332-more-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#v332-more-toggle').click();
  assert.equal(await page.locator('#v332-more-menu').isVisible(),false);
  // Abrir uma seção real a partir do menu Mais, inclusive em viewport mobile.
  await page.locator('#v332-more-toggle').click();
  await page.locator('#v332-more-menu [data-v332-route="sistema:saves"]').click();
  assert.equal(await page.locator('[data-view="sistema"]').isVisible(),true,
    'Mais > Configurações não abriu seção de saves');
  await page.locator('#v31-overlay-close').click();
  await page.locator('.v332-quick-actions [data-v332-route="mercado:outros"]').click();
  assert.equal(await page.locator('[data-view="empresa"]').isVisible(),true,
    'Preços sem unidade deve orientar o jogador à área de empresas');
  await page.locator('#v31-overlay-close').click();
  const bAfter=await page.evaluate(async()=>{
    const raw=await CidadeDurableStore.readCurrent(CidadeCore);
    const st=CidadeCore.importSave(raw).state;
    return {revision:st.revision,checksum:CidadeCore.hash(JSON.stringify(st)),schema:st.schemaVersion};
  });
  assert.deepEqual(bAfter,bBefore,'Abrir agenda, menu e atalho não pode alterar o save');

  // Gate C: sem empresa, a Central não pode fabricar pendencias.
  assert.equal((await page.locator('#v332-hud-advisory').textContent()).trim(),'0',
    'Central inventou alerta em carreira sem empresa');
  assert.equal(await page.locator('#v332-advisor-panel').isVisible(),true);
  await page.locator('#v332-advisor-toggle').click();
  assert.equal(await page.locator('#v332-advisor-drawer').isVisible(),true);
  assert.equal(await page.locator('#v332-advisor-toggle').getAttribute('aria-expanded'),'true');
  // Gate D: o painel nao deve cobrir o HUD, inclusive em 320x700.
  const dAdvisorGeom=await page.evaluate(()=>{
    const drawer=document.getElementById('v332-advisor-drawer').getBoundingClientRect();
    const hud=document.querySelector('.v332-hud').getBoundingClientRect();
    return {drawerTop:drawer.top,drawerBottom:drawer.bottom,
      drawerRight:drawer.right,hudBottom:hud.bottom,
      viewportWidth:innerWidth,viewportHeight:innerHeight};
  });
  assert.ok(dAdvisorGeom.drawerTop>=dAdvisorGeom.hudBottom-12,
    'Central expandida invade indicadores superiores: '+JSON.stringify(dAdvisorGeom));
  assert.ok(dAdvisorGeom.drawerRight<=width+3,
    'Central expandida ultrapassa margem da viewport');
  await page.screenshot({path:join(out,channel+'-'+width+'-gate-d-advisor.png')});
  if(width<=900){
    const touchTargets=await page.evaluate(()=>[
      '#v332-advisor-toggle','#v332-agenda-toggle',
      '.v332-quick-actions button','#v332-more-toggle','#v31-hud-pause'
    ].map(sel=>{
      const el=document.querySelector(sel),r=el.getBoundingClientRect();
      return {sel,w:r.width,h:r.height};
    }));
    for(const t of touchTargets)assert.ok(t.h>=38&&t.w>=28,
      'Alvo de toque reduzido: '+JSON.stringify(touchTargets));
  }
  assert.match(await page.locator('#v332-advisor-active-list').textContent(),
    /Nenhuma ação prioritária identificada/);
  await page.locator('#v332-advisor-history-tab').click();
  assert.equal(await page.locator('#v332-advisor-history-list').isVisible(),true);
  assert.match(await page.locator('#v332-advisor-history-list').textContent(),
    /Nenhum aviso resolvido ou dispensado/);
  await page.locator('#v332-advisor-active-tab').click();
  assert.equal(await page.locator('#v332-advisor-active-list').isVisible(),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#v332-advisor-drawer').isVisible(),false);
  await page.locator('#v332-hud-advice-trigger').click();
  assert.equal(await page.locator('#v332-advisor-drawer').isVisible(),true,
    'Cartão de alertas do HUD não abre a Central');
  await page.locator('#v332-advisor-close').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#v332-advisor-drawer').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'v332-hud-advice-trigger',
    'Ao fechar via teclado, foco nao retornou ao botao que abriu a Central');
  const cAfter=await page.evaluate(async()=>{
    const raw=await CidadeDurableStore.readCurrent(CidadeCore);
    const st=CidadeCore.importSave(raw).state;
    return {revision:st.revision,checksum:CidadeCore.hash(JSON.stringify(st)),schema:st.schemaVersion};
  });
  assert.deepEqual(cAfter,bBefore,
    'Central de Gestão, abas, histórico e navegação alteraram o save econômico');

  await page.screenshot({path:join(out,channel+'-'+width+'-gate-d-city.png')});

  const bottomGeometry=await page.evaluate(()=>{
    const map=document.getElementById('map-canvas').getBoundingClientRect();
    const bottom=document.getElementById('v332-bottom-zone').getBoundingClientRect();
    const ops=document.querySelector('.v332-ops-panel').getBoundingClientRect();
    const dock=document.getElementById('v31-dock').getBoundingClientRect();
    return {mapBottom:map.bottom,bottomTop:bottom.top,
      opsBottom:ops.bottom,dockBottom:dock.bottom,dockW:dock.width,
      viewportW:innerWidth,opsW:ops.width};
  });
  assert.ok(bottomGeometry.mapBottom<=bottomGeometry.bottomTop+21,
    'As ações inferiores encobrem o mapa utilizável: '+JSON.stringify(bottomGeometry));
  assert.ok(bottomGeometry.dockW<=bottomGeometry.viewportW+2,
    'Dock ultrapassa viewport');
  await page.locator('#v31-camera-plus').click();
  await page.locator('#v31-camera-minus').click();
  await page.locator('#v31-camera-plus').click();
  // Clique no SVG transformado valida a geometria real do lote, nao o seletor auxiliar.
  await page.locator('#map-canvas [data-lot="10"]').click();
  assert.match(await page.locator('#selected-lot').textContent(),/Lote 10/);
  assert.equal(await page.locator('#v31-lot-quick').isVisible(),true);
  // Em paisagem/desktop baixo, 110% ainda pode ser menor que a viewport.
  // Ampliar ate haver area rolavel, depois mover para o lado disponivel.
  for(let k=0;k<9;k++){
    const space=await page.locator('#map-canvas').evaluate(el=>el.scrollWidth-el.clientWidth);
    if(space>30)break;
    await page.locator('#v31-camera-plus').click();
  }
  const panBefore=await page.locator('#map-canvas').evaluate(el=>({
    x:el.scrollLeft,range:el.scrollWidth-el.clientWidth
  }));
  assert.ok(panBefore.range>5,'Zoom nao criou area navegavel: '+JSON.stringify(panBefore));
  await page.locator('#map-canvas').focus();
  const panDirection=panBefore.x>=panBefore.range-2?'ArrowLeft':'ArrowRight';
  await page.keyboard.press(panDirection);
  await page.waitForFunction(({before})=>
    Math.abs(document.getElementById('map-canvas').scrollLeft-before)>1,
    {before:panBefore.x},{timeout:3000});
  // O seletor é SR-only fora do foco, mas é alcançável por Tab/teclado.
  await page.locator('#v221-inspector-close').click();
  const lotBefore=await page.evaluate(()=>{
    const picker=document.querySelector('.v22-lot-nav');
    const r=picker.getBoundingClientRect();
    return {w:r.width,h:r.height,clip:getComputedStyle(picker).clipPath,
      display:getComputedStyle(picker).display};
  });
  assert.equal(lotBefore.display,'flex','Atalho acessível removido do DOM');
  assert.ok(lotBefore.w<=2 && lotBefore.h<=2,'Seletor de lotes ainda ocupa o mapa: '+JSON.stringify(lotBefore));
  assert.match(lotBefore.clip,/inset\(50%\)/,'Seletor não está visualmente recortado');
  await page.locator('#map-lot-picker').focus();
  const lotFocused=await page.evaluate(()=>{
    const picker=document.querySelector('.v22-lot-nav'),r=picker.getBoundingClientRect();
    return {w:r.width,clip:getComputedStyle(picker).clipPath,focused:document.activeElement.id};
  });
  assert.equal(lotFocused.focused,'map-lot-picker','Navegação por teclado perdida');
  assert.ok(lotFocused.w>100,'Seletor não aparece quando recebe foco');
  await page.locator('#map-lot-picker').focus();
  await page.locator('#map-lot-picker').selectOption('2');
  assert.match(await page.locator('#selected-lot').textContent(),/Lote 02/);
  await page.locator('#map-lot-picker').evaluate(el=>el.blur());
  // Letreiro decorativo e nenhuma legenda interna; apenas dock abre Configurações.
  assert.equal(await page.locator('#map-canvas .v31-city-art-hotspot,#map-canvas [data-city-switch-art],#map-canvas .v221-live-legend').count(),0);
  await page.locator('#map-canvas .v221-urban-base').dispatchEvent('click');
  assert.equal(await page.locator('[data-view="sistema"]').isVisible(),false,'Clicar na arte abre Configurações indevidamente');
  assert.equal(await page.locator('#v221-city-pick').isVisible(),false,'Clicar na arte abre cidades indevidamente');
  await page.locator('#v31-dock [data-v31-open="sistema"]').click();
  await page.locator('#v31-city-manager').click();
  assert.equal(await page.locator('#v221-city-pick').isVisible(),true,'Cidades não acessíveis pelo Dock > Configurações');
  assert.equal(await page.locator('#v221-city-selector').isVisible(),true);
  await page.locator('#v31-overlay-close').click();
  await page.locator('#v31-dock [data-v31-open="mercado:compras"]').click();
  assert.equal(await page.locator('[data-view="cidade"]').isVisible(),true);
  assert.equal(await page.locator('[data-view="mercado"]').isVisible(),true);
  assert.equal(await page.locator('#v31-backdrop').isVisible(),true);
  assert.equal(await page.locator('[data-view="mercado"]').getAttribute('aria-modal'),'true');
  const layers=await page.evaluate(()=>({
    toast:parseInt(getComputedStyle(document.getElementById('toast')).zIndex,10),
    modal:parseInt(getComputedStyle(document.querySelector('.view[data-view="mercado"]')).zIndex,10),
    backdrop:parseInt(getComputedStyle(document.getElementById('v31-backdrop')).zIndex,10),
    dock:parseInt(getComputedStyle(document.getElementById('v31-dock')).zIndex,10)}));
  assert.ok(layers.toast>layers.modal && layers.modal>layers.backdrop && layers.backdrop>layers.dock,
    'Toast/backdrop/modal/dock com z-index incorreto');
  // Todos os centros de comando usam chrome fixo, trilho iconizado e KPIs antes do conteudo.
  const panels={mercado:['compras','estoque','vendas','outros'],
    empresa:['dashboard','minhas-empresas','analises','comparativos'],
    administrativo:['financas','logistica','rh-dp','contabilidade','fiscal','paralegal'],
    sistema:['saves','diagnostico','integridade']};
  let activeRoot='mercado';
  for(const [root,sections] of Object.entries(panels)){
    if(root!==activeRoot){
      await page.locator('#v31-overlay-close').click();
      await page.locator('#v31-dock [data-v31-open="'+(root==='empresa'?'empresa:dashboard':root==='sistema'?'sistema':'administrativo:rh-dp')+'"]').click();
      activeRoot=root;
    }
    assert.equal(await page.locator('[data-view="'+root+'"]').isVisible(),true,'Modal do departamento nao abriu: '+root);
    for(const section of sections){
      const button=page.locator('[data-section-tab="'+root+':'+section+'"]');
      await button.click();
      assert.equal(await button.getAttribute('aria-selected'),'true',root+'/'+section+' nao selecionada');
      const geometry=await page.evaluate(root=>{
        const view=document.querySelector('.view[data-view="'+root+'"]');
        const chrome=view.querySelector('.v31-command-chrome');
        const nav=chrome?.querySelector('.v31-command-tabs');
        const board=view.querySelector('.v31-command-metrics');
        const cards=board?[...board.querySelectorAll('.v31-command-kpi')]:[];
        const active=nav?.querySelector('[aria-selected="true"]');
        const styles=active?getComputedStyle(active):null;
        return {order:!!chrome&&!!nav&&!!board&&chrome.nextElementSibling===board,
          icons:[...nav.querySelectorAll('[data-section-tab]')].every(b=>!!b.querySelector('.v31-tab-icon')&&!!b.querySelector('.v31-tab-label')),
          cards:cards.length,values:cards.map(c=>c.querySelector('strong').textContent.trim()),
          selectedIcon:!!active?.querySelector('.v31-tab-icon'),
          glow:!!styles&&styles.boxShadow!=='none',
          chromePosition:chrome?getComputedStyle(chrome).position:null,
          modalLayout:getComputedStyle(view).display,
          modalDirection:getComputedStyle(view).flexDirection,
          modalOverflow:getComputedStyle(view).overflowY,
          activePane:view.querySelector(':scope > .v23-subpane:not([hidden])')?.dataset.sectionPane,
          paneOverflow:getComputedStyle(view.querySelector(':scope > .v23-subpane:not([hidden])')).overflowY,
          paneHeight:view.querySelector(':scope > .v23-subpane:not([hidden])')?.getBoundingClientRect().height,
          modalHeight:view.getBoundingClientRect().height,
          screenHeight:innerHeight};
      },root);
      if(root==='empresa'&&section==='analises'){
        assert.equal(await page.locator('#v221-observatory').count(),1);
        await page.locator('#v221-observatory summary').click();
        assert.ok(await page.locator('#regional-population').isVisible(),'IBGE não migrou para Análises');
      }
      if(root==='sistema'&&section==='saves'){
        assert.equal(await page.locator('#v31-city-manager').isVisible(),true,'Acesso alternativo a cidades indisponível');
      }
      assert.equal(geometry.order,true,'KPI deve abrir imediatamente abaixo do trilho: '+root+'/'+section);
      assert.equal(geometry.icons,true,'Aba sem icone ou titulo curto: '+root);
      assert.equal(geometry.cards,4,'Modal sem 4 KPIs: '+root+'/'+section);
      assert.ok(geometry.values.every(v=>v&&v!=='—'&&!v.includes('undefined')),'KPI nao renderizado: '+root+'/'+section);
      assert.equal(geometry.selectedIcon,true,'Aba selecionada sem icone: '+root+'/'+section);
      assert.equal(geometry.glow,true,'Aba ativa sem iluminacao: '+root+'/'+section);
      assert.equal(geometry.chromePosition,'relative','Cabeçalho deve integrar fluxo fixo do modal');
      assert.equal(geometry.modalLayout,'flex','Modal nao usa flex vertical: '+root+'/'+section);
      assert.equal(geometry.modalDirection,'column','Flex modal nao e coluna');
      assert.equal(geometry.modalOverflow,'hidden','Modal inteiro continua rolando');
      assert.equal(geometry.activePane,root+':'+section,'Aba ativa sem seu painel');
      assert.equal(geometry.paneOverflow,'auto','Rolagem deve ficar somente no pane');
      assert.ok(geometry.paneHeight>=110,'Painel ativo sem altura util: '+root+'/'+section);
      if(width<700)assert.ok(Math.abs(geometry.modalHeight-.92*geometry.screenHeight)<4,
        'Bottom sheet nao ocupa 92dvh: '+JSON.stringify(geometry));
    }
    // Rolar uma aba longa nao pode deslocar titulo, abas, KPIs ou o botao X.
    const scrollSection={mercado:'compras',empresa:'dashboard',administrativo:'financas',sistema:'integridade'}[root];
    await page.locator('[data-section-tab="'+root+':'+scrollSection+'"]').click();
    const scroll=await page.evaluate(root=>{
      const modal=document.querySelector('.view[data-view="'+root+'"]');
      const pane=modal.querySelector(':scope > .v23-subpane:not([hidden])');
      const chrome=modal.querySelector('.v31-command-chrome');
      const board=modal.querySelector('.v31-command-metrics');
      const close=modal.querySelector('#v31-overlay-close');
      const before=[chrome,board,close].map(x=>x.getBoundingClientRect().top);
      const possible=pane.scrollHeight>pane.clientHeight+5;
      pane.scrollTop=180;
      const actual=pane.scrollTop;
      const after=[chrome,board,close].map(x=>x.getBoundingClientRect().top);
      return {possible,actual,stable:before.every((v,i)=>Math.abs(after[i]-v)<1),
        modalScrollTop:modal.scrollTop,paneOverflow:getComputedStyle(pane).overflowY,
        panels:[...modal.querySelectorAll(':scope > .v23-subpane')].length};
    },root);
    assert.ok(scroll.stable,'Cabecalho/KPIs/X deslocaram com rolagem: '+root);
    assert.equal(scroll.modalScrollTop,0,'Modal exterior rolou: '+root);
    if(scroll.possible)assert.ok(scroll.actual>0,'Conteudo longo nao rola: '+root);
    assert.equal(scroll.paneOverflow,'auto');
    assert.equal(scroll.panels,sections.length,'Painéis de '+root+' incompletos');
    if(root==='sistema'){
      await page.locator('[data-section-tab="sistema:saves"]').click();
      assert.ok(await page.locator('#export-btn').isVisible(),'Exportacao perdida');
      await page.locator('[data-section-tab="sistema:diagnostico"]').click();
      assert.ok(await page.locator('#run-diagnostic').isVisible(),'Diagnostico perdido');
      await page.locator('[data-section-tab="sistema:integridade"]').click();
      assert.ok(await page.locator('#qa-save-health-btn').isVisible(),'Integridade do save perdida');
    }
    await page.screenshot({path:join(out,channel+'-'+width+'-'+root+'-tycoon.png')});
  }
  // Retornar ao Mercado para manter os testes de Escape, backdrop e hierarquia.
  await page.locator('#v31-overlay-close').click();
  await page.locator('#v31-dock [data-v31-open="mercado:compras"]').click();
  await page.screenshot({path:join(out,channel+'-'+width+'-overlay.png')});
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#v31-backdrop').isVisible(),false,'Esc nao fechou backdrop');
  await page.locator('#v31-dock [data-v31-open="mercado:compras"]').click();
  await page.locator('#v31-backdrop').click({position:{x:4,y:4}});
  assert.equal(await page.locator('[data-view="mercado"]').isVisible(),false,'Backdrop nao fechou modal');
  await page.locator('#v31-dock [data-v31-open="mercado:compras"]').click();
  await page.locator('#v31-overlay-close').click();
  assert.equal(await page.locator('#v31-backdrop').isVisible(),false);
  const after=await page.evaluate(async()=>{
   const raw=await CidadeDurableStore.readCurrent(CidadeCore),s=CidadeCore.importSave(raw).state;
   return {revision:s.revision,tick:s.calendar.tick,cash:CidadeCore.overview(s).cash,schema:s.schemaVersion, lastCommand:Object.keys(s.audit.commands).slice(-1)[0],lastEvent:s.audit.events.at(-1)?.type};
  });
  assert.deepEqual(after,before,'Camera e overlays nao alteram save');
  assert.equal(await page.locator('.sidebar').count(),0,'Sidebar reapareceu depois dos modais');
  assert.equal(await page.locator('#map-canvas').isVisible(),true,'Cidade desapareceu depois dos modais');
  await page.reload({waitUntil:'load'});await page.waitForFunction(()=>document.body.dataset.storageReady==='ready');
  assert.equal(await page.locator('#v31-camera-label').textContent(),'100%','Reload deve reiniciar com zoom natural');
  await page.locator('#v31-camera-home').click();
  assert.equal(await page.locator('#map-canvas [data-lot]').count(),18);
  await page.locator('#map-lot-picker').focus();
  await page.locator('#map-lot-picker').selectOption('2');
  assert.equal(await page.locator('#v31-lot-quick').isVisible(),true);
  await page.screenshot({path:join(out,channel+'-'+width+'-cidade.png')});
  assert.equal(errors.length,0,errors.join(';'));
  results.push({channel,width,result:'PASS',fullscreen:true,centeredDock:true,tycoonTabs:true,perSectionKpis:true,
    compactOnboarding:true,noClassicMode:true,modalFlexScroll:true,mobileBottomSheet92dvh:true,allSections:17,
    mapControlsHidden:true,hudOneLine:true,nonInteractiveBanner:true,noSvgLegend:true,viewportFit:true,defaultZoom100:true,observatoryInAnalytics:true,accessibleLotPicker:true,modals:true,escape:true,backdrop:true,lotHitTest:true,economyUnaffected:true});
 }finally{if(ctx)await ctx.close();rmSync(folder,{recursive:true,force:true});}
}
writeFileSync(join(out,'report.json'),JSON.stringify({status:'PASS_EMULATED',physicalMobileTested:false,privateSaveTested:false,results},null,2));
console.log('V310_VISUAL_QA '+JSON.stringify({status:'PASS_EMULATED',scenarios:results.length}));
