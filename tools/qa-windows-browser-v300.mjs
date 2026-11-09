/**
 * V3.0 QA-Windows: Chrome + Edge reais (Windows hosted runner), abrindo HTML via file://.
 * Testes isolados: nunca usa dados de usuário, nem altera main/save pessoal.
 * Uso manual no Windows: npm install --no-save --no-package-lock --ignore-scripts playwright@1.55.1
 *                        node tools/qa-windows-browser-v300.mjs
 */
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

const KEY='cidade-dos-negocios-save-v1';
const webFile=resolve('index.html');
const target=pathToFileURL(webFile).href;
const fixtureCore=runInNewContext(readFileSync('tests/fixtures/core_v2_9_0_homologada.js','utf8')+'\nCidadeCore');
const stable=readFileSync('tests/fixtures/core_v2_9_0_homologada.js','utf8');
assert.match(stable,/SCHEMA_VERSION = 9/);
const shortHash=value=>createHash('sha256').update(value).digest('hex').slice(0,16);
const testedBrowsers=[];
const findings=[];
const check=(ok,label)=>{assert.ok(ok,label);findings.push({check:label,status:'PASS'});};
const jsonInfo=async page=>await page.evaluate(key=>{
  const raw=localStorage.getItem(key);
  if(!raw)return {raw:null,info:null};
  const state=CidadeCore.importSave(raw).state;
  const money=CidadeCore.overview(state);
  return {raw,info:{
    worldId:state.worldId,revision:state.revision,tick:state.calendar.tick,
    date:state.calendar.date,seed:state.rng.seed,
    cashCents:money.cash,stock:money.stock,
    events:state.audit.events.length,ledger:state.economy.ledger.length,
    units:CidadeCore.businesses(state).length,version:state.schemaVersion
  }};
},KEY);
const checkClosed=(err,where)=>err.some(x=>/pageerror/i.test(x))&&
  check(false,'Exceção JS fatal em '+where);

const launch=(userDataDir,channel)=>chromium.launchPersistentContext(userDataDir,{
  channel,headless:true,acceptDownloads:true,
  viewport:{width:1320,height:920},
  args:['--no-first-run','--disable-background-networking','--disable-extensions']
});
async function open(context,errors){
  // P0-04: esta suíte preserva as regressões do caminho LEGADO localStorage,
  // forçando IndexedDB ausente somente nos perfis sintéticos deste QA.
  await context.addInitScript(()=>{Object.defineProperty(window,'indexedDB',{value:undefined,configurable:true});});
  const page=context.pages()[0]??await context.newPage();
  page.on('pageerror',err=>errors.push('pageerror: '+err.message));
  const response=await page.goto(target,{waitUntil:'load',timeout:45000});
  // file:// pode produzir resposta nula conforme versão do Playwright; prova é DOM + app.
  await page.locator('#career-form').waitFor({state:'attached',timeout:15000});
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready',{timeout:20000});
  await page.waitForFunction(()=>document.title.includes('3.2.0'),{timeout:15000});
  return page;
}
function validateWindowsHosted(){
  assert.equal(process.platform,'win32',
    'Este ensaio é destinado ao Windows real; não confundir Linux com QA Windows.');
  assert.match(target,/^file:\/\/\//);
}
function legacySyntheticSave(){
  let s=fixtureCore.dispatch(null,{id:'qa-v290-start',type:'CARREIRA.CRIAR',
    payload:{name:'Amostra V2.9',companyName:'Grupo Sintético',cityId:'CE-TIANGUA',seed:700829}}).state;
  const r=fixtureCore.dispatch(s,{id:'qa-v290-open',type:'EMPRESA.ABRIR',
    payload:{sector:'mercado',cityId:'CE-TIANGUA',lot:2}});
  assert.equal(r.ok,true,r.error);
  s=r.state;
  return {raw:fixtureCore.exportSave(s),info:{
    revision:s.revision,tick:s.calendar.tick,worldId:s.worldId,ledger:s.economy.ledger.length
  }};
}
async function fillQuota(page){
  return page.evaluate(()=>{
    const k='qa-v300-only-quota-filler';
    let text='',bytes=0,quota=false;
    for(const step of [512*1024,64*1024,8192,512,32,2]){
      for(let i=0;i<72;i++){
        const attempt=text+'q'.repeat(step);
        try{localStorage.setItem(k,attempt);text=attempt;bytes+=step;}
        catch(err){
          if(err?.name!=='QuotaExceededError')throw err;
          quota=true;break;
        }
      }
    }
    return {quotaHit:quota,fillerChars:bytes};
  });
}
async function advanceOneDay(page){
  // Na cena Cidade da V2.2.1 a turnbar fica oculta por CSS; usar o HUD visível.
  // O controlador de HUD aciona o MESMO botão/comando Core.dispatch da barra.
  await page.locator('#v31-next-day').click();
}
async function testBrowser(channel){
  const folder=mkdtempSync(join(tmpdir(),'cidade-v300-win-'+channel+'-'));
  let context=null;
  const errors=[];
  let page;
  try{
    context=await launch(folder,channel);
    page=await open(context,errors);
    check(await page.locator('#game-shell').isHidden(),channel+': tela inicial via file://');
    await page.locator('#player-name').fill('Teste Windows');
    await page.locator('#company-name').fill('Negócio de Teste QA');
    await page.locator('#start-city').selectOption('CE-TIANGUA');
    await page.locator('#career-form button[type=submit]').click();
    await page.waitForFunction(()=>!document.getElementById('game-shell').hidden);
    const created=await jsonInfo(page);
    check(Boolean(created.raw&&created.info&&created.info.revision>=1&&created.info.version===10),
      channel+': carreira criada e exportada como envelope verificável');
    check((await page.locator('#autosave-label').textContent()).includes('Cópia local verificada'),
      channel+': interface declara cópia após verificação de leitura');

    await advanceOneDay(page);
    const advanced=await jsonInfo(page);
    check(advanced.info.tick===created.info.tick+1&&advanced.info.revision===created.info.revision+1,
      channel+': comando real avança um dia e incrementa revisão');
    check(advanced.raw!==created.raw&&advanced.info.ledger>=created.info.ledger,
      channel+': alteração econômica/temporal ficou no save durável');

    // Quota atingida em armazenamento real do Chromium, sem mock.
    const quota=await fillQuota(page);
    check(quota.quotaHit&&quota.fillerChars>0,
      channel+': QuotaExceededError real reproduzido em localStorage file://');
    const before=await jsonInfo(page);
    await advanceOneDay(page);
    const after=await jsonInfo(page);
    const textStatus=await page.locator('#autosave-label').textContent();
    check(after.raw===before.raw&&
      (await page.locator('#date-label').textContent())===
        before.info.date.split('-').reverse().join('/'),
      channel+': quota não altera carreira ativa, data e save anterior');
    check(textStatus.includes('Salvamento local indisponível')&&
      textStatus.includes('NÃO confirmada'),
      channel+': erro de quota apresenta falha, não sucesso');

    await page.evaluate(()=>localStorage.removeItem('qa-v300-only-quota-filler'));
    await advanceOneDay(page);
    const recovered=await jsonInfo(page);
    check(recovered.info.tick===before.info.tick+1&&
      recovered.info.revision===before.info.revision+1,
      channel+': após liberar quota, só um dia é confirmado');

    // Guardar a identidade do save e sair do navegador (processo real).
    const durable=await jsonInfo(page);
    await context.close();context=null;
    context=await launch(folder,channel);
    page=await open(context,errors);
    const reopened=await jsonInfo(page);
    check(reopened.raw===durable.raw&&JSON.stringify(reopened.info)===JSON.stringify(durable.info),
      channel+': fechamento e reabertura do navegador preserva save integral');

    // Exportação pelo botão original, validando o arquivo escrito no disco Windows.
    // Na cena Cidade o sidebar fica oculto; usar o atalho visível no HUD.
    await page.locator('#v31-dock [data-v31-open="sistema"]').click();
    const [download]=await Promise.all([
      page.waitForEvent('download',{timeout:15000}),page.locator('#export-btn').click()
    ]);
    const downloadFile=await download.path();
    assert.ok(downloadFile,'Arquivo não gravado pela operação de download');
    const exported=readFileSync(downloadFile,'utf8');
    check(exported===durable.raw&&
      download.suggestedFilename().endsWith('.json'),
      channel+': exportação real JSON é idêntica ao estado recuperado');

    // Importação em um segundo perfil isolado, usando o input real e arquivo real.
    const importProfile=mkdtempSync(join(tmpdir(),'cidade-v300-import-'+channel+'-'));
    try{
      const another=await launch(importProfile,channel);
      try{
        const from=await open(another,errors);
        await from.locator('#import-file').setInputFiles({
          name:'carreira-de-teste.json',mimeType:'application/json',buffer:Buffer.from(exported)
        });
        await from.waitForFunction(()=>!document.getElementById('game-shell').hidden);
        const restored=await jsonInfo(from);
        check(restored.raw===durable.raw&&
          JSON.stringify(restored.info)===JSON.stringify(durable.info),
          channel+': importação por input real restaura a mesma carreira no perfil novo');
      }finally{await another.close();}
    }finally{rmSync(importProfile,{recursive:true,force:true});}

    // Save genuinamente produzido pelo motor V2.9 do snapshot homologado (fixture).
    const legacy=legacySyntheticSave();
    const legacyProfile=mkdtempSync(join(tmpdir(),'cidade-v300-legacy-'+channel+'-'));
    try{
      const legacyContext=await launch(legacyProfile,channel);
      try{
        const from=await open(legacyContext,errors);
        await from.locator('#import-file').setInputFiles({
          name:'carreira-sintetica-v290.json',mimeType:'application/json',
          buffer:Buffer.from(legacy.raw)
        });
        await from.waitForFunction(()=>!document.getElementById('game-shell').hidden);
        const migrated=await jsonInfo(from);
        check(migrated.info.worldId===legacy.info.worldId&&
          migrated.info.tick===legacy.info.tick&&
          migrated.info.revision===legacy.info.revision&&
          migrated.info.ledger===legacy.info.ledger,
          channel+': save sintético V2.9 homologada importado em V3.0 sem retroação');
        check(migrated.info.version===10,
          channel+': save V2.9 migrado para schema10 sem alterar histórico');
        let rollbackRejected=false;
        try{fixtureCore.importSave(migrated.raw);}catch(err){rollbackRejected=/schema|incompatível/i.test(String(err.message));}
        check(rollbackRejected,
          channel+': motor V2.9 rejeita corretamente schema10; rollback requer backup V2.9 externo');
      }finally{await legacyContext.close();}
    }finally{rmSync(legacyProfile,{recursive:true,force:true});}

    // Um viewport móvel EMULADO não é teste de aparelho móvel real.
    await page.setViewportSize({width:390,height:844});
    // Responsividade de viewport é observada sem forçar clique em sidebar oculto.
    check(await page.locator('#game-shell').isVisible(),
      channel+': viewport 390px emulado continua exibindo o jogo');

    check(errors.length===0,channel+': zero erros JS fatais observados pelo browser');
    testedBrowsers.push({channel,result:'PASS',version:await page.evaluate(()=>navigator.userAgent),
      exportedHash16:shortHash(exported),reopenedRevision:reopened.info.revision,
      quotaFillerChars:quota.fillerChars,syntheticOnly:true,mode:'headless hosted Windows'});
  }finally{
    if(context)await context.close();
    rmSync(folder,{recursive:true,force:true});
  }
}
validateWindowsHosted();
for(const channel of ['chrome','msedge'])await testBrowser(channel);
check(testedBrowsers.length===2,'Chrome e Edge completaram ensaios em Windows hospedado');
console.log('V300_WINDOWS_BROWSER_QA '+JSON.stringify({
  result:'PASS',environment:'windows-latest GitHub hosted, Chrome/Edge headless',
  target:'file:// isolated index.html',
  browsers:testedBrowsers,
  assertions:findings.length,
  sha256Html:createHash('sha256').update(readFileSync(webFile)).digest('hex'),
  caveats:[
    'Nenhum save pessoal de usuário foi testado',
    'Nenhuma instalação Windows do usuário foi acessada',
    'Headless/viewport emulado não prova toque e FPS de aparelho móvel real',
    'Não homologar automaticamente V3.0'
  ]
}));
