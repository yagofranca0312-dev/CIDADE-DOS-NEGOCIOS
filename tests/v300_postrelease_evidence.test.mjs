import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const run=()=>spawnSync(process.execPath,['tools/v300-postrelease-audit.mjs'],
  {encoding:'utf8',timeout:15000});
test('Pos-homologacao V3.0: contrato reproduzivel sem falsificar 18/18',()=>{
  const r=run();
  assert.equal(r.status,0,r.stderr);
  const line=r.stdout.split('\n').find(x=>x.startsWith('V300_POSTRELEASE_AUDIT '));
  assert.ok(line,'Relatorio estruturado nao emitido');
  const j=JSON.parse(line.slice('V300_POSTRELEASE_AUDIT '.length));
  assert.equal(j.status,'PASS_REPOSITORY_CONTRACTS');
  assert.equal(j.ordinaryHistoricalGate,'NO_GO_5_OF_18_VERIFIED');
  assert.equal(j.approval,'OWNER_HOMOLOGATED_EXCEPTION_EXISTING');
  assert.equal(j.safeToClaimOrdinary18Of18,false);
  assert.equal(j.privateSaveTestedByThisAudit,false);
  assert.equal(j.physicalMobileTestedByThisAudit,false);
  assert.equal(j.personalWindowsTestedByThisAudit,false);
  assert.equal(j.gameplaySubjectiveApprovedByThisAudit,false);
  assert.equal(j.readyForV31DevelopmentOnly,true);
});
test('Pos-homologacao V3.0: evidencias manuais preservadas como pendencia',()=>{
  const m=JSON.parse(readFileSync('docs/V300_READINESS_EVIDENCE.json','utf8'));
  const w=JSON.parse(readFileSync('docs/V300_OWNER_EXCEPTION.json','utf8'));
  const r=run();
  const line=r.stdout.split('\n').find(x=>x.startsWith('V300_POSTRELEASE_AUDIT '));
  const j=JSON.parse(line.slice('V300_POSTRELEASE_AUDIT '.length));
  assert.deepEqual(j.historicalWaivers,[...w.waivedRequirements].sort());
  assert.ok(j.manualEvidenceStillMissing.includes('RG-11'));
  assert.ok(j.manualEvidenceStillMissing.includes('RG-14'));
  assert.equal(m.requirements.find(x=>x.id==='RG-11').status,'NOT_EXECUTED');
  assert.equal(m.requirements.find(x=>x.id==='RG-14').status,'NOT_EXECUTED');
  assert.equal(m.checkpointStatus.find(x=>x.id==='3.0.0-08').status,'BLOCKED');
});
