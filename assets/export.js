/* Central de exportação offline-first · Vistoria Veicular 1.4.4.
 * Nenhum dado é enviado a servidores; compartilhamento exige ação direta do usuário.
 */
(() => {
    'use strict';
    let returnFocus = null;
    let busy = false;
    let prebuiltPdf = null;
    let prebuiltPng = null;
    let preparingFiles = false;
    let reportSnapshotPromise = null;
    const modal = document.getElementById('export-modal');
    if (!modal) return;
    const feedback = document.getElementById('export-feedback');
    const options = [...modal.querySelectorAll('[data-export-format]')];
    const closeButton = document.getElementById('btn-close-export');
    const label = (value) => String(value ?? '').trim() || '—';
    const statusText = {ok:'Conforme',nok:'Avaria',na:'N/A'};

    function open() {
        if (!modal.hidden) return;
        const actionSheet = document.getElementById('mobile-actions-sheet');
        if (actionSheet && !actionSheet.hidden) document.getElementById('btn-close-actions')?.click();
        returnFocus = document.activeElement;
        feedback.textContent = 'Preparando arquivos para compartilhamento...';
        modal.hidden = false;
        // Pré-geração: a Web Share API exige um gesto recente do usuário.
        // Arquivos prontos são compartilhados imediatamente no clique.
        preparingFiles = true;
        const shareButton=options.find(button=>button.dataset.exportFormat==='share');
        if(shareButton) shareButton.disabled=true;
        prebuiltPdf=null;
        prebuiltPng=null;
        reportSnapshotPromise=renderReportCanvas();
        (async()=>{
            try { prebuiltPdf=await generatePDF(); }
            catch(error) { console.error('Prévia PDF:',error); }
            try { prebuiltPng=await generatePNG(); }
            catch(error) { console.error('Prévia PNG:',error); }
        })().then(()=>{
            preparingFiles=false;
            if(shareButton) shareButton.disabled=false;
            if(!modal.hidden) feedback.textContent=prebuiltPdf?'PDF pronto para compartilhar.':'Não foi possível preparar o PDF. Tente usar Imprimir.';
        });
        document.body.classList.add('export-open');
        closeButton.focus();
    }
    function close() {
        if (busy) return;
        modal.hidden = true;
        document.body.classList.remove('export-open');
        if (returnFocus?.isConnected) returnFocus.focus();
        returnFocus = null;
        // Liberar a imagem grande para evitar consumo excessivo de memória.
        reportSnapshotPromise=null;
        prebuiltPng=null;
        prebuiltPdf=null;
    }
    window.openExportModal = open;
    document.querySelectorAll('[data-open-export]').forEach(button => button.addEventListener('click', open));
    closeButton.addEventListener('click', close);
    modal.addEventListener('click', event => {if (event.target === modal) close();});
    modal.addEventListener('keydown', event => {
        if (event.key === 'Escape') {event.stopPropagation(); close();}
        if (event.key !== 'Tab') return;
        const focusable = [closeButton, ...options];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
        else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    });

    function filename(extension) {
        const plate = (appState.vehicle.placa || 'sem-placa').toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,12);
        const date = new Date().toLocaleDateString('en-CA');
        return `vistoria_${plate}_${date}.${extension}`;
    }
    function download(blob, name) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = name;
        document.body.appendChild(anchor); anchor.click(); anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
    function imageFromData(data) {
        return new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = () => reject(new Error('Não foi possível abrir uma imagem anexada.'));
            im.src = data;
        });
    }
    function breakWords(ctx,text,maxWidth) {
        const output=[];
        for(const paragraph of String(text ?? '').split(/\r?\n/)) {
            if (!paragraph) { output.push('');continue; }
            let line='';
            for(const word of paragraph.split(/\s+/)) {
                const candidate=line ? line+' '+word : word;
                if(ctx.measureText(candidate).width <= maxWidth) {line=candidate;continue;}
                if(line) output.push(line);
                if(ctx.measureText(word).width <= maxWidth) {line=word;continue;}
                let piece='';
                for(const ch of word) {
                    if(piece && ctx.measureText(piece+ch).width > maxWidth) {output.push(piece);piece=ch;}
                    else piece+=ch;
                }
                line=piece;
            }
            if(line) output.push(line);
        }
        return output;
    }
    async function renderReportCanvas() {
        // Escreve a versão atual no dispositivo antes de gerar o relatório.
        await flushSave();
        await saveInFlight;
        const photos = getAllAttachedPhotos();
        const photoImages = await Promise.all(photos.map(p => imageFromData(p.src)));
        const signKeys = ['sig-vistoriador','sig-motorista'];
        const signatures = await Promise.all(signKeys.map(id => appState.signatures[id] ? imageFromData(appState.signatures[id]) : null));
        const width=1100, margin=62, content=width-margin*2;
        const safeCuts=[];
        const canvas=document.createElement('canvas');
        const context=canvas.getContext('2d');
        if(!context) throw new Error('Seu navegador não permite criar imagens PNG.');
        // A renderização em duas passagens calcula a altura real e evita recortes.
        const paint=(draw) => {
            const ctx=context;
            let y=0;
            const rect=(x,ry,w,h,color) => {if(draw){ctx.fillStyle=color;ctx.fillRect(x,ry,w,h);}};
            const line=(x1,y1,x2,y2,color='#dce5f0',thick=1)=>{if(draw){ctx.strokeStyle=color;ctx.lineWidth=thick;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}};
            const text=(value,x,ty,size=18,color='#1d344f',bold=false,maxWidth=content)=>{
                ctx.font=`${bold?'700':'400'} ${size}px Arial, sans-serif`;
                const chunks=breakWords(ctx,value,maxWidth);
                const height=size*1.38;
                if(draw){ctx.fillStyle=color;ctx.textBaseline='top';chunks.forEach((chunk,i)=>ctx.fillText(chunk,x,ty+i*height));}
                return Math.max(height,chunks.length*height);
            };
            const section=(heading)=>{
                y+=24;rect(margin,y,5,35,'#0072ce');text(heading,margin+18,y+2,23,'#004b93',true);y+=48;
                line(margin,y,width-margin,y);
                y+=16;
            };
            const pair=(key,value)=>{
                text(key,margin,y,15,'#61728b',true,210);
                const h=text(label(value),margin+232,y,18,'#1b314b',false,content-232);
                y+=Math.max(h,29)+8;
                if (!draw) safeCuts.push(y);
            };
            const image=(im,x,iy,w,h)=>{
                if(!draw||!im)return;
                const scale=Math.min(w/im.width,h/im.height);
                const iw=im.width*scale,ih=im.height*scale;
                ctx.drawImage(im,x+(w-iw)/2,iy+(h-ih)/2,iw,ih);
            };
            rect(0,0,width,124,'#004b93');
            text('LAUDO DE VISTORIA VEICULAR',margin,36,32,'#ffffff',true);
            text(`Protocolo: ${label(appState.meta.id)} · Emissão: ${new Date().toLocaleString('pt-BR')}`,margin,83,15,'#d8eafe');
            y=145;
            section('Identificação do veículo');
            const v=appState.vehicle;
            pair('Data / Tipo',`${v.data ? v.data.split('-').reverse().join('/') : '—'} · ${label(v.tipo)}`);
            pair('Placa',v.placa);pair('Modelo',v.modelo);pair('Ano / Cor',`${label(v.ano)} / ${label(v.cor)}`);
            pair('Quilometragem',v.km ? `${v.km} km` : '—');pair('Combustível',v.combustivel);
            pair('Vistoriador',v.vistoriador);pair('Motorista',v.motorista);
            if(appState.meta.gps?.lat != null) pair('GPS',`${appState.meta.gps.lat.toFixed(5)}, ${appState.meta.gps.lng.toFixed(5)}`);
            section('Croqui de avarias');
            const diagramX=margin+content/2-128, diagramY=y+10;
            rect(diagramX,diagramY+40,256,345,'#f0f6fc');
            if(draw){
                ctx.strokeStyle='#7e9fbe';ctx.lineWidth=4;
                ctx.beginPath();ctx.roundRect(diagramX+57,diagramY+52,142,313,36);ctx.stroke();
                ctx.beginPath();ctx.roundRect(diagramX+71,diagramY+105,115,75,12);ctx.stroke();
                ctx.beginPath();ctx.roundRect(diagramX+71,diagramY+217,115,72,12);ctx.stroke();
            }
            for(const [i,p] of appState.pins.entries()) {
                const px=diagramX+256*(p.x/100),py=diagramY+40+345*(p.y/100);
                if(draw){ctx.fillStyle='#cf293b';ctx.beginPath();ctx.arc(px,py,12,0,Math.PI*2);ctx.fill();}
                text(String(i+1),px-5,py-9,14,'#ffffff',true,24);
            }
            y=diagramY+400;
            if(appState.pins.length===0) y+=text('Nenhuma avaria marcada no croqui.',margin,y,16,'#6a7b90')+7;
            for(const [i,p] of appState.pins.entries()) {
                const h=text(`${i+1}. ${label(p.type)} — ${label(p.desc)}`,margin,y,17,'#334155');y+=h+9;
            }
            section('Checklist de inspeção');
            for(const group of CHECKLIST_SCHEMA) {
                const rowStart=y;
                rect(margin,y,content,38,'#eaf2fb');
                text(group.title,margin+12,y+8,19,'#004b93',true);y+=48;
                for(let i=0;i<group.items.length;i++){
                    const e=appState.checklist[`${group.id}_${i}`]||{};
                    const item=group.items[i];
                    ctx.font='17px Arial';
                    const nameH=text(item,margin+7,y,17,'#263c57',false,content-185);
                    const status=statusText[e.status]||'Não verificado';
                    const color=e.status==='ok'?'#178052':e.status==='nok'?'#b42336':'#64748b';
                    text(status,width-margin-167,y,15,color,true,165);
                    y+=Math.max(30,nameH)+6;
                    if(e.obs) y+=text(`Observação: ${e.obs}`,margin+20,y,15,'#56667a',false,content-30)+6;
                    line(margin+8,y,width-margin-8,y,'#e5edf6');y+=8;
                    if (!draw) safeCuts.push(y);
                }
                if(y===rowStart+48)y+=6;
                if (!draw) safeCuts.push(y);
            }
            section('Observações gerais');
            y+=text(label(v.obsGerais),margin+8,y,17,'#293e58')+15;
            section('Assinaturas');
            const half=(content-22)/2;
            for(let i=0;i<2;i++){
                const x=margin+i*(half+22);
                rect(x,y,half,120,'#f7f9fc');
                if(draw && signatures[i]) image(signatures[i],x+6,y+5,half-12,102);
                text(i===0?'Vistoriador':'Motorista',x+8,y+126,16,'#334155',true,half-16);
            }
            y+=163;
            if(photos.length){
                section(`Evidências fotográficas (${photos.length})`);
                const gap=16,boxWidth=(content-gap)/2;
                for(let i=0;i<photos.length;i+=2){
                    for(let j=0;j<2 && i+j<photos.length;j++){
                        const idx=i+j,x=margin+j*(boxWidth+gap);
                        rect(x,y,boxWidth,300,'#f3f6fa');
                        image(photoImages[idx],x+8,y+8,boxWidth-16,238);
                        text(photos[idx].title,x+8,y+249,15,'#1d344f',true,boxWidth-16);
                    }
                    y+=316;
                    if (!draw) safeCuts.push(y);
                }
            }
            y+=25;
            line(margin,y,width-margin,y,'#ccd9ea');
            y+=15;text('Documento gerado localmente · Vistoria Veicular · v1.4.4',margin,y,15,'#687b91');
            return y+65;
        };
        const height=Math.ceil(paint(false));
        if(height>25000) throw new Error('O laudo contém muitas fotografias. Reduza a quantidade de evidências ou use a impressão A4.');
        // Raster de 2200 px de largura (~266 dpi em A4), sem depender de CDN.
        // Em laudos extensos, respeitar o limite de pixels do navegador.
        const maxPixels=55000000;
        const scale=Math.min(2, Math.sqrt(maxPixels/(width*height)));
        canvas.width=Math.round(width*scale);
        canvas.height=Math.round(height*scale);
        const active=canvas.getContext('2d');
        if (!active) throw new Error('Seu navegador não conseguiu criar a imagem do laudo.');
        active.scale(canvas.width/width,canvas.height/height);
        active.fillStyle='#ffffff';active.fillRect(0,0,width,height);
        paint(true);
        return {canvas,safeCuts:safeCuts.sort((a,b)=>a-b).map(y=>y*canvas.height/height)};
    }
    function canvasBlob(canvas,type,quality) {
        return new Promise((resolve,reject)=>canvas.toBlob(
            value=>value?resolve(value):reject(new Error('Não foi possível codificar o documento.')),
            type, quality));
    }
    async function generatePNG() {
        const {canvas}=await (reportSnapshotPromise || renderReportCanvas());
        return new File([await canvasBlob(canvas,'image/png')],filename('png'),{type:'image/png'});
    }
    // Gerador PDF A4 offline: páginas JPEG com qualidade alta e metadados simples.
    // O conteúdo é rasterizado em 200 dpi, e cada página tem sua própria imagem,
    // evitando bibliotecas/CDNs e arquivos PNG gigantes em cada página.
    async function generatePDF() {
        const {canvas,safeCuts}=await (reportSnapshotPromise || renderReportCanvas());
        const pageWidth=595.28, pageHeight=841.89, margin=22;
        const availableWidth=pageWidth-2*margin;
        const availableHeight=pageHeight-2*margin;
        const sourcePageHeight=Math.floor(canvas.width*availableHeight/availableWidth);
        const pageCanvas=document.createElement('canvas');
        pageCanvas.width=1654; // cerca de 200 dpi em folha A4
        pageCanvas.height=Math.ceil(pageCanvas.width*pageHeight/pageWidth);
        const ctx=pageCanvas.getContext('2d',{alpha:false});
        if(!ctx) throw new Error('Não foi possível preparar as páginas do PDF.');
        const images=[];
        let top=0;
        while(top<canvas.height) {
            if(images.length>=100) throw new Error('O laudo excedeu o limite de 100 páginas. Reduza as evidências.');
            const goal=Math.min(canvas.height,top+sourcePageHeight);
            // Prefere quebra entre itens, para não cortar palavras ou fotografias.
            const lower=top+sourcePageHeight*0.83;
            const candidates=safeCuts.filter(y=>y>lower && y<=goal);
            const bottom=(goal===canvas.height)?goal:(candidates.at(-1)||goal);
            const cropped=bottom-top;
            const drawnHeight=(cropped/canvas.width)*availableWidth;
            ctx.fillStyle='#ffffff';ctx.fillRect(0,0,pageCanvas.width,pageCanvas.height);
            const px=margin*pageCanvas.width/pageWidth;
            const py=margin*pageCanvas.height/pageHeight;
            const drawWidth=availableWidth*pageCanvas.width/pageWidth;
            const drawHeight=drawnHeight*pageCanvas.height/pageHeight;
            ctx.drawImage(canvas,0,top,canvas.width,cropped,px,py,drawWidth,drawHeight);
            const jpeg=await canvasBlob(pageCanvas,'image/jpeg',0.94);
            images.push({jpeg,width:pageCanvas.width,height:pageCanvas.height});
            top=bottom;
        }
        return new File([await encodeImagePDF(images)],filename('pdf'),{type:'application/pdf'});
    }
    async function encodeImagePDF(images) {
        const pageWidth=595.28, pageHeight=841.89;
        const encoder=new TextEncoder();
        const chunks=[]; let offset=0;
        const add=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;chunks.push(bytes);offset+=bytes.length;};
        const xrefs=[0];
        const object=(id,body)=>{xrefs[id]=offset;add(`${id} 0 obj\n`);add(body);add('\nendobj\n');};
        add('%PDF-1.4\n%\xC2\xA5\xC2\xB1\n');
        const pageIds=images.map((_,i)=>3+i*3);
        object(1,'<< /Type /Catalog /Pages 2 0 R >>');
        object(2,`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${images.length} >>`);
        for(let i=0;i<images.length;i++) {
            const {jpeg,width,height}=images[i];
            const pageId=pageIds[i], contentId=pageId+1, imageId=pageId+2;
            const draw=`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im${i+1} Do\nQ\n`;
            object(pageId,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${i+1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
            object(contentId,`<< /Length ${encoder.encode(draw).length} >>\nstream\n${draw}endstream`);
            const bytes=new Uint8Array(await jpeg.arrayBuffer());
            xrefs[imageId]=offset;
            add(`${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);
            add(bytes);
            add('\nendstream\nendobj\n');
        }
        const xrefAt=offset;
        add(`xref\n0 ${xrefs.length}\n0000000000 65535 f \n`);
        for(let i=1;i<xrefs.length;i++) add(`${String(xrefs[i]).padStart(10,'0')} 00000 n \n`);
        add(`trailer\n<< /Size ${xrefs.length} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`);
        return new Blob(chunks,{type:'application/pdf'});
    }
    async function execute(kind) {
        if(busy) return;
        busy=true;options.forEach(button=>button.disabled=true);
        feedback.textContent='Preparando o documento...';
        try {
            if(kind==='print') {
                feedback.textContent='Abrindo a janela de impressão A4...';
                busy=false;
                close();
                validateAndPrint();
                return;
            }
            if(kind==='pdf') {
                const file=prebuiltPdf || await generatePDF();
                download(file,file.name);
                feedback.textContent='PDF A4 de alta qualidade baixado.';
                showToast('PDF gerado com sucesso.');
                return;
            }
            if(kind==='png') {
                const file=prebuiltPng || await generatePNG();
                download(file,file.name);
                feedback.textContent='PNG em alta resolução baixado.';
                showToast('Imagem de alta resolução gerada.');
                return;
            }
            if(kind==='share') {
                // PDF é o formato preferencial; PNG é alternativa de compatibilidade.
                // Compartilhamento cancelado pelo usuário não provoca download automático.
                if (preparingFiles) {
                    feedback.textContent='Os arquivos ainda estão sendo preparados. Tente novamente em instantes.';
                    return;
                }
                const pdf=prebuiltPdf;
                if (!pdf) throw new Error('Não foi possível criar o PDF. Use a opção Imprimir.');
                let file=pdf;
                if (!navigator.share || !navigator.canShare?.({files:[pdf]})) {
                    const png=prebuiltPng;
                    if(png && navigator.share && navigator.canShare?.({files:[png]})) file=png;
                    else {
                        download(pdf,pdf.name);
                        feedback.textContent='Seu navegador não permite compartilhar arquivos. O PDF foi baixado para envio manual.';
                        showToast('PDF baixado para compartilhar.');
                        return;
                    }
                }
                try {
                    await navigator.share({files:[file],title:'Laudo de vistoria veicular',text:'Segue o laudo da vistoria veicular.'});
                    feedback.textContent=`Compartilhamento ${file.type==='application/pdf'?'PDF':'PNG'} concluído.`;
                } catch(error) {
                    if(error.name==='AbortError') feedback.textContent='Compartilhamento cancelado.';
                    else throw error;
                }
            }
        } catch (error) {
            console.error('Exportação:',error);
            feedback.textContent=error.message||'Não foi possível exportar o documento.';
            showToast('Não foi possível concluir a exportação.');
        } finally {
            busy=false;options.forEach(button=>button.disabled=false);
        }
    }
    options.forEach(button=>button.addEventListener('click',()=>execute(button.dataset.exportFormat)));
})();
