import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const cwd=process.cwd();
const template=readFileSync(resolve(cwd,'src/shell/index.template.html'),'utf8');
const css=readFileSync(resolve(cwd,'src/shell/theme.css'),'utf8');
const core=readFileSync(resolve(cwd,'src/core/game.js'),'utf8');
const ui=readFileSync(resolve(cwd,'src/ui/app.js'),'utf8');
const pkg=JSON.parse(readFileSync(resolve(cwd,'package.json'),'utf8'));
const coreVersion=core.match(/const VERSION = '([^']+)'/)?.[1];
if (!coreVersion || pkg.version!==coreVersion) throw Error('Versão divergente entre motor e package.json');
for (const id of ['intro-version','build-version','footer-version']) {
  if (!template.includes(`id="${id}">v${coreVersion}<`)) throw Error(`Versão incorreta no ${id}; esperado v${coreVersion}`);
}
if (!template.includes(`<title>Cidade dos Negócios 1 · v${coreVersion}</title>`)) throw Error('Versão incorreta no título HTML');
const html=template.replace('/* CDN_CSS */',css).replace('/* CDN_CORE */',core).replace('/* CDN_UI */',ui);
if (/\/\* CDN_(CSS|CORE|UI) \*\//.test(html)) throw Error('Build incompleto');
writeFileSync(resolve(cwd,'index.html'),html,'utf8');
const hash=createHash('sha256').update(html).digest('hex');
console.log(`HTML gerado: ${Buffer.byteLength(html)} bytes | SHA256 ${hash}`);
