import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
test('V3.0: titular autoriza excecao, nao promove QA ausente a VERIFIED',()=>{
 const w=JSON.parse(readFileSync('docs/V300_OWNER_EXCEPTION.json','utf8'));
 const m=JSON.parse(readFileSync('docs/V300_READINESS_EVIDENCE.json','utf8'));
 assert.equal(w.status,'OWNER_AUTHORIZED');
 assert.equal(w.waiverEffect,'ASSUMED_RISK_NOT_TESTED_NOT_VERIFIED');
 assert.equal(m.requirements.filter(r=>r.status==='VERIFIED').length,5);
 assert.equal(m.requirements.find(r=>r.id==='RG-14').status,'NOT_EXECUTED');
 assert.equal(m.requirements.find(r=>r.id==='RG-11').status,'NOT_EXECUTED');
});
test('V3.0: gate especial so autoriza promocao com risco expresso',()=>{
 const r=spawnSync(process.execPath,['tools/v300-exceptional-release-gate.mjs'],
   {encoding:'utf8',timeout:15000});
 assert.equal(r.status,0,r.stderr);
 const line=r.stdout.split('\n').find(x=>x.startsWith('V300_EXCEPTION_RELEASE_READINESS '));
 assert.ok(line);
 const d=JSON.parse(line.slice('V300_EXCEPTION_RELEASE_READINESS '.length));
 assert.equal(d.decision,'OWNER_EXCEPTION_AUTHORIZED_FOR_PROMOTION');
 assert.equal(d.ordinaryReleaseReadiness,'NO_GO');
 assert.equal(d.releaseNotPerformedByGate,true);
 assert.equal(d.waiverDoesNotProveTests,true);
});
