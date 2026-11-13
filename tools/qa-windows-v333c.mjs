// V3.3.3-C: prova integrada de clique real na Central com duas empresas.
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {chromium} from 'playwright';
import {createV333DecisionEngine} from '../src/contracts/v333-decision-engine.mjs';

assert.equal(process.platform,'win32','Esta suíte exige Windows hospedado.');
const source=readFileSync('src/core/game.js','utf8');
const Core=runInNewContext(source+'\nCidadeCore',{});
let number=0;
function step(state,type,payload={}){
 const out=Core.dispatch(state,{type,payload,id:'qa-v333c-'+(++number)});
 assert.equal(out.ok,true,type+': '+String(out.error));return out.state;
}
let seed=step(null,'CARREIRA.CRIAR',{
 name:'Navegação QA',companyName:'Rede QA das Unidades',cityId:'CE-TIANGUA',seed:3330303
});
seed=step(seed,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
seed=step(seed,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:4});
const active=Core.activeBusiness(seed).id;
const other=Core.businesses(seed).find(u=>u.id!==active);
assert.ok(other);
const occurrence=createV333DecisionEngine(Core).candidates(seed).find(
 x=>x.category==='SUP'&&x.scope.businessId===other.id);
assert.ok(occurrence,'Aviso de estoque da outra unidade não localizado');
const raw=Core.exportSave(seed);
const url=pathToFileURL(resolve('index.html')).href;

async function durable(page){
 return page.evaluate(async()=>{
  const src=await CidadeDurableStore.readCurrent(CidadeCore);
  const s=CidadeCore.importSave(src).state;
  return {revision:s.revision,active:s.world.activeBusinessId,
   cash:CidadeCore.overview(s).cash,
   ledger:s.economy.ledger.length,
   stock:CidadeCore.overview(s).stock,
   fiscal:JSON.stringify(s.fiscal)};
 });
}
async function exercise(channel,width,height){
 const folder=mkdtempSync(join(tmpdir(),'qa-v333c-'+channel+'-'));
 let ctx;const errors=[];
 try{
  ctx=await chromium.launchPersistentContext(folder,{
   channel,headless:true,viewport:{width,height},
   isMobile:width<600,hasTouch:width<600,acceptDownloads:true
  });
  const page=ctx.pages()[0]||await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready');
  await page.locator('#import-file').setInputFiles({
    name:'qa-v333c-save.json',mimeType:'application/json',buffer:Buffer.from(raw)
  });
  await page.locator('#v31-dock').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true');
  const before=await durable(page);
  assert.equal(before.active,active,'Carreira importada com unidade errada');
  await page.locator('#v332-advisor-toggle').click();
  const selector='#v332-advisor-active-list button[data-v333-occurrence-id="'+occurrence.id+'"]';
  const button=page.locator(selector);
  assert.equal(await button.count(),1,'Aviso da unidade secundária não exibido');
  await button.click();
  await page.waitForFunction(async id=>{
   const raw=await CidadeDurableStore.readCurrent(CidadeCore);
   if(!raw)return false;
   const s=CidadeCore.importSave(raw).state;
   return s.world.activeBusinessId===id&&document.body.dataset.storageBusy!=='true';
  },other.id,{timeout:30000});
  assert.equal(await page.locator('[data-view="mercado"]').isVisible(),true);
  assert.equal(await page.locator('#buy-product').inputValue(),occurrence.scope.productId,
   'Produto do aviso não foi selecionado');
  const after=await durable(page);
  assert.equal(after.active,other.id);
  assert.equal(after.revision,before.revision+1,
    'Somente uma ativação de unidade deve ser gravada');
  for(const key of ['cash','ledger','stock','fiscal'])assert.deepEqual(after[key],before[key],
    'Navegação alterou dado econômico/fiscal: '+key);
  await page.locator('#v31-overlay-close').click();

  // Repetir aviso com a unidade já ativa: nenhum segundo commit.
  await page.locator('#v332-advisor-toggle').click();
  await page.locator(selector).click();
  assert.equal(await page.locator('[data-view="mercado"]').isVisible(),true);
  const repeat=await durable(page);
  assert.equal(repeat.revision,after.revision,'Atalho repetido não deveria gravar novamente');
  await page.locator('#v31-overlay-close').click();

  // Atalho geral de preços abre formulário sem executar PRECO.DEFINIR.
  await page.locator('.v332-quick-actions [data-v332-route="mercado:outros"]').click();
  assert.equal(await page.locator('#price-product').isVisible(),true);
  const general=await durable(page);
  assert.equal(general.revision,after.revision,'Ações Rápidas não devem alterar o save');
  assert.deepEqual(errors,[],'Erro de script no navegador');
  return {channel,width,height,result:'PASS',activeChangedFrom:active,activeChangedTo:other.id,
   selectedProduct:occurrence.scope.productId,safeRepeated:true,safeQuickAction:true};
 }finally{if(ctx)await ctx.close();rmSync(folder,{recursive:true,force:true});}
}
const results=[];
for(const channel of ['chrome','msedge']){
 results.push(await exercise(channel,1366,768));
 results.push(await exercise(channel,390,844));
}
console.log('V333C_WINDOWS_CONTEXTUAL_QA '+JSON.stringify({
 status:'PASS',scenarios:results.length,results,
 scope:'Windows hospedado Chrome/Edge headless, file://, carreira sintética; sem save pessoal',
 physicalMobileTested:false,releaseAuthorized:false
}));
