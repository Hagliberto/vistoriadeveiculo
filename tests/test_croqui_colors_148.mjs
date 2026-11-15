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
const types=['Amassado','Risco','Quebrado','Faltando'];
const colors=types.map(t=>execute(`getDamagePinColor('${t}').fill`));
assert.equal(new Set(colors).size,4,'Cada tipo tem uma cor própria');
assert.deepEqual(colors, ['#be123c','#1d4ed8','#c2410c','#7e22ce']);
execute(`appState.pins=[
{id:101,x:10,y:12,type:'Amassado',desc:'primeiro',photo:null},
{id:102,x:20,y:22,type:'Amassado',desc:'segundo',photo:null},
{id:103,x:30,y:32,type:'Risco',desc:'terceiro',photo:null},
{id:104,x:40,y:42,type:'Quebrado',desc:'quarto',photo:null},
{id:105,x:50,y:52,type:'Faltando',desc:'quinto',photo:null}]; renderDamagePins();`);
let pins=get('pins-layer').children, list=get('damage-list').children;
assert.equal(pins.length,5);
const expected=[colors[0],colors[0],colors[1],colors[2],colors[3]];
assert.deepEqual(pins.map(x=>x.style.backgroundColor),expected,'Cores por tipo (não por número)');
for(let i=0;i<5;i++) {
 assert.ok(list[i].innerHTML.includes(`background-color:${expected[i]}`),'Número da lista e croqui coincidem');
 assert.equal(list[i].style.borderLeft,`4px solid ${expected[i]}`);
 assert.equal(list[i].style['--damage-pin-color'],expected[i]);
}
// Remover item altera o número, mas nunca a cor definida pelo tipo.
get('pins-layer').children=[];get('damage-list').children=[];
execute('appState.pins.splice(1,1); renderDamagePins();');
pins=get('pins-layer').children;
list=get('damage-list').children;
assert.equal(pins.length,4);
assert.deepEqual(pins.map(x=>x.style.backgroundColor), [colors[0],colors[1],colors[2],colors[3]]);
assert.ok(list[1].innerHTML.includes('terceiro'));
assert.equal(execute('appState.pins[1].id'),103);
assert.ok(css.includes('print-color-adjust: exact'));
assert.equal(JSON.parse(fs.readFileSync(new URL('../version.json',import.meta.url))).version,'1.5.7');
assert.ok(fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8').includes('shell-v1.5.7'));
console.log('OK: cores por tipo, persistência após exclusão e impressão A4 v1.5.7.');
