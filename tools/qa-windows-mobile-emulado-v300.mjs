/**
 * QA V3.0 complementar: mobile EMULADO por Chrome/Edge Windows hosted.
 * NUNCA declarar como ensaio em telefone fisico.
 * Nao importa save pessoal, nao publica release, nao altera o motor.
 */
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

assert.equal(process.platform,'win32','Este QA exige Windows hosted para Chrome/Edge.');
const URL=pathToFileURL(resolve('index.html')).href;
const OUT=join(process.env.RUNNER_TEMP||tmpdir(),'v300-mobile-emulado-final');
mkdirSync(OUT,{recursive:true});
const report={contract:'V300_MOBILE_EMULATED_QA_V1',
  scope:'Chrome/Edge Windows hosted emulated touch and viewport',
  physicalMobileTested:false,personalSaveUsed:false,personalWindowsTested:false,
  dimensions:[320,390,768],results:[],failures:[],releaseAuthorized:false};
const safeName=x=>x.replace(/[^a-z0-9-]/gi,'-');
async function stateInfo(page){
  return page.evaluate(async()=>{
    const raw=await CidadeDurableStore.readCurrent(CidadeCore);
    if(!raw)return null;
    const s=CidadeCore.importSave(raw).state;
    return {revision:s.revision,tick:s.calendar.tick,date:s.calendar.date,
      ledger:s.economy.ledger.length,events:s.audit.events.length,
      units:CidadeCore.businesses(s).length,
      balanced:CidadeCore.balanceSheet(s).balanced,
      reconciliation:CidadeCore.reconciliationReport(s).ok,
      storage:CidadeDurableStore.mode()};
  });
}
async function ready(page){
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready',
    {timeout:30000});
}
async function nav(page,root,section){
  // O backdrop é modal: fechar janela aberta antes de acionar outro item da dock.
  const close=page.locator('#v31-overlay-close');
  if(await close.isVisible())await close.click();
  // V3.1 mantém os formulários antigos dentro dos overlays, acessíveis pelo dock.
  const target={empresa:'empresa:dashboard',mercado:'mercado:compras',
    administrativo:'administrativo:rh-dp',sistema:'sistema'}[root];
  const dock=page.locator('#v31-dock [data-v31-open="'+target+'"]');
  if(await dock.isVisible())await dock.tap();
  else if(root==='sistema'){
    const top=page.locator('.topbar .mobile-settings[data-tab="sistema"]');
    if(await top.isVisible())await top.tap();
    else await page.locator('.sidebar-tools [data-tab="sistema"]').tap();
  }else await page.locator('.nav-primary [data-tab="'+root+'"]').tap();
  assert.equal(await page.locator('[data-view="'+root+'"]').isVisible(),true,
    'Aba '+root+' nao abriu');
  if(section){
    const button=page.locator('[data-section-tab="'+root+':'+section+'"]');
    await button.tap();
    assert.equal(await page.locator('[data-section-pane="'+root+':'+section+'"]').isVisible(),true,
      'Subarea '+section+' nao abriu');
  }
}
async function layout(page,width,label){
  const obj=await page.evaluate(()=>{
    const nav=[...document.querySelectorAll('.nav-primary [data-tab],#v31-dock [data-v31-open]')]
      .filter(x=>{const r=x.getBoundingClientRect();const st=getComputedStyle(x);
        return st.display!=='none'&&r.width>0&&r.height>0;})
      .map(x=>({tab:x.dataset.tab||x.dataset.v31Open,width:x.getBoundingClientRect().width,
        height:x.getBoundingClientRect().height}));
    return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      nav,gameVisible:!document.getElementById('game-shell').hidden};
  });
  assert.equal(obj.viewport,width,label+' viewport divergente');
  assert.equal(obj.gameVisible,true,label+' game-shell invisivel');
  assert.ok(obj.nav.length>=4,label+' controles de navegacao ausentes');
  assert.ok(obj.nav.every(b=>b.width>=32&&b.height>=32),
    label+' alvo de navegacao menor que 32px');
  assert.ok(obj.scrollWidth<=width+4,
    label+' rolagem horizontal da pagina: '+obj.scrollWidth+' > '+width);
  return obj;
}
async function run(channel,width){
  const dir=mkdtempSync(join(tmpdir(),'cdn-v300-mobile-'+channel+'-'+width+'-'));
  const errors=[],label=channel+'-'+width;
  const result={channel,width,emulated:true,touch:true,status:'RUNNING'};
  let ctx;
  try{
    const options={channel,headless:true,viewport:{width,height:844},
      isMobile:true,hasTouch:true,deviceScaleFactor:2,acceptDownloads:true,
      args:['--no-first-run','--disable-background-networking','--disable-extensions']};
    ctx=await chromium.launchPersistentContext(dir,options);
    let page=ctx.pages()[0]??await ctx.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(URL,{waitUntil:'load',timeout:50000});
    await ready(page);
    await page.locator('#player-name').fill('QA Mobile Ficticia');
    await page.locator('#company-name').fill('Empresa QA Mobile');
    await page.locator('#start-city').selectOption('CE-TIANGUA');
    await page.locator('#career-form button[type="submit"]').tap();
    await page.locator('#game-shell').waitFor({state:'visible',timeout:20000});
    let s=await stateInfo(page);
    assert.ok(s&&s.units===0&&s.balanced&&s.reconciliation,
      label+' carreira inicial invalida');
    result.initialLayout=await layout(page,width,label+' Cidade inicial');
    await page.screenshot({path:join(OUT,safeName(label)+'-cidade.png'),fullPage:true});
    await page.locator('#map-lot-picker').selectOption('2');
    await page.locator('#map-open-company').tap();
    await page.locator('#sector-select').selectOption('mercado');
    await page.locator('#open-form button[type="submit"]').tap();
    // O submit e assincrono: nunca interpretar um snapshot anterior como falha da UI.
    await page.waitForFunction(()=>document.getElementById('v221-hud-count')?.textContent?.includes('1/5'),
      null,{timeout:30000});
    await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true',
      null,{timeout:30000});
    s=await stateInfo(page);
    assert.ok(s&&s.units===1&&s.balanced&&s.reconciliation,
      label+' empresa nao inaugurada');
    await page.locator('#v221-hud-time').tap();
    await page.locator('[data-v221-time="1"]').tap();
    await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true',
      {timeout:30000});
    const day=await stateInfo(page);
    assert.ok(day&&day.tick===s.tick+1&&day.revision>s.revision&&day.balanced&&day.reconciliation,
      label+' toque de avancar dia nao persistiu');
    await nav(page,'empresa','dashboard');
    await nav(page,'mercado','compras');
    await nav(page,'administrativo','financas');
    await nav(page,'administrativo','contabilidade');
    await nav(page,'administrativo','rh-dp');
    await nav(page,'administrativo','logistica');
    await nav(page,'administrativo','fiscal');
    await nav(page,'administrativo','paralegal');
    await nav(page,'sistema');
    const afterRead=await stateInfo(page);
    assert.deepEqual(afterRead,day,label+' leitura de menus alterou save');
    result.adminLayout=await layout(page,width,label+' Gestao');
    await page.screenshot({path:join(OUT,safeName(label)+'-gestao.png'),fullPage:true});
    await ctx.close();ctx=null;
    ctx=await chromium.launchPersistentContext(dir,options);
    page=ctx.pages()[0]??await ctx.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(URL,{waitUntil:'load',timeout:50000});
    await ready(page);
    const reopened=await stateInfo(page);
    assert.deepEqual(reopened,day,label+' reabertura perdeu progresso');
    assert.equal(errors.length,0,label+' erros JavaScript: '+errors.join('; '));
    result.lastTick=reopened.tick;
    result.lastRevision=reopened.revision;
    result.storage=reopened.storage;
    result.javascriptErrors=errors.length;
    result.status='PASS_EMULATED';
  }catch(e){
    result.status='FAIL';
    result.error=String(e.message).slice(0,500);
    report.failures.push({channel,width,error:result.error});
    console.error('V300_MOBILE_EMULATED_FAILURE '+JSON.stringify(result));
  }finally{
    report.results.push(result);
    if(ctx)await ctx.close();
    rmSync(dir,{recursive:true,force:true});
  }
}
for(const channel of ['chrome','msedge'])
  for(const width of [320,390,768])await run(channel,width);
report.status=report.failures.length?'FAIL':'PASS_ALL_EMULATED';
writeFileSync(join(OUT,'relatorio.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log('V300_MOBILE_EMULATED_QA '+JSON.stringify({
  status:report.status,scenarios:report.results.length,
  passed:report.results.filter(x=>x.status==='PASS_EMULATED').length,
  failures:report.failures,physicalMobileTested:false,
  personalSaveUsed:false,releaseAuthorized:false,
  caveat:'Viewport/touch simulados no Windows hosted nao certificam telefone fisico.'
}));
if(report.failures.length)process.exitCode=1;
