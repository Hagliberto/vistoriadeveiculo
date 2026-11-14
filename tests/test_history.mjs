/**
 * Regressão sem dependências: node tests/test_history.mjs
 * Garante múltiplos registros do mesmo protocolo, exclusão por ID
 * e alterações somente da categoria escolhida.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const database = new Map();
const stubElement = () => ({
  disabled: false, textContent: '', innerHTML: '', inert: false,
  classList: {add(){}, remove(){}, toggle(){}},
  setAttribute(){}, focus(){}, closest(){return null}, isConnected: true
});
const els = new Map();
const dom = id => {if (!els.has(id)) els.set(id,stubElement()); return els.get(id);};
const ctx = {
  Date, Math, Promise, console, Uint32Array, setTimeout, clearTimeout,
  crypto: {getRandomValues(a){a[0]=12345;return a;},randomUUID(){return `00000000-0000-4000-8000-${String(++ctx.uuid).padStart(12,'0')}`;}},
  uuid: 0,
  document: {addEventListener(){},getElementById:dom, body:{classList:{toggle(){}}}},
  window: {indexedDB: undefined},
  localStorage: {setItem(key,value){database.set(key,value)},getItem(key){return database.get(key) || null}}
};
vm.createContext(ctx);
vm.runInContext(source, ctx, {filename:'assets/app.js'});
const run = code => vm.runInContext(code, ctx);
run('renderHistoryList=()=>{};updateHistoryCounterBadge=()=>{};showToast=()=>{};applyItemVisualState=()=>{};updateAllBadgesAndStats=()=>{};saveToLocalStorage=()=>{};');
await run('saveCurrentToHistory()');
await run('saveCurrentToHistory()');
await run('saveCurrentToHistory()');
await run('saveCurrentToHistory()');
await run('saveCurrentToHistory()');
assert.equal(run('getHistoryList().length'),5, 'O mesmo rascunho deve poder ser salvo mais de duas vezes');
assert.equal(run('new Set(getHistoryList().map(x => x.meta.id)).size'),1, 'O protocolo original permanece');
assert.equal(run('new Set(getHistoryList().map(x => x.meta.archiveId)).size'),5, 'Cada arquivo tem seu próprio ID');
assert.equal(JSON.parse(database.get('vistoria_veicular_history_v1')).length,5,'Histórico foi persistido');
const firstArchive=run('getHistoryList()[0].meta.archiveId');
// Captura o callback de confirmação para simular a aprovação do usuário.
run('openConfirmModal=(_title,_message, callback)=>{globalThis.confirmedAction=callback;}');
run('deleteHistoryItem(0)');
await ctx.confirmedAction();
assert.equal(run('getHistoryList().length'),4);
const afterDeletion = run('getHistoryList().map(x => x.meta.archiveId)');
assert.ok(!afterDeletion.includes(firstArchive),'A exclusão deve remover somente a versão escolhida');
assert.equal(new Set(afterDeletion).size,4);
// A nova versão cria arquivo histórico distinto mesmo após carregar a antiga.
run('appState = normalizeState(getHistoryList()[0]);');
await run('saveCurrentToHistory()');
assert.equal(run('getHistoryList().length'),5);
assert.equal(run('new Set(getHistoryList().map(x => x.meta.archiveId)).size'),5);
// Status alterados somente na categoria escolhida.
run('appState=normalizeState(createDefaultState());');
run("markCategoryAsConforme('doc_obrigatorios')");
assert.equal(run("CHECKLIST_SCHEMA[0].items.every((_,i)=>appState.checklist['doc_obrigatorios_'+i].status==='ok')"),true);
assert.equal(run("appState.checklist['exterior_lataria_0'].status"),null);
run("appState.checklist['doc_obrigatorios_2'].status='nok'");
run("appState.checklist['doc_obrigatorios_2'].obs='Risco no documento'");
run("markCategoryAsConforme('doc_obrigatorios')");
assert.equal(run("appState.checklist['doc_obrigatorios_2'].status"),'nok','Avaria só muda após confirmar');
await ctx.confirmedAction();
assert.equal(run("appState.checklist['doc_obrigatorios_2'].status"),'ok');
assert.equal(run("appState.checklist['doc_obrigatorios_2'].obs"),'Risco no documento','Observações são preservadas');
assert.equal(run("appState.checklist['exterior_lataria_0'].status"),null);
// Leitura de arquivo antigo sem ID de histórico continua suportada.
const oldEntry=run('normalizeHistoryEntry({vehicle:{placa:"ABC1234"},meta:{id:"VST-OLD"}})');
assert.ok(oldEntry.meta.archiveId?.startsWith('HST-'));
assert.equal(oldEntry.meta.id,'VST-OLD');
console.log('OK: 5 salvamentos do mesmo protocolo, IDs independentes, exclusão pontual, migração e ação por categoria.');
