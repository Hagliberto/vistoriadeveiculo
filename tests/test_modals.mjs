/** Regressão de estados e foco de diálogos sobrepostos. node tests/test_modals.mjs */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const elems=new Map();
let activeElement=null;
function element(id,initial=[]){
 const set=new Set(initial);
 const el={id,hidden:false,inert:false,textContent:'',innerHTML:'',isConnected:true,
  classList:{contains:k=>set.has(k),add:k=>set.add(k),remove:k=>set.delete(k),toggle:(k,yes)=>yes===undefined?(set.has(k)?set.delete(k):set.add(k)):yes?set.add(k):set.delete(k)},
  focus(){activeElement=el},setAttribute(){},closest(){return null},querySelector(){return elems.get('close-history')}
 };
 elems.set(id,el);
 return el;
}
element('confirm-modal',['hidden']);
element('history-modal',['hidden']);
element('settings-modal').hidden=true;
for(const id of ['close-history','modal-title','modal-desc','modal-confirm','modal-cancel','external-opener']) element(id);
const doc={getElementById(id){return elems.get(id)},addEventListener(){},body:{classList:{toggle(){}}},get activeElement(){return activeElement}};
const ctx={document:doc,console,Date,Math,Promise,setTimeout,clearTimeout,Uint32Array,crypto:{getRandomValues(a){a[0]=12345;return a}}};
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:'assets/app.js'});
const run=code=>vm.runInContext(code,ctx);
run('renderHistoryList=()=>{};showToast=()=>{};');
elems.get('external-opener').focus();
run('openHistoryModal()');
assert.equal(elems.get('history-modal').classList.contains('hidden'),false);
assert.equal(activeElement.id,'close-history');
run("openConfirmModal('Excluir vistoria do histórico?','Confirmar exclusão',()=>{globalThis.confirmations=(globalThis.confirmations||0)+1})");
assert.equal(elems.get('confirm-modal').classList.contains('hidden'),false);
assert.equal(elems.get('history-modal').inert,true, 'Histórico deve ficar inativo atrás da confirmação');
assert.equal(activeElement.id,'modal-cancel');
elems.get('modal-cancel').onclick();
assert.equal(elems.get('confirm-modal').classList.contains('hidden'),true);
assert.equal(elems.get('history-modal').inert,false);
assert.equal(activeElement.id,'close-history','Cancelar deve devolver foco ao histórico');
run("openConfirmModal('Excluir?', 'Excluir?',()=>{globalThis.confirmations=(globalThis.confirmations||0)+1})");
elems.get('modal-confirm').onclick();
await Promise.resolve();
assert.equal(ctx.confirmations,1);
assert.equal(elems.get('history-modal').inert,false);
run('closeHistoryModal()');
assert.equal(elems.get('history-modal').classList.contains('hidden'),true);
assert.equal(activeElement.id,'external-opener','Fechar histórico deve devolver foco ao acionador original');
console.log('OK: confirmação acima do histórico, inert, cancelamento, exclusão confirmada e retorno de foco.');
