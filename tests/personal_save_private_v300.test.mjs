import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';

const file='tools/validar-save-pessoal-local-v300.mjs';
const run=path=>spawnSync(process.execPath,[file,...(path?[path]:[])],{
  encoding:'utf8',timeout:20000});
const digest=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore');

test('V3.0: verificador privado valida save sintético V3 sem escrita ou expor nomes/valores',()=>{
  const dir=mkdtempSync(join(tmpdir(),'v300-local-save-check-'));
  try{
    const p=join(dir,'save_copia_privado.json');
    const created=core.dispatch(null,{type:'CARREIRA.CRIAR',id:'privacy-qa-create',
      payload:{name:'NOME PRIVADO JOGADOR',companyName:'EMPRESA PRIVADA JOGADOR',
        cityId:'CE-TIANGUA',seed:2211}});
    assert.equal(created.ok,true,created.error);
    writeFileSync(p,core.exportSave(created.state));
    const before=digest(p),r=run(p);
    assert.equal(r.status,0,r.stderr);
    assert.equal(digest(p),before);
    assert.match(r.stdout,/PASS_LOCAL_INTEGRITY/);
    assert.match(r.stdout,/notModified":true/);
    assert.match(r.stdout,/notUploaded":true/);
    assert.doesNotMatch(r.stdout,/NOME PRIVADO|EMPRESA PRIVADA|save_copia_privado|privacy-qa-create/);
    assert.equal(r.stderr,'');
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('V3.0: save corrompido rejeitado sem imprimir dados ou sobrescrever arquivo',()=>{
  const dir=mkdtempSync(join(tmpdir(),'v300-bad-save-'));
  try{
    const p=join(dir,'corrupto.json');
    writeFileSync(p,'{"player":"NOME SECRETO","corrupted":true}');
    const before=digest(p),r=run(p);
    assert.equal(r.status,2);
    assert.equal(digest(p),before);
    assert.match(r.stderr,/V300_PERSONAL_SAVE_CHECK/);
    assert.doesNotMatch(r.stderr,/NOME SECRETO/);
    assert.ok(!r.stdout);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('V3.0: sem arquivo, validador pede caminho sem acesso externo',()=>{
  const r=run(null);
  assert.equal(r.status,64);
  assert.match(r.stderr,/USO:/);
  const source=readFileSync(file,'utf8');
  assert.doesNotMatch(source,/fetch\s*\(|https:\/\/|http:\/\/|writeFileSync|axios|XMLHttpRequest/);
});
