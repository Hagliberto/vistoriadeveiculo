import assert from 'node:assert/strict';
import fs from 'node:fs';
const get=(p,encoding='utf8')=>fs.readFileSync(new URL('../'+p,import.meta.url),encoding);
const html=get('index.html'), js=get('assets/app.js'), css=get('assets/print-and-custom.css'), sw=get('service-worker.js');
const views=['front','front-left','left','rear-left','rear','rear-right','right','front-right','top'];
for(const view of views){
 assert.match(html,new RegExp('data-croqui-view="'+view+'"'),view+' interactive');
 assert.match(html,new RegExp('data-view-card="'+view+'"'),view+' card');
 assert.match(html,new RegExp('src="assets/croqui/'+view+'\\.webp"'),view+' image');
 assert.match(sw,new RegExp('croqui/'+view+'\\.webp"?'),view+' cached');
 assert.ok(get('assets/croqui/'+view+'.webp',null).length>20000,view+' nonempty');
}
assert.equal((html.match(/data-view-card=/g)||[]).length,9);
assert.match(html,/id="croqui-fullscreen-stage"/);
for(const id of ['btn-croqui-fullscreen','btn-croqui-full-close','btn-croqui-full-prev','btn-croqui-full-next','btn-croqui-full-zoom-in','btn-croqui-full-zoom-out']) assert.ok(html.includes('id="'+id+'"'),id);
assert.match(js,/requestFullscreen\(\)/);
assert.match(js,/croqui-fallback-fullscreen/);
assert.match(js,/function stepCroquiView/);
assert.match(js,/suppressClickUntil/);
assert.match(css,/\.croqui-fallback-fullscreen/);
assert.match(css,/@media print[\s\S]*croqui-fullscreen-controls/);
assert.equal(JSON.parse(get('version.json')).version,'1.5.7');
console.log('OK: nove vistas da fonte PDF, assets offline, fullscreen, fallback, swipe e impressão v1.5.7.');
