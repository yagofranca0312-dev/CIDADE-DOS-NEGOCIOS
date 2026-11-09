import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const url=pathToFileURL(resolve('index.html')).href,out=join(process.env.RUNNER_TEMP||tmpdir(),'v310-visual-evidence');
mkdirSync(out,{recursive:true});
const results=[];
for(const channel of ['chrome','msedge'])for(const width of [320,390,768,1366]){
 const folder=mkdtempSync(join(tmpdir(),'cidade-v310-'+channel+'-'));let ctx;
 try{
  ctx=await chromium.launchPersistentContext(folder,{channel,headless:true,viewport:{width,height:width<600?844:900},isMobile:width<600,hasTouch:width<600});
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
  // Viewport real, sem menu lateral e sem altura de painel ERP.
  const geometry=await page.evaluate(()=>{
    const canvas=document.getElementById('map-canvas'),svg=canvas.querySelector('svg');
    const r=canvas.getBoundingClientRect(),sr=svg.getBoundingClientRect();
    const dock=document.getElementById('v31-dock').getBoundingClientRect();
    const sidebar=document.querySelector('.sidebar');
    const metric=(id)=>document.getElementById(id).textContent;
    return {width:innerWidth,height:innerHeight,map:{x:r.x,y:r.y,w:r.width,h:r.height},
      svg:{w:sr.width,h:sr.height},
      dock:{x:dock.x,w:dock.width},
      sidebarRemoved:sidebar===null,
      classicControls:document.querySelectorAll('#v31-classic-switch,#v31-classic-return').length,
      topbarHidden:getComputedStyle(document.querySelector('.topbar')).display==='none',
      scrollWidth:document.documentElement.scrollWidth,
      cash:metric('v31-hud-cash'),date:metric('v31-hud-date')};
  });
  assert.equal(geometry.sidebarRemoved,true,'Sidebar ERP nao foi removida do HTML');
  assert.equal(geometry.classicControls,0,'Alternancia classica ainda existe');
  assert.equal(geometry.topbarHidden,true,'Topbar antigo ainda ocupa a tela');
  assert.ok(Math.abs(geometry.map.x)<=2 && Math.abs(geometry.map.y)<=2,'Mapa nao inicia na origem da viewport');
  assert.ok(geometry.map.w>=width-2 && geometry.map.h>=geometry.height-2,'Mapa nao ocupa 100% da viewport');
  assert.ok(geometry.svg.w>=width-3 && geometry.svg.h>=geometry.height-3,'Cena SVG nao cobre a viewport');
  assert.ok(geometry.scrollWidth<=width+4,'Rolagem horizontal fora do viewport');
  assert.ok(Math.abs(geometry.dock.x+geometry.dock.w/2-width/2)<=4,'Dock nao centralizada');
  assert.ok(geometry.cash!=='—' && geometry.date!=='—','HUD sem dados reais da carreira');
  // HUD mobile rigidamente em uma única linha e semanticamente acessível.
  if(width<=768){
    const hud=await page.evaluate(()=>{
      const el=document.querySelector('.v31-top-controls'),r=el.getBoundingClientRect(),
        cs=getComputedStyle(el),items=[...el.children].filter(x=>getComputedStyle(x).display!=='none');
      const centers=items.map(x=>Math.round(x.getBoundingClientRect().top+x.getBoundingClientRect().height/2));
      return {height:r.height,wrap:cs.flexWrap,overflow:cs.overflowX,
        maxHeight:cs.maxHeight,rowSpread:Math.max(...centers)-Math.min(...centers),
        pause:document.querySelector('#v31-hud-pause').textContent.trim(),
        day:document.querySelector('#v31-next-day').textContent.trim(),
        turns:document.querySelector('#v31-hud-turns').textContent.trim(),
        events:document.querySelector('#v31-alert-count').textContent.trim(),
        speedLabel:document.querySelector('#v31-hud-speed').getAttribute('aria-label'),
        scrollable:el.scrollWidth>=el.clientWidth};
    });
    assert.ok(hud.height<=48.6,'HUD excedeu 48px: '+JSON.stringify(hud));
    assert.equal(hud.wrap,'nowrap','HUD mobile quebrou linha');
    assert.equal(hud.overflow,'auto','HUD mobile não é horizontalmente rolável');
    assert.ok(hud.rowSpread<7,'Controles estão em mais de uma linha: '+JSON.stringify(hud));
    assert.ok(['▶','❚❚'].includes(hud.pause),'Tempo ainda exibe texto longo');
    assert.equal(hud.day,'+1','Botão dia ainda exibe texto longo');
    assert.equal(hud.turns,'⏭','Botão turnos ainda exibe texto longo');
    assert.match(hud.events,/^\d+$/,'Contador de eventos não é compacto');
    assert.equal(hud.speedLabel,'Velocidade do tempo');
  }
  // Componentes legados nunca podem aparecer por trás da dock.
  const residual=await page.evaluate(()=>({
    units:getComputedStyle(document.getElementById('unit-switch-container')).display,
    sidebar:document.querySelector('.sidebar-brand')?.getBoundingClientRect().width||0,
    cityInfoCount:document.querySelectorAll('.v221-city-info-trigger').length,
    switchHidden:document.body.classList.contains('v221-tiangua-scene')
      ?getComputedStyle(document.getElementById('v221-city-switch-trigger')).opacity==='0':true
  }));
  assert.equal(residual.units,'none','Unidade ativa legada ainda aparece');
  assert.equal(residual.sidebar,0,'Brand lateral residual ocupa o mapa');
  assert.equal(residual.cityInfoCount,0,'Botão Cidade duplicado ainda existe');
  assert.equal(residual.switchHidden,true,'Letreiro SVG ainda tem caixa de texto duplicada');
  const before=await page.evaluate(async()=>{
   const raw=await CidadeDurableStore.readCurrent(CidadeCore),s=CidadeCore.importSave(raw).state;
   return {revision:s.revision,tick:s.calendar.tick,cash:CidadeCore.overview(s).cash,schema:s.schemaVersion};
  });
  await page.locator('#v31-camera-plus').click();
  await page.locator('#v31-camera-minus').click();
  await page.locator('#v31-camera-plus').click();
  // Clique no SVG transformado valida a geometria real do lote, nao o seletor auxiliar.
  await page.locator('#map-canvas [data-lot="10"]').click();
  assert.match(await page.locator('#selected-lot').textContent(),/Lote 10/);
  assert.equal(await page.locator('#v31-lot-quick').isVisible(),true);
  const panBefore=await page.locator('#map-canvas').evaluate(el=>el.scrollLeft);
  await page.locator('#map-canvas').focus();
  await page.keyboard.press('ArrowRight');
  const panAfter=await page.locator('#map-canvas').evaluate(el=>el.scrollLeft);
  assert.ok(panAfter>panBefore,'Pan por teclado nao moveu a camera');
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
  // O hotspot transparente acompanha o letreiro da arte, sem bloco de texto extra.
  if(await page.locator('#map-canvas .v31-city-art-hotspot').count()){
    await page.locator('#map-canvas .v31-city-art-hotspot').click();
    assert.equal(await page.locator('[data-view="sistema"]').isVisible(),true,'Letreiro não abre seletor');
    assert.equal(await page.locator('#v221-city-pick').isVisible(),true,'Municípios indisponíveis');
    assert.equal(await page.locator('#v221-city-selector').isVisible(),true);
    await page.locator('#v31-overlay-close').click();
  }
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
   return {revision:s.revision,tick:s.calendar.tick,cash:CidadeCore.overview(s).cash,schema:s.schemaVersion};
  });
  assert.deepEqual(after,before,'Camera e overlays nao alteram save');
  assert.equal(await page.locator('.sidebar').count(),0,'Sidebar reapareceu depois dos modais');
  assert.equal(await page.locator('#map-canvas').isVisible(),true,'Cidade desapareceu depois dos modais');
  await page.reload({waitUntil:'load'});await page.waitForFunction(()=>document.body.dataset.storageReady==='ready');
  assert.equal(await page.locator('#v31-camera-label').textContent(),'125%');
  await page.locator('#v31-camera-home').click();
  assert.equal(await page.locator('#map-canvas [data-lot]').count(),18);
  await page.locator('#map-lot-picker').focus();
  await page.locator('#map-lot-picker').selectOption('2');
  assert.equal(await page.locator('#v31-lot-quick').isVisible(),true);
  await page.screenshot({path:join(out,channel+'-'+width+'-cidade.png')});
  assert.equal(errors.length,0,errors.join(';'));
  results.push({channel,width,result:'PASS',fullscreen:true,centeredDock:true,tycoonTabs:true,perSectionKpis:true,
    compactOnboarding:true,noClassicMode:true,modalFlexScroll:true,mobileBottomSheet92dvh:true,allSections:17,
    mapControlsHidden:true,hudOneLine:true,cityArtHotspot:true,observatoryInAnalytics:true,accessibleLotPicker:true,modals:true,escape:true,backdrop:true,lotHitTest:true,economyUnaffected:true});
 }finally{if(ctx)await ctx.close();rmSync(folder,{recursive:true,force:true});}
}
writeFileSync(join(out,'report.json'),JSON.stringify({status:'PASS_EMULATED',physicalMobileTested:false,privateSaveTested:false,results},null,2));
console.log('V310_VISUAL_QA '+JSON.stringify({status:'PASS_EMULATED',scenarios:results.length}));
