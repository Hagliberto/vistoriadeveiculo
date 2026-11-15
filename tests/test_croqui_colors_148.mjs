import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../assets/print-and-custom.css', import.meta.url), 'utf8');
const nodes = new Map();
function node() {
  return {innerHTML:'',style:{setProperty(name,value){this[name]=value;}},children:[],className:'',textContent:'',title:'',
    appendChild(child){this.children.push(child);}, addEventListener(){}, focus(){}};
}
const get = id => { if(!nodes.has(id)) nodes.set(id,node()); return nodes.get(id); };
const ctx={console, document:{addEventListener(){},getElementById:get,createElement:node}, window:{}, Date, Math, Promise};
vm.createContext(ctx);
vm.runInContext(app,ctx);
const execute=code=>vm.runInContext(code,ctx);
const colors=execute('Array.from({length:6},(_,i)=>getDamagePinColor(i).fill)');
assert.equal(new Set(colors).size,6,'Primeiros seis marcadores precisam ter cores distintas');
assert.equal(colors[0],'#be123c');
assert.equal(colors[1],'#1d4ed8');
execute(`appState.pins=[
{id:101,x:10,y:12,type:'Risco',desc:'primeiro',photo:null},
{id:102,x:20,y:22,type:'Quebrado',desc:'segundo',photo:null},
{id:103,x:30,y:32,type:'Amassado',desc:'terceiro',photo:null}]; renderDamagePins();`);
let pins=get('pins-layer').children, list=get('damage-list').children;
assert.equal(pins.length,3);
assert.deepEqual([...pins.map(x=>x.style.backgroundColor)], [...colors.slice(0,3)]);
for(let i=0;i<3;i++) {
 assert.ok(list[i].innerHTML.includes(`background-color:${colors[i]}`),'Número da lista e do croqui devem coincidir');
 assert.ok(list[i].innerHTML.includes(`color:${vm.runInContext(`getDamagePinColor(${i}).text`,ctx)}`),'Tipo da avaria deve ter sua cor');
 assert.equal(list[i].style.borderLeft,`4px solid ${colors[i]}`);
 assert.equal(list[i].style['--damage-pin-color'],colors[i]);
}
// Testa a renumeração sem apagar os dados restantes.
get('pins-layer').children=[];get('damage-list').children=[];
execute('appState.pins.splice(1,1); renderDamagePins();');
pins=get('pins-layer').children;
list=get('damage-list').children;
assert.equal(pins.length,2);
assert.equal(pins[1].style.backgroundColor,colors[1]);
assert.ok(list[1].innerHTML.includes('terceiro'));
assert.equal(execute('appState.pins[1].id'),103);
assert.ok(css.includes('print-color-adjust: exact'));
assert.equal(JSON.parse(fs.readFileSync(new URL('../version.json',import.meta.url))).version,'1.5.3');
assert.ok(fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8').includes('shell-v1.5.3'));
console.log('OK: cores individuais, associação croqui/lista, renumeração e impressão A4 v1.5.3.');
