// Inspeciona bytes brutos do blob Git, sem conversão de quebras de linha ou shell.
// git diff não basta: no Windows, core.autocrlf pode tratar CRLF e LF como iguais.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const blob=execFileSync('git',['show','HEAD:index.html'],{maxBuffer:20_000_000});
const generated=readFileSync('index.html');
const hash=b=>createHash('sha256').update(b).digest('hex');
const gitHash=hash(blob),localHash=hash(generated);
console.log('V300_HTML_BYTE_IDENTITY '+JSON.stringify({
  status:gitHash===localHash?'PASS':'FAIL',
  gitBlobSHA256:gitHash,generatedSHA256:localHash,
  bytesGit:blob.byteLength,bytesGenerated:generated.byteLength,
  platform:process.platform
}));
assert.equal(localHash,gitHash,
  'HTML gerado difere byte-a-byte do blob Git: investigar CRLF/LF em Windows');
