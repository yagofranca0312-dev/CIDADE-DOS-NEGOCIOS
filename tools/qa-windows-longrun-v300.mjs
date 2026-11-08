/**
 * V3.0 P1-03: stress de CARREIRA LONGA no navegador real.
 * - 365 e 1825 dias, 1 e 5 empresas, Chrome + Edge, Windows hospedado.
 * - O AVANÇO no navegador é exclusivamente via HUD real -> comando original.
 * - Fixture com cinco empresas é gerada pelo Core em Node, COM CAPITAL
 *   ARTIFICIAL DE LABORATÓRIO, importada pela UI, não é gameplay comercial.
 * - Quota cheia -> classifica BLOCKED_QUOTA, confirma rollback do progresso,
 *   sem produzir falsos PASS. Nunca toca usuário, main ou pasta pessoal.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

assert.equal(process.platform,'win32','QA long-run deve ocorrer no Windows hospedado real.');
const TARGET=pathToFileURL(resolve('index.html')).href;
const KEY='cidade-dos-negocios-save-v1';
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const report={contract:'V300_LONG_BROWSER_QA_V1',platform:process.platform,
  environment:'GitHub-hosted Windows; Chrome/Edge headless; file:// single offline HTML',
  targetsDays:[365,1825],unitVariants:[1,5],scenarios:[],hardFailures:[],
  userSaveUsed:false,personalWindowsTested:false,mobileDeviceTested:false,
  humanVisualReviewCompleted:false,longrunAutomatedOnly:true,
  fixtureFiveUnitsUsesSyntheticCapital:true,mainTouched:false,
  releaseApproved:false};
function syntheticFiveUnits(){
  let result=Core.dispatch(null,{type:'CARREIRA.CRIAR',id:'longrun-fixture-career',
    payload:{name:'QA car. sintética',companyName:'QA 5 unidades (APORTE LAB)',cityId:'CE-TIANGUA',seed:300815}});
  assert.equal(result.ok,true,result.error);
  let state=result.state;
  const amount=3000000;
  state.economy.ledger.push({
    id:'jnl-'+(++state.economy.journalSeq),date:state.calendar.date,
    memo:'APORTE DE FIXTURE SINTÉTICO; NAO GAMEPLAY NEM PATRIMÔNIO REAL',
    kind:'CAPITAL',entries:[
      {account:'CASH',debit:amount,credit:0},
      {account:'CAPITAL',debit:0,credit:amount}
    ]
  });
  Core.validate(state);
  for(let i=0;i<5;i++){
    result=Core.dispatch(state,{type:'EMPRESA.ABRIR',id:'longrun-open-'+i,
      payload:{cityId:'CE-TIANGUA',lot:i+1,sector:['mercado','padaria','roupas'][i%3]}});
    assert.equal(result.ok,true,result.error);
    state=result.state;
  }
  assert.equal(Core.businesses(state).length,5);
  return Core.exportSave(state);
}
async function launch(folder,channel){
  return chromium.launchPersistentContext(folder,{channel,headless:true,
    acceptDownloads:true,viewport:{width:1366,height:900},
    args:['--no-first-run','--disable-background-networking','--disable-extensions']});
}
async function startPage(context,errors){
  const page=context.pages()[0]??await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',async d=>{if(d.type()==='confirm')await d.accept();else await d.dismiss();});
  await page.goto(TARGET,{waitUntil:'load',timeout:50000});
  await page.locator('#career-form').waitFor({state:'attached',timeout:15000});
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready',{timeout:20000});
  return page;
}
async function create(page,units){
  if(units===5){
    // Estado preparatório sintético (não contamina o motor/versão do jogo).
    await page.locator('#import-file').setInputFiles({
      name:'carreira-cinco-unidades-ficticia.json',
      mimeType:'application/json',
      buffer:Buffer.from(syntheticFiveUnits())
    });
    await page.locator('#game-shell').waitFor({state:'visible',timeout:20000});
    return 'fixture-core-importada-por-input-real-com-aporte-sintetico';
  }
  await page.locator('#player-name').fill('QA browser longa');
  await page.locator('#company-name').fill('Empresa sintética QA');
  await page.locator('#start-city').selectOption('CE-TIANGUA');
  await page.locator('#career-form button[type=submit]').click();
  await page.locator('#v221-hud-time').waitFor({state:'visible'});
  await page.locator('#map-lot-picker').selectOption('1');
  await page.locator('#map-open-company').click();
  await page.locator('#sector-select').selectOption('mercado');
  await page.locator('#open-form button[type=submit]').click();
  await page.locator('#v221-hud-time').waitFor({state:'visible'});
  return 'carreira-e-inauguracao-por-UI-real-sem-aporte';
}
const round=x=>Number.isFinite(x)?Math.round(x*100)/100:null;
async function heapMB(ctx,page){
  try{
    const session=await ctx.newCDPSession(page);
    await session.send('Performance.enable');
    const out=await session.send('Performance.getMetrics');
    await session.detach();
    const heap=out.metrics.find(x=>x.name==='JSHeapUsedSize')?.value;
    return heap===undefined?null:round(heap/1048576);
  }catch{return null;}
}
async function inspect(page){
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready'&&document.body.dataset.storageBusy!=='true',{timeout:50000});
  return page.evaluate(async key=>{
    const raw=await CidadeDurableStore.readCurrent(CidadeCore);
    if(!raw)return {present:false};
    const start=performance.now();
    const state=CidadeCore.importSave(raw).state;
    const importMs=performance.now()-start;
    const check=CidadeCore.reconciliationReport(state);
    const sheet=CidadeCore.balanceSheet(state);
    const units=CidadeCore.businesses(state);
    const o=CidadeCore.overview(state);
    const compactAt=performance.now();
    const compact=CidadeCore.exportSaveCompact(state);
    const compactMs=performance.now()-compactAt;
    const compactBack=CidadeCore.importSave(compact).state;
    const equal=JSON.stringify(compactBack)===JSON.stringify(state);
    return {present:true,tick:state.calendar.tick,revision:state.revision,
      date:state.calendar.date,units:units.length,schema:state.schemaVersion,
      saveChars:raw.length,saveBytes:new Blob([raw]).size,
      compactChars:compact.length,compactBytes:new Blob([compact]).size,
      importMs,compactMs,compactRoundtrip:equal,
      ledger:state.economy.ledger.length,events:state.audit.events.length,
      cashCents:o.cash,revenueCents:o.revenue,
      balanced:sheet.balanced,balancingDifference:sheet.difference,
      reconciliationOK:check.ok,reconciliationErrors:check.errors,
      autosave:document.getElementById('autosave-label')?.textContent};
  },KEY);
}
function assertIntegrity(result,label,units){
  assert.equal(result.present,true,label+' sem save');
  assert.equal(result.schema,9,label+' schema divergiu');
  assert.equal(result.units,units,label+' unidades divergiu');
  assert.equal(result.balanced,true,label+' balanço divergente');
  assert.equal(result.balancingDifference,0,label+' diferença no balanço');
  assert.equal(result.reconciliationOK,true,label+': '+result.reconciliationErrors.join(';'));
  assert.equal(result.compactRoundtrip,true,label+' save compacto perdeu dados');
}
function stepsFor(n){
  const steps=[];
  while(n>0){
    const step=n>=30?30:n>=7?7:1;
    steps.push(step);n-=step;
  }
  return steps;
}
async function hudAdvance(page,days){
  // ACIONA o controle de jogo visível. Não chama Core.dispatch na página.
  const startDate=await page.locator('#date-label').textContent();
  const t=performance.now();
  await page.locator('#v221-hud-time').click();
  await page.locator('[data-v221-time="'+days+'"]').click();
  await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true',{timeout:50000});
  const elapsed=performance.now()-t;
  const endDate=await page.locator('#date-label').textContent();
  const status=await page.locator('#autosave-label').textContent();
  return {elapsedMs:round(elapsed),dateChanged:startDate!==endDate,
    quotaError:status.includes('Salvamento local indisponível'),
    failClosedText:status.includes('NÃO confirmada')};
}
async function exportAndReload(page,ctx,expected,errors){
  // Botão original: arquivo JSON gerado de fato pelo browser Windows.
  await page.locator('#v221-config-open').click();
  const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:30000}),
    page.locator('#export-btn').click()
  ]);
  const path=await download.path();
  assert.ok(path&&download.suggestedFilename().endsWith('.json'),
    'Exportação não produziu JSON real do navegador');
  const bytes=readFileSync(path);
  const raw=bytes.toString('utf8');
  const state=Core.importSave(raw).state;
  assert.equal(state.calendar.tick,expected.tick);
  assert.equal(Core.businesses(state).length,expected.units);
  assert.equal(state.revision,expected.revision,'Download não contém última revisão');
  assert.ok(bytes.byteLength>0&&bytes.byteLength<25000000,'Exportação tradicional inválida ou excedente');
  const out={exportedBytes:bytes.byteLength,exportMs:null,
    exportHash16:sha(bytes).slice(0,16)};
  await page.reload({waitUntil:'load'});
  await page.locator('#game-shell').waitFor({state:'visible',timeout:25000});
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready',{timeout:25000});
  const persisted=await page.evaluate(async key=>{
    const raw=await CidadeDurableStore.readCurrent(CidadeCore);
    const s=CidadeCore.importSave(raw).state;
    return {tick:s.calendar.tick,revision:s.revision,units:CidadeCore.businesses(s).length};
  },KEY);
  assert.equal(persisted.tick,expected.tick,'Reabertura do navegador perdeu dia');
  assert.equal(persisted.revision,expected.revision,'Reabertura perdeu revisão');
  assert.equal(persisted.units,expected.units,'Reabertura perdeu filial');
  assert.equal(errors.length,0,'pageerror após reload: '+errors.join(';'));
  out.reloaded=true;
  return out;
}
async function scenario(channel,units){
  const folder=mkdtempSync(join(tmpdir(),'cidade-v3-long-browser-'+channel+'-'+units+'-'));
  const errors=[];
  const result={channel,units,windowsHosted:true,headless:true,fromUI:true,
    fixtureSyntheticCapital:units===5,targets:[365,1825],milestones:[],status:'RUNNING'};
  let ctx;
  let label=channel+' '+units+' unidades';
  try{
    ctx=await launch(folder,channel);
    let page=await startPage(ctx,errors);
    result.origin=await create(page,units);
    const baseline=await inspect(page);
    assertIntegrity(baseline,label+' início',units);
    assert.equal(baseline.tick,0);
    assert.equal(await page.evaluate(()=>CidadeDurableStore.mode()),'indexeddb',label+' deve testar IndexedDB real');
    result.baseline={tick:0,saveBytes:baseline.saveBytes,heapMB:await heapMB(ctx,page)};
    let current=0;
    for(const target of [365,1825]){
      const durations=[];
      let quota=false,exceededAt=null,quotaStatus=null;
      const started=performance.now();
      for(const days of stepsFor(target-current)){
        const next=await hudAdvance(page,days);
        durations.push(next.elapsedMs);
        if(!next.dateChanged){
          if(next.quotaError && next.failClosedText){
            const snapshot=await inspect(page);
            assertIntegrity(snapshot,label+' quota fail-closed',units);
            assert.equal(snapshot.tick,current,'Quota mudou progresso apesar de recusado');
            exceededAt=current+days;
            quotaStatus={atTick:current,requestedIncrement:days,
              persistedBytes:snapshot.saveBytes,source:'Falha de gravação durável detectada via IndexedDB',
              failClosed:true,firstFailedRequestedDay:exceededAt};
            result.status='BLOCKED_STORAGE';
            quota=true;
            console.log('V300_BROWSER_LONGRUN_QUOTA '+JSON.stringify({
              channel,units,checkpointTarget:target,...quotaStatus}));
            break;
          }
          throw Error('Calendário não avançou sem falha de armazenamento reportada ('+label+' tick '+current+')');
        }
        current+=days;
        if(current%300===0)console.log('V300_BROWSER_LONGRUN_PROGRESS '+JSON.stringify({channel,units,tick:current,target}));
        if(performance.now()-started>15*60*1000)throw Error(label+' avanço excedeu 15 minutos de tempo real');
      }
      const measured=await inspect(page);
      assertIntegrity(measured,label+' '+target,units);
      assert.equal(measured.tick,current,label+' dia final não corresponde ao persistido');
      const milestone={
        targetDays:target,actualDays:current,
        status:quota?'BLOCKED_STORAGE':'PASS_REACHED',
        wallAdvanceMs:round(performance.now()-started),
        clickSamples:durations.length,
        averageClickMs:round(durations.reduce((a,b)=>a+b,0)/(durations.length||1)),
        maxClickMs:round(Math.max(...durations)),
        jsHeapMB:await heapMB(ctx,page),
        saveBytes:measured.saveBytes,saveChars:measured.saveChars,
        compactBytes:measured.compactBytes,compactChars:measured.compactChars,
        ledger:measured.ledger,events:measured.events,
        importMs:round(measured.importMs),compactMs:round(measured.compactMs),
        balanced:measured.balanced,reconciled:measured.reconciliationOK,
        compactRoundtrip:measured.compactRoundtrip,
        quotaStatus
      };
      const dl=await exportAndReload(page,ctx,measured,errors);
      Object.assign(milestone,dl);
      result.milestones.push(milestone);
      console.log('V300_BROWSER_LONGRUN_MILESTONE '+JSON.stringify({channel,units,...milestone}));
      if(quota)break;
    }
    if(result.status==='RUNNING')result.status=result.milestones.every(m=>m.status==='PASS_REACHED')
      ?'PASS_BOTH_TARGETS':'PARTIAL';
    result.lastTick=current;
    result.javascriptExceptions=errors.length;
    assert.equal(errors.length,0,label+': erros JS fatais');
    return result;
  }catch(err){
    result.status='FAIL_UNEXPECTED';
    result.error=String(err.message).slice(0,600);
    report.hardFailures.push({channel,units,message:result.error});
    console.error('V300_BROWSER_LONGRUN_FAILURE '+JSON.stringify({
      channel,units,step:result.milestones.length,result:result.error}));
    return result;
  }finally{
    if(ctx)await ctx.close();
    rmSync(folder,{recursive:true,force:true});
  }
}
const start=performance.now();
for(const channel of ['chrome','msedge']){
  for(const units of [1,5]){
    const row=await scenario(channel,units);
    report.scenarios.push(row);
  }
}
report.wallTotalMs=round(performance.now()-start);
report.completed365=report.scenarios.filter(s=>s.milestones.some(m=>
  m.targetDays===365&&m.status==='PASS_REACHED')).length;
report.completed1825=report.scenarios.filter(s=>s.milestones.some(m=>
  m.targetDays===1825&&m.status==='PASS_REACHED')).length;
report.quotaBlocked=report.scenarios.filter(s=>s.status==='BLOCKED_STORAGE').length;
report.status=report.hardFailures.length?'FAIL_UNEXPECTED':
  report.completed1825===4?'PASS_ALL_SCENARIOS':
  report.completed365===4?'PARTIAL_QUOTA_LIMITED':'PARTIAL_INCOMPLETE';
report.releaseReadiness='NO_GO';
const reportPath=join(process.env.RUNNER_TEMP||tmpdir(),'v300-browser-longrun.json');
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n','utf8');
console.log('V300_BROWSER_LONGRUN_QA '+JSON.stringify({
  status:report.status,completed365:report.completed365,completed1825:report.completed1825,
  quotaBlocked:report.quotaBlocked,hardFailures:report.hardFailures.length,
  runtimeMs:report.wallTotalMs,scenarios:report.scenarios.map(s=>({
    channel:s.channel,units:s.units,status:s.status,lastTick:s.lastTick,
    milestones:s.milestones.map(m=>({targetDays:m.targetDays,actualDays:m.actualDays,
      status:m.status,saveBytes:m.saveBytes,jsHeapMB:m.jsHeapMB,exportedBytes:m.exportedBytes,
      averageClickMs:m.averageClickMs,maxClickMs:m.maxClickMs,
      quotaStatus:m.quotaStatus})),
    error:s.error||null
  })),
  reportArtifact:'v300-browser-longrun.json',
  releaseReadiness:'NO_GO',
  caveat:'Hosted Windows headless, synthetic game saves only. No manual device/UX acceptance.'}));
if(report.hardFailures.length)process.exitCode=1;
