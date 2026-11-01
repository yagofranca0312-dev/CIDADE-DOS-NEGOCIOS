import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
test('atualizador e modo offline existem', () => {
  for (const file of ['ATUALIZAR_E_JOGAR.bat','JOGAR_OFFLINE.bat','tools/Atualizar-E-Jogar.ps1','docs/ATUALIZADOR_WINDOWS.md']) assert.ok(existsSync(resolve(root,file)), `${file} ausente`);
});
test('atualizador usa o repositorio e commit verificado, nao executa codigo remoto', () => {
  const p = read('tools/Atualizar-E-Jogar.ps1');
  assert.match(p, /yagofranca0312-dev\/CIDADE-DOS-NEGOCIOS/);
  assert.match(p, /commits\//);
  assert.match(p, /zipball\//);
  assert.match(p, /Expand-Archive/);
  assert.doesNotMatch(p, /Invoke-Expression|\biex\s*\(/i);
  assert.match(p, /Get-FileHash/);
  assert.match(p, /Set-Content -LiteralPath \$VersionFile/);
});
test('backups, dados e rollback sao protegidos', () => {
  const p = read('tools/Atualizar-E-Jogar.ps1');
  assert.match(p, /Is-Protected/);
  assert.match(p, /_atualizador/);
  assert.match(p, /saves/);
  assert.match(p, /Copy-Item -LiteralPath \$Target -Destination \$BackupFile/);
  assert.match(p, /revertendo arquivos/);
  assert.match(p, /Open-LocalGame/);
});
test('batch usa caminho relativo com espacos e abre jogo local', () => {
  assert.match(read('ATUALIZAR_E_JOGAR.bat'), /%~dp0tools\\Atualizar-E-Jogar\.ps1/);
  assert.match(read('JOGAR_OFFLINE.bat'), /%~dp0index\.html/);
});
test('publicador tem lista de arquivos e nunca faz force push', () => {
  const p = read('tools/Publicar-Primeira-Versao.ps1');
  assert.match(p, /git ls-remote/);
  assert.match(p, /git push -u origin main/);
  assert.match(p, /\$Allowed/);
  assert.doesNotMatch(p, /git push[^\n]*--force|git push[^\n]*\s-f\b/);
  assert.match(p, /PUBLICO/);
});
