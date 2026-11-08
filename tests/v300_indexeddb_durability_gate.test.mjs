import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const d=read('src/ui/durable-store.part.js');
const app=read('src/ui/app.js');
const build=read('tools/build.mjs');
const compiled=read('index.html');

test('P0-04: IndexedDB offline empacotado no HTML único, sem dependência de rede',()=>{
  assert.match(build,/const durableStore=readFileSync/);
  assert.match(build,/durableStore\+'\\n'\+ui/);
  assert.match(compiled,/const CidadeDurableStore=/);
  assert.match(d,/indexedDB\.open\(DATABASE,VERSION\)/);
  assert.match(d,/db\.transaction\(TABLE,mode\)/);
  assert.doesNotMatch(d,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bimport\s*\(/);
  assert.doesNotMatch(JSON.stringify(JSON.parse(read('package.json')).dependencies||{}),/indexeddb|playwright|dexie/);
});
test('P0-04: commit UI assíncrono recusa estado em memória antes do readback durável',()=>{
  const segment=app.split('  async function commit(type,payload={}){')[1]?.split('  // Rotas anteriores')[0];
  assert.ok(segment);
  assert.match(segment,/if\(commitInFlight\)/);
  assert.match(segment,/document\.body\.dataset\.storageBusy='true'/);
  assert.match(segment,/if\(!await persistDurable\(result\.state\)\)return false/);
  assert.ok(segment.indexOf('await persistDurable(result.state)')<segment.indexOf('state=result.state'));
  assert.match(segment,/finally\{commitInFlight=false;document\.body\.dataset\.storageBusy='false'/);
});
test('P0-04: validação de escrita IndexedDB é transacional com verificação e restauração',()=>{
  const part=d.split('  const write=async(key,raw)=>{')[1]?.split('  const remove=async(key)=>{')[0];
  assert.ok(part);
  assert.match(part,/const previous=await read\(key\)/);
  assert.match(part,/await transact\('readwrite',store=>store\.put\(raw,key\)\)/);
  assert.match(part,/verified=\(await read\(key\)\)===raw/);
  assert.match(part,/if\(verified\)/);
  assert.match(part,/await transact\('readwrite',store=>previous===null\?store\.delete\(key\):store\.put\(previous,key\)\)/);
  assert.match(part,/rollback NÃO confirmado/);
});
test('P0-04: migração importa save legado validado ANTES da transação e remove fonte após confirmação',()=>{
  const part=d.split('  const readCurrent=async(core)=>{')[1]?.split('  const readBackup=async()=>{')[0];
  assert.ok(part);
  const p=part.indexOf('core.importSave(legacy)');
  const w=part.indexOf("await write('current',core.exportSaveCompact(loaded.state))");
  assert.ok(p>=0&&w>p);
  assert.match(d,/if\(key==='current'\)/);
  assert.match(d,/localStorage\.removeItem\(LEGACY_KEY\)/);
  assert.match(d,/if\(stored!==null\)return stored/);
});
test('P0-04: importação, restauração e nova carreira só são confirmadas depois da gravação',()=>{
  const imported=app.split('  async function importFile(file){')[1]?.split('  function launchAuto(){')[0];
  const restored=app.split("    $('restore-prior-save-btn').addEventListener('click'")[1]?.split("    $('payable-operating-unit')")[0];
  const cleared=app.split("    $('new-career-btn').addEventListener('click'")[1]?.split('  function updateOpenPreview')[0];
  assert.ok(imported&&restored&&cleared);
  for(const source of [imported,restored]){
    assert.match(source,/if\(!await backupCurrent\(\)\)return/);
    assert.match(source,/if\(!await persistDurable\(incoming\.state\)\)/);
    assert.ok(source.indexOf('persistDurable(incoming.state)')<source.indexOf('state=incoming.state'));
  }
  assert.match(cleared,/await backupCurrent\(\)/);
  assert.match(cleared,/await CidadeDurableStore\.clearCurrent\(\)/);
  assert.ok(cleared.indexOf('clearCurrent()')<cleared.indexOf('state=null'));
});
