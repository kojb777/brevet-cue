/* Extract intersection diagrams from the chosen worksheet in an XLSX file. */
const CueDrawings = (() => {
  const kids = el => Array.from(el?.children || []);
  const one = (el, name) => kids(el).find(n => n.localName === name);
  const all = (el, name) => Array.from(el?.getElementsByTagNameNS('*',name) || []);
  const attr = (el, key) => el?.getAttribute(key) ?? '';
  const num = (el,key,f=0) => attr(el,key) === '' ? f : Number(attr(el,key));
  const f = n => Number.isFinite(n) ? +n.toFixed(5) : 0;
  const axis = (el,key) => Number(one(el,key)?.textContent ?? NaN);
  const xml = s => {
    const d = new DOMParser().parseFromString(s,'application/xml');
    if (all(d,'parsererror').length) throw Error('Excel XMLを解析できません');
    return d.documentElement;
  };
  const resolve = (base,target) => {
    const parts = target.startsWith('/') ? [] : base.split('/').slice(0,-1);
    for (const p of target.split('/')) {
      if (p === '..') parts.pop();
      else if (p && p !== '.') parts.push(p);
    }
    return parts.join('/');
  };
  const rid = (el,k) => Array.from(el?.attributes || []).find(a => a.localName === k && a.namespaceURI?.endsWith('/relationships'))?.value;
  const limit = 24 * 1024 * 1024;
  function archive(ab) {
    const d = new DataView(ab), bytes = new Uint8Array(ab), files = new Map(), dec = new TextDecoder();
    let end = d.byteLength-22;
    while(end >= 0 && end >= d.byteLength-65557 && (d.getUint32(end,true)!==0x06054b50 || end+22+d.getUint16(end+20,true)!==d.byteLength)) end--;
    if(end < 0 || end < d.byteLength-65557) throw Error('XLSXのZIPを開けません');
    let at=d.getUint32(end+16,true);
    for(let i=0, count=d.getUint16(end+10,true); i<count; i++){
      if(d.getUint32(at,true)!==0x02014b50) throw Error('XLSXのZIPを開けません');
      const n=d.getUint16(at+28,true), name=dec.decode(bytes.subarray(at+46,at+46+n));
      files.set(name,[d.getUint32(at+42,true), d.getUint16(at+10,true),d.getUint32(at+20,true),d.getUint32(at+24,true)]);
      at+=46+n+d.getUint16(at+30,true)+d.getUint16(at+32,true);
    }
    async function read(name) {
      if(!files.has(name)) return null;
      const [at,method,compressed,size]=files.get(name);
      if(size>limit || d.getUint32(at,true)!==0x04034b50) throw Error('Excelパーツを開けません');
      const start=at+30+d.getUint16(at+26,true)+d.getUint16(at+28,true);
      if(start+compressed>bytes.length) throw Error('Excelパーツが不完全です');
      const data=bytes.subarray(start,start+compressed);
      if(method===0 && data.length===size) return data;
      if(method!==8 || typeof DecompressionStream==='undefined') throw Error('このブラウザではExcel図形を展開できません');
      const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      const out=new Uint8Array(size);
      let pos=0;
      while(true){
        const {done,value}=await reader.read();
        if(done) break;
        if(pos+value.length>size){await reader.cancel();throw Error('Excelパーツのサイズが一致しません')}
        out.set(value,pos);pos+=value.length;
      }
      if(pos!==size) throw Error('Excelパーツのサイズが一致しません');
      return out;
    }
    return {read,doc:async name=>{const data=await read(name);return data&&xml(dec.decode(data));}};
  }
  async function rels(pkg,part) {
    const i=part.lastIndexOf('/'), path=part.slice(0,i+1)+'_rels/'+part.slice(i+1)+'.rels';
    return new Map(kids(await pkg.doc(path)).filter(x=>x.localName==='Relationship'&&attr(x,'TargetMode')!=='External').map(x=>[attr(x,'Id'),{path:resolve(part,attr(x,'Target')),type:attr(x,'Type')} ]));
  }
  const rich = el => kids(el).filter(n=>n.localName==='r'||n.localName==='t').map(n=>n.localName==='t'?n.textContent:one(n,'t')?.textContent||'').join('');
  const col = ref => Array.from(ref.match(/^[A-Z]+/)?.[0] || '').reduce((a,c)=>a*26+c.charCodeAt(0)-64,0)-1;
  async function worksheet(ab) {
    const pkg=archive(ab), rootRels=await rels(pkg,'');
    const wbPart=[...rootRels.values()].find(x=>x.type.endsWith('/officeDocument'))?.path || 'xl/workbook.xml';
    const wb=await pkg.doc(wbPart), wr=await rels(pkg,wbPart);
    const part=wr.get(rid(one(one(wb,'sheets'),'sheet'),'id'))?.path;
    const ws=part&&await pkg.doc(part);
    if(!ws) throw Error('ワークシートがありません');
    const sharedPart=[...wr.values()].find(x=>x.type.endsWith('/sharedStrings'))?.path;
    const shared=sharedPart?kids(await pkg.doc(sharedPart)).map(rich):[];
    const rows=[], heights=new Map();
    for(const row of kids(one(ws,'sheetData'))){
      const i=num(row,'r')-1;
      if(i<0||i>=1048576) continue;
      const values=rows[i]=[];
      if(attr(row,'ht')) heights.set(i,num(row,'ht')*12700);
      for(const cell of kids(row)){
        const j=col(attr(cell,'r')), val=one(cell,'v')?.textContent, type=attr(cell,'t');
        if(j<0||j>=16384)continue;
        values[j]=type==='s'?shared[Number(val)]??'':type==='inlineStr'?rich(one(cell,'is')):val===undefined?'':type===''||type==='n'?Number(val):val;
      }
    }
    const merges = all(ws,'mergeCell').map(x=>attr(x,'ref')).map(v=>v.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/)).filter(Boolean).map(m=>({left:col(m[1]),right:col(m[3]),top:+m[2]-1,bottom:+m[4]-1}));
    return {pkg,part,ws,rows,heights,merges};
  }

  function color(fill,otherwise) {
    if(!fill) return otherwise;
    if(fill.localName==='noFill') return 'none';
    const c=kids(fill)[0], v=attr(c,'val');
    if(c?.localName==='srgbClr' && /^[0-9A-Fa-f]{6}$/.test(v))return '#'+v;
    return ({tx1:'#000',dk1:'#000',bg1:'#fff',lt1:'#fff',accent1:'#4472c4'})[v]||otherwise;
  }
  const fillOf = el => kids(el).find(n=>/^(solidFill|noFill)$/.test(n.localName));
  const base64 = bytes => {
    let out='';
    for(let i=0;i<bytes.length;i+=4096)out+=String.fromCharCode(...bytes.subarray(i,i+4096));
    return btoa(out);
  };
  // The legacy WMFs in this format use placeable bounds and filled polygon records.
  function wmf(b) {
    if(b.byteLength<40) return null;
    const d=new DataView(b.buffer,b.byteOffset,b.byteLength), s=i=>d.getInt16(i,true), u=i=>d.getUint16(i,true), l=i=>d.getUint32(i,true);
    if(l(0)!==0x9ac6cdd7) return null;
    const x=s(6),y=s(8),w=s(10)-x,h=s(12)-y;
    if(w<=0||h<=0) return null;
    let brush='#000',stroke='none',sw=1,out='';
    const objs=[];
    const add=obj=>{const idx=objs.indexOf(null);if(idx<0)objs.push(obj);else objs[idx]=obj;};
    const rgb=i=>'#'+[b[i],b[i+1],b[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');
    for(let i=40;i+6<=b.length;){
      const len=l(i)*2,fn=u(i+4),q=i+6;
      if(len<6||i+len>b.length)return null;
      if(fn===0)break;
      if(fn===0x2fc&&len>=14)add({brush:u(q)===1?'none':rgb(q+2)});
      else if(fn===0x2fa&&len>=16)add({stroke:(u(q)&15)===5?'none':rgb(q+6),sw:Math.max(1,Math.abs(s(q+2)))});
      else if(fn===0x12d&&len>=8){const o=objs[u(q)];if(o?.brush!==undefined)brush=o.brush;if(o?.stroke!==undefined){stroke=o.stroke;sw=o.sw;}}
      else if(fn===0x1f0&&len>=8)objs[u(q)]=null;
      else if((fn===0x538||fn===0x324)&&len>=8){
        const cnt=fn===0x538?u(q):1, start=fn===0x538?q+2:q;
        if(start+cnt*2>i+len)return null;
        let p=start+cnt*2,path='';
        for(let k=0;k<cnt;k++){
          const n=u(start+k*2);if(p+4*n>i+len)return null;
          for(let j=0;j<n;j++,p+=4)path+=(j?'L':'M')+s(p)+' '+s(p+2)+' ';
          path+='Z ';
        }
        out+='<path d="'+path+'" fill="'+brush+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
      } else if(![0x103,0x20b,0x20c,0x106].includes(fn))return null;
      i+=len;
    }
    return out&&{out,view:[x,y,w,h].join(' ')};
  }
  function bounds(xfrm) {
    const p=one(xfrm,'off'), e=one(xfrm,'ext');
    return [num(p,'x'),num(p,'y'),num(e,'cx'),num(e,'cy')];
  }
  const yes=(el,k)=>['1','true'].includes(attr(el,k));
  function pose(t,w,h) {
    return 'translate('+f(w/2)+' '+f(h/2)+') rotate('+f(num(t,'rot')/60000)+') scale('+(yes(t,'flipH')?-1:1)+' '+(yes(t,'flipV')?-1:1)+') translate('+f(-w/2)+' '+f(-h/2)+')';
  }
  async function diagrams(sheet,cues,drawCol){
    const {pkg,part,ws,heights,merges}=sheet;
    const locations=await rels(pkg,part), media=new Map(), byRow=new Map();
    const cueRows=new Set(cues.map(c=>c.xlsxRow-1));
    const defaultH=num(one(ws,'sheetFormatPr'),'defaultRowHeight',15)*12700;
    const h=r=>heights.get(r)||defaultH, tops=[0];
    const top=r=>{while(tops.length<=r)tops.push(tops.at(-1)+h(tops.length-1));return tops[r];};
    let skipped=0;
    for(const drawing of kids(ws).filter(n=>n.localName==='drawing')){
      const dPath=locations.get(rid(drawing,'id'))?.path;
      if(!dPath) continue;
      const doc=await pkg.doc(dPath), zr=await rels(pkg,dPath);
      for(const anchor of kids(doc)){
        const from=one(anchor,'from'), to=one(anchor,'to'), obj=kids(anchor).find(n=>['grpSp','sp','pic','cxnSp'].includes(n.localName));
        if(axis(from,'col')!==drawCol||!obj) continue;
        let row=axis(from,'row');
        const end=to?axis(to,'row'):row, dim=one(anchor,'ext'),off=axis(from,'rowOff');
        if(!Number.isInteger(row)||row<0||row>=1048576||end<row||end>row+1||(to&&axis(to,'col')>drawCol+1)){skipped++;continue;}
        const originalRow=row;
        const merged=merges.find(m=>m.left===drawCol&&m.right===drawCol&&m.top<=row&&row<=m.bottom);
        const inRow=h(row)-off, spill=to?(end>row?axis(to,'rowOff'):0):Math.max(0,num(dim,'cy')-inRow);
        if(merged && end<=merged.bottom){
          row=merged.top;
        }else if(spill>0){
          if(inRow<0||spill>h(row+1)){skipped++;continue;}
          if(spill>2*inRow)row++;
          else if(spill>=inRow/2){skipped++;continue;}
        }
        if(!cueRows.has(row)){skipped++;continue;}
        const group=byRow.get(row)||[];
        group.push({obj,zr,offset:[axis(from,'colOff'),top(originalRow)-top(row)+off]});byRow.set(row,group);
      }
    }
    const imgs = new Map();
    for(const [row,objs] of byRow){
      let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,body='',markers='',seq=0;
      async function draw(obj,physicalUnits,offset){
        const kind=obj.localName, prop=one(obj,kind==='grpSp'?'grpSpPr':'spPr'), t=one(prop,'xfrm');
        if(!t) return null;
        const [originalX,originalY,w,h]=bounds(t), [x,y]=offset||[originalX,originalY], group=(out)=>'<g transform="translate('+f(x)+' '+f(y)+') '+pose(t,w,h)+'">'+out+'</g>';
        if(kind==='grpSp'){
          const a=one(t,'chOff'), b=one(t,'chExt'), cw=num(b,'cx'),ch=num(b,'cy');
          if(!cw||!ch||!w||!h)return null;
          const scale=Math.sqrt(Math.abs(w/cw*h/ch)), children=kids(obj).filter(c=>['grpSp','sp','pic','cxnSp'].includes(c.localName));
          let content='';
          for(const child of children){
            const ctl=one(one(child,child.localName==='grpSp'?'grpSpPr':'spPr'),'xfrm');
            const [cx,cy]=bounds(ctl);
            const v=await draw(child,physicalUnits*scale,[cx-num(a,'x'),cy-num(a,'y')]);
            if(!v)return null;content+=v;
          }
          return content&&group('<g transform="scale('+f(w/cw)+' '+f(h/ch)+')">'+content+'</g>');
        }
        if(kind==='pic'){
          const blip=one(one(obj,'blipFill'),'blip'), path=zrFor.get(rid(blip,'embed'))?.path;
          if(!path||!w||!h)return null;
          if(!media.has(path)){
            const raw=await pkg.read(path);
            let src=null;
            if(raw&&raw.length<=300000){
              if(/\.wmf$/i.test(path))src=wmf(raw);
              else if(/\.(png|jpeg|jpg|gif)$/i.test(path)){const ext=path.split('.').pop().toLowerCase();src={uri:'data:image/'+(ext==='jpg'?'jpeg':ext)+';base64,'+base64(raw)};}
            }
            media.set(path,src);
          }
          const src=media.get(path);
          return !src?null:group(src.uri?'<image width="'+f(w)+'" height="'+f(h)+'" href="'+src.uri+'"/>':'<svg width="'+f(w)+'" height="'+f(h)+'" viewBox="'+src.view+'">'+src.out+'</svg>');
        }
        const preset=one(prop,'prstGeom'), name=attr(preset,'prst'), custom=one(prop,'custGeom'), ln=one(prop,'ln');
        const fill=color(fillOf(prop),custom||['line','straightConnector1','bentConnector3'].includes(name)?'none':'#fff');
        const stroke=color(fillOf(ln), '#000'), width=f(num(ln,'w',19050)/physicalUnits);
        const style=' fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round" stroke-linecap="'+(attr(ln,'cap')==='flat'?'butt':'round')+'"';
        let tips='';
        for(const [key,end] of [['marker-start','headEnd'],['marker-end','tailEnd']]){
          const arrow=one(ln,end),type=attr(arrow,'type');
          if(!type||type==='none'||stroke==='none')continue;
          if(type!=='triangle')return null;
          const id='a'+(++seq), len=attr(arrow,'len')==='sm'?2.4:3.2, wide=attr(arrow,'w')==='sm'?2.3:3.2;
          markers+='<marker id="'+id+'" markerWidth="'+len+'" markerHeight="'+wide+'" refX="'+len+'" refY="'+wide/2+'" orient="auto-start-reverse"><path d="M0 0L'+len+' '+wide/2+'L0 '+wide+'Z" fill="'+stroke+'"/></marker>';
          tips+=' '+key+'="url(#'+id+')"';
        }
        const path = d=>'<path d="'+d+'"'+style+tips+'/>';
        if(name==='line'||name==='straightConnector1')return group(path('M0 0 L'+f(w)+' '+f(h)));
        if(name==='bentConnector3'){
          const g=all(preset,'gd').find(n=>attr(n,'name')==='adj1'), mid=f(w*(Number(attr(g,'fmla').split(' ')[1]||50000)/100000));
          return group(path('M0 0 H'+mid+' V'+f(h)+' H'+f(w)));
        }
        if(name==='rect')return group('<rect width="'+f(w)+'" height="'+f(h)+'"'+style+'/>');
        if(name==='ellipse')return group('<ellipse cx="'+f(w/2)+'" cy="'+f(h/2)+'" rx="'+f(w/2)+'" ry="'+f(h/2)+'"'+style+'/>');
        if(!custom) return null;
        let paths='';
        for(const p of kids(one(custom,'pathLst'))){
          const pw=num(p,'w',w),ph=num(p,'h',h);
          if(!pw||!ph)return null;
          let d='';
          for(const cmd of kids(p)){
            const key={moveTo:'M',lnTo:'L',cubicBezTo:'C',quadBezTo:'Q',close:'Z'}[cmd.localName],pts=kids(cmd);
            if(!key||pts.length!==({M:1,L:1,C:3,Q:2,Z:0})[key]||pts.some(pt=>!Number.isFinite(Number(attr(pt,'x')))||!Number.isFinite(Number(attr(pt,'y')))))return null;
            d+=key+pts.map(pt=>f(num(pt,'x')*w/pw)+' '+f(num(pt,'y')*h/ph)).join(' ')+' ';
          }
          paths+=path(d);
        }
        return paths&&group(paths);
      }
      let zrFor, invalid=false;
      for(const {obj,zr,offset} of objs){
        zrFor=zr;
        const t=one(one(obj,obj.localName==='grpSp'?'grpSpPr':'spPr'),'xfrm'), [,,w,h]=bounds(t), [x,y]=offset;
        const rad=num(t,'rot')/60000*Math.PI/180, hw=(Math.abs(w*Math.cos(rad))+Math.abs(h*Math.sin(rad)))/2, hh=(Math.abs(w*Math.sin(rad))+Math.abs(h*Math.cos(rad)))/2;
        minX=Math.min(minX,x+w/2-hw);minY=Math.min(minY,y+h/2-hh);
        maxX=Math.max(maxX,x+w/2+hw);maxY=Math.max(maxY,y+h/2+hh);
        const v=await draw(obj,1,offset);
        if(!v){invalid=true;break;}
        body+=v;
      }
      if(invalid||!body){skipped++;continue;}
      const margin=52000,vw=maxX-minX+2*margin,vh=maxY-minY+2*margin;
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+Math.round(96*vw/Math.max(vw,vh))+'" height="'+Math.round(96*vh/Math.max(vw,vh))+'" viewBox="'+[0,0,vw,vh].map(f).join(' ')+'"><defs>'+markers+'</defs><g transform="translate('+f(margin-minX)+' '+f(margin-minY)+')">'+body+'</g></svg>';
      if(svg.length>18000){skipped++;continue;}
      const uri='data:image/svg+xml;base64,'+btoa(svg);
      imgs.set(row,uri);
      const merged=merges.find(m=>m.left===drawCol&&m.right===drawCol&&m.top===row);
      if(merged)for(const r of cueRows)if(r>row&&r<=merged.bottom)imgs.set(r,uri);
    }
    return {imgs,skipped};
  }
  return {worksheet,diagrams};
})();
