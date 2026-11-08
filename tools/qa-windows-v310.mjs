import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const url=pathToFileURL(resolve('index.html')).href,out=join(process.env.RUNNER_TEMP||tmpdir(),'v310-visual-evidence');
mkdirSync(out,{recursive:true});
const results=[];
for(const channel of ['chrome','msedge'])for(const width of [390,1366]){
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
    administrativo:['financas','logistica','rh-dp','contabilidade','fiscal','paralegal']};
  let activeRoot='mercado';
  for(const [root,sections] of Object.entries(panels)){
    if(root!==activeRoot){
      await page.locator('#v31-overlay-close').click();
      await page.locator('#v31-dock [data-v31-open="'+(root==='empresa'?'empresa:dashboard':'administrativo:financas')+'"]').click();
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
          chromeSticky:chrome?getComputedStyle(chrome).position:null};
      },root);
      assert.equal(geometry.order,true,'KPI deve abrir imediatamente abaixo do trilho: '+root+'/'+section);
      assert.equal(geometry.icons,true,'Aba sem icone ou titulo curto: '+root);
      assert.equal(geometry.cards,4,'Modal sem 4 KPIs: '+root+'/'+section);
      assert.ok(geometry.values.every(v=>v&&v!=='—'&&!v.includes('undefined')),'KPI nao renderizado: '+root+'/'+section);
      assert.equal(geometry.selectedIcon,true,'Aba selecionada sem icone: '+root+'/'+section);
      assert.equal(geometry.glow,true,'Aba ativa sem iluminacao: '+root+'/'+section);
      assert.equal(geometry.chromeSticky,'sticky','Cabecalho/trilho nao fixados');
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
  await page.locator('#map-lot-picker').selectOption('2');
  assert.equal(await page.locator('#v31-lot-quick').isVisible(),true);
  await page.screenshot({path:join(out,channel+'-'+width+'-cidade.png')});
  assert.equal(errors.length,0,errors.join(';'));
  results.push({channel,width,result:'PASS',fullscreen:true,centeredDock:true,tycoonTabs:true,perSectionKpis:true,
    compactOnboarding:true,noClassicMode:true,modals:true,escape:true,backdrop:true,lotHitTest:true,economyUnaffected:true});
 }finally{if(ctx)await ctx.close();rmSync(folder,{recursive:true,force:true});}
}
writeFileSync(join(out,'report.json'),JSON.stringify({status:'PASS_EMULATED',physicalMobileTested:false,privateSaveTested:false,results},null,2));
console.log('V310_VISUAL_QA '+JSON.stringify({status:'PASS_EMULATED',scenarios:results.length}));
