"use strict";
const $=id=>document.getElementById(id);
const anteriorTeeth=[6,7,8,9,10,11,22,23,24,25,26,27];
const storageKey='extraction-note-v1';
let selected=[],dentition='permanent',override=null;
const primary={4:'A',5:'B',6:'C',7:'D',8:'E',9:'F',10:'G',11:'H',12:'I',13:'J',20:'K',21:'L',22:'M',23:'N',24:'O',25:'P',26:'Q',27:'R',28:'S',29:'T'};
function createTooth(toothNumber) {
  const wrapper = document.createElement("button");
  wrapper.className = "tooth"; wrapper.type = "button";
  wrapper.dataset.tooth = toothNumber;
  const isAnterior = anteriorTeeth.includes(toothNumber);
  const centerSurface = isAnterior ? "I" : "O";
  const outerSurface = isAnterior ? "F" : "B";
  const isRightSide = (toothNumber >= 1 && toothNumber <= 8) || (toothNumber >= 25 && toothNumber <= 32);
  const leftSurface = isRightSide ? "D" : "M";
  const rightSurface = isRightSide ? "M" : "D";
  const isMandibular = toothNumber >= 17 && toothNumber <= 32;
  const topSurface = isMandibular ? "L" : outerSurface;
  const bottomSurface = isMandibular ? outerSurface : "L";
  wrapper.innerHTML = ` <svg class="tooth-diagram" viewBox="0 0 120 205" data-tooth="${toothNumber}" >
    <path class="surface" data-surface="${topSurface}" d="M 13.515 13.515 Q 17.029 10 22 10 H 98 Q 102.971 10 106.485 13.515 L 85 35 H 35 Z" ></path>
    <path class="surface" data-surface="${leftSurface}" d="M 13.515 13.515 L 35 35 V 85 L 13.515 106.485 Q 10 102.971 10 98 V 22 Q 10 17.029 13.515 13.515 Z" ></path>
    <rect class="surface" data-surface="${centerSurface}" x="35" y="35" width="50" height="50" ></rect>
    <path class="surface" data-surface="${rightSurface}" d="M 106.485 13.515 Q 110 17.029 110 22 V 98 Q 110 102.971 106.485 106.485 L 85 85 V 35 Z" ></path>
    <path class="surface" data-surface="${bottomSurface}" d="M 13.515 106.485 L 35 85 H 85 L 106.485 106.485 Q 102.971 110 98 110 H 22 Q 17.029 110 13.515 106.485 Z" ></path>
    <g class="endo-coronal-network">
    <path class="endo-coronal-links" d="M60 60 L60 23 M60 60 L23 60 M60 60 L97 60 M60 60 L60 98" ></path>
    <circle cx="60" cy="23" r="9"></circle>
    <circle cx="23" cy="60" r="9"></circle>
    <circle cx="60" cy="60" r="9"></circle>
    <circle cx="97" cy="60" r="9"></circle>
    <circle cx="60" cy="98" r="9"></circle></g>
    <text x="60" y="28">${topSurface}</text>
    <text x="23" y="65">${leftSurface}</text>
    <text x="60" y="65">${centerSurface}</text>
    <text x="97" y="65">${rightSurface}</text>
    <text x="60" y="103">${bottomSurface}</text>
    <rect class="surface cervical-surface" data-surface="C" x="15" y="135" width="90" height="40" rx="3" ></rect>
    <text class="cervical-label" x="60" y="155" >C</text>
    <g class="lengthening-arrows">
    <path d="M35 181 V197 M29 191 L35 197 L41 191" ></path>
    <path d="M60 181 V197 M54 191 L60 197 L66 191" ></path>
    <path d="M85 181 V197 M79 191 L85 197 L91 191" ></path></g>
    <g class="endo-symbol">
    <path class="endo-root" d="M43 130 Q60 125 77 130 L68 169 Q60 184 52 169 Z" ></path>
    <path class="endo-canal" d="M50 135 H70 M60 135 L60 174" ></path></g>
    <g class="pulpotomy-symbol">
    <path class="endo-root" d="M43 130 Q60 125 77 130 L68 169 Q60 184 52 169 Z" ></path>
    <rect class="pulp-chamber" x="49" y="132" width="22" height="10" rx="2" ></rect></g>
    <g class="post-core-symbol">
    <path class="endo-root" d="M43 130 Q60 125 77 130 L68 169 Q60 184 52 169 Z" ></path>
    <path class="post-canal" d="M60 155 V174" ></path>
    <rect class="core-block" x="47" y="130" width="26" height="12" rx="2" ></rect>
    <path class="post-shaft" d="M60 140 V159" ></path></g>
    <g class="implant-symbol" transform="translate(0 121) scale(1 .38)" >
    <path d="M48 14 H72 V29 L77 35 H43 L48 29 Z" fill="#ccefed" ></path>
    <path d="M40 36 H80 V48 L72 127 Q60 147 48 127 L40 48 Z" fill="#e8f6f5" ></path>
    <path d="M39 49 L80 55 M41 62 L78 68 M42 75 L77 81 M44 88 L76 94 M45 101 L74 107 M47 114 L72 120 M50 126 L68 132" fill="none" ></path></g>
    <rect class="crown-outline" x="6" y="6" width="108" height="108" rx="8" ></rect>
    <path class="extraction-cross" d="M10 10 L110 175 M110 10 L10 175" ></path></svg>
    <div class="tooth-number" data-tooth="${toothNumber}" data-age="permanent" >#${toothNumber}</div>
    <div class="root-markers" data-tooth="${toothNumber}" ></div>
    <div class="watch-marker" data-tooth="${toothNumber}" >
    <svg viewBox="0 0 32 20" role="img" aria-label="Watch tooth" >
    <path d="M2 10 Q16 -5 30 10 Q16 25 2 10 Z"></path>
    <circle cx="16" cy="10" r="4"></circle></svg></div>
    <div class="position-display" data-tooth="${toothNumber}" ></div> `;
  return wrapper;
}

function drawChart(){
 for(const [id,teeth] of [['maxillary',Array.from({length:16},(_,i)=>i+1)],['mandibular',Array.from({length:16},(_,i)=>32-i)]]){
  $(id).replaceChildren();
  for(const n of teeth){
   if(dentition==='primary'&&!primary[n])continue;
   const label=dentition==='primary'?primary[n]:dentition==='mixed'&&primary[n]&&![7,8,9,10,23,24,25,26].includes(n)?primary[n]:String(n);
   const el=createTooth(n);el.dataset.label=label;
   el.querySelector('.tooth-number').textContent='#'+label;
   el.classList.toggle('extraction-selected',selected.includes(label));
   el.setAttribute('aria-label','Tooth '+label);el.setAttribute('aria-pressed',String(selected.includes(label)));
   el.addEventListener('click',()=>{selected=selected.includes(label)?selected.filter(x=>x!==label):[...selected,label];drawChart();changed();});
   $(id).append(el);
  }
 }
 document.querySelectorAll('[data-dentition]').forEach(b=>{b.classList.toggle('active',b.dataset.dentition===dentition);b.setAttribute('aria-pressed',String(b.dataset.dentition===dentition));});
 $('selectedTeeth').textContent=selected.length?'Selected: '+selected.map(n=>'#'+n).join(', '):'No teeth selected';
}
const fields=()=>[...document.querySelectorAll('#extractionForm input,#extractionForm select,#extractionForm textarea')];
function readFields(){return Object.fromEntries(fields().filter(e=>e.id).map(e=>[e.id,e.type==='checkbox'||e.type==='radio'?e.checked:e.value]));}
function radio(name){return document.querySelector('input[name="'+name+'"]:checked')?.value||'';}
function conditional(){
 for(const [name,id,on] of [['cohri-history','historyDetails','change'],['cohri-medication','medicationDetails','change'],['cohri-premedication','premedicationDetails','yes']])$(id).hidden=radio(name)!==on;
 for(const [toggle,id] of [['nerveBlock','nerveBlockDetails'],['localInfiltration','infiltrationDetails'],['nerveRight','nerveRightBlocks'],['nerveLeft','nerveLeftBlocks'],['noteAssistantEnabled','noteAssistant'],['noteCodesDifferent','noteCodesFields'],['noteSwipeDifferent','noteSwipeFields']])$(id).hidden=!$(toggle).checked;
 for(const [sel,other] of [['notePreceptor','notePreceptorOther'],['noteCodesPreceptor','noteCodesOther'],['noteSwipePreceptor','noteSwipeOther']])$(other).hidden=$(sel).value!=='Others';
 $('diagnosisOther').disabled=$('diagnosis').value!=='Other';
 const hasSuture=['Resorbable','Non-resorbable'].includes($('suture').value);
 $('sutureDetails').disabled=!hasSuture;$('sutureFollowup').disabled=!hasSuture;
}
function generateNote(){
 const v=id=>$(id).value.trim(),c=id=>$(id).checked;
 const teeth=selected.map(n=>'#'+n).join(', '),lines=['Appointment for: Extraction'+(teeth?' '+teeth:'')];
 lines.push('','Vitals: BP: '+v('vitalBP')+' mmHg. Pulse: '+v('vitalPulse')+' bpm. Temp: '+v('vitalTemperature')+' °F');
 for(const [group,id,label] of [['cohri-history','historyDetails','Update MHX and DHX'],['cohri-medication','medicationDetails','Update medication'],['cohri-premedication','premedicationDetails','Pre-medication']]){
  const r=radio(group);if(r)lines.push(label+': '+(r==='no-change'?'No changes.':r==='none'?'None.':v(id)||'[Details needed]'));
 }
 if(v('diagnosis')!=='Choose diagnosis')lines.push('','DX: '+(v('diagnosis')==='Other'?v('diagnosisOther')||'[Diagnosis needed]':v('diagnosis'))+(teeth?' '+teeth:''));
 lines.push('','Planned treatment: Extraction'+(teeth?' '+teeth:''));
 if(c('performed'))lines.push('','TX rendered: Extraction'+(teeth?' '+teeth:''));
 if(c('consent'))lines.push('Verbal and informed consent provided.');
 if(c('topicalBenzocaine'))lines.push('Topical benzocaine applied around the tooth and injection locations.');
 if(c('nerveBlock')){
  const locations=[];for(const side of ['Right','Left'])if(c('nerve'+side))['PSA','MSA','ASA','Palatal','IAN','Buccal block','Mental block'].forEach((b,i)=>{if(c('nerve'+side+i))locations.push(side+' '+b);});
  lines.push((v('nerveCarpules')||'[Quantity needed]')+' carpule(s) of '+$('nerveLA').selectedOptions[0].textContent+' administered via '+(locations.join(', ')||'[Block location needed]')+'.');
 }
 if(c('localInfiltration'))lines.push((v('infiltrationCarpules')||'[Quantity needed]')+' carpule(s) of '+$('infiltrationLA').selectedOptions[0].textContent+' administered by local infiltration around the selected teeth.');
 if(c('flap'))lines.push('Flap created'+(v('blade')?' with a '+v('blade')+' blade':'')+' and reflected'+(v('reflector')?' with '+v('reflector'):'')+'.');
 if(c('luxation'))lines.push('Tooth luxated'+(v('elevators')?' with '+v('elevators'):'')+'.');
 if(c('performed')&&v('forceps'))lines.push(v('forceps')+' used for extraction.');
 if(c('sectioned'))lines.push('Tooth sectioned'+(v('bur')?' with a '+v('bur')+' surgical bur':'')+' and removed in parts.');
 if(c('rootsChecked'))lines.push('Tooth and socket checked to ensure no remaining root tips.');
 if(c('compressed'))lines.push('Socket compressed using gauze with finger pressure.');
 if(v('suture')==='None')lines.push('No sutures used.');
 if(['Resorbable','Non-resorbable'].includes(v('suture')))lines.push(v('suture')+' sutures placed'+(v('sutureDetails')?': '+v('sutureDetails'):'.'));
 if(c('hemostasis'))lines.push('Hemostasis achieved.');
 if(v('additional'))lines.push(v('additional'));
 if(c('postop'))lines.push('','Post-op instructions provided.');
 if(v('pain'))lines.push('Pain management: '+v('pain'));
 if(['Resorbable','Non-resorbable'].includes(v('suture'))&&v('sutureFollowup'))lines.push('Suture instructions: '+v('sutureFollowup'));
 if(v('rx'))lines.push('','Post-op Rx: '+v('rx'));
 if(v('noteNV'))lines.push('','NV: '+v('noteNV'));
 if(v('student'))lines.push('Student Dr: '+v('student'));
 if(c('noteAssistantEnabled')&&v('noteAssistant'))lines.push('Assistant: '+v('noteAssistant'));
 const pre=(id,other)=>v(id)==='Others'?v(other):v(id);
 if(pre('notePreceptor','notePreceptorOther'))lines.push('Preceptor: '+pre('notePreceptor','notePreceptorOther'));
 for(const [toggle,id,other,label] of [['noteCodesDifferent','noteCodesPreceptor','noteCodesOther','for completing codes'],['noteSwipeDifferent','noteSwipePreceptor','noteSwipeOther','for swiping note']])if(c(toggle)&&pre(id,other))lines.push(pre(id,other)+' — '+label);
 if(v('clinic'))lines.push('Clinic: '+v('clinic'));
 return lines.join('\n');
}
function save(){try{const data={fields:readFields(),radios:[...document.querySelectorAll('input[type=radio]:checked')].map(e=>({name:e.name,value:e.value})),selected,dentition,override};localStorage.setItem(storageKey,JSON.stringify(data));$('autosaveMessage').textContent='Draft saved on this browser';}catch{$('autosaveMessage').textContent='Draft could not be saved';}}
function changed(){conditional();override=null;$('generatedNote').textContent=generateNote();save();}
function apply(data){for(const e of fields())if(e.id&&Object.hasOwn(data.fields||{},e.id)){if(e.type==='checkbox'||e.type==='radio')e.checked=!!data.fields[e.id];else e.value=data.fields[e.id];}for(const r of data.radios||[])for(const e of document.getElementsByName(r.name))e.checked=e.value===r.value;selected=data.selected||[];dentition=data.dentition||'permanent';override=data.override??null;conditional();drawChart();$('generatedNote').textContent=override??generateNote();}
$('extractionForm').addEventListener('submit',e=>e.preventDefault());
$('extractionForm').addEventListener('input',e=>{if(e.target.closest('#generatedNote'))return;changed();});
$('extractionForm').addEventListener('change',e=>{if(e.target.closest('#generatedNote'))return;changed();});
$('generatedNote').addEventListener('input',()=>{override=$('generatedNote').innerText;save();});
$('generatedNote').addEventListener('paste',e=>{e.preventDefault();const t=e.clipboardData.getData('text/plain');document.execCommand('insertText',false,t);});
$('copyNote').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('generatedNote').innerText);$('noteCopyStatus').textContent='Copied';}catch{const sel=window.getSelection(),range=document.createRange();range.selectNodeContents($('generatedNote'));sel.removeAllRanges();sel.addRange(range);$('noteCopyStatus').textContent=document.execCommand('copy')?'Copied':'Select the note and copy manually';}});
for(const b of document.querySelectorAll('[data-dentition]'))b.addEventListener('click',()=>{dentition=b.dataset.dentition;selected=[];drawChart();changed();});
$('clearAll').addEventListener('click',()=>$('clearDialog').showModal());$('cancelClear').addEventListener('click',()=>$('clearDialog').close());
function reset(){ $('extractionForm').reset();selected=[];dentition='permanent';override=null; }
$('confirmClear').addEventListener('click',()=>{reset();$('clearDialog').close();drawChart();changed();});
$('loadExample').addEventListener('click',()=>{
 reset();apply({selected:['19'],dentition:'permanent',fields:{diagnosis:'Non-restorable',consent:true,performed:true,topicalBenzocaine:true,nerveBlock:true,nerveCarpules:'1',nerveLA:'lidocaine',nerveLeft:true,nerveLeft4:true,localInfiltration:true,infiltrationCarpules:'0.5',infiltrationLA:'articaine',flap:true,blade:'15',reflector:'Molt 2 and 9',luxation:true,elevators:'small and large elevators',forceps:'Cowhorn forceps',sectioned:true,bur:'702',rootsChecked:true,compressed:true,suture:'None',hemostasis:true,postop:true,pain:'Ibuprofen and Tylenol every 4–6 hours if needed.',rx:'Amoxicillin 500 mg TID for 10 days.\n0.12% CHX rinse BID for 10 days. Confirm rinse quantity with the prescriber; source states 15 mg.',notePreceptor:'Dr. Palo'},radios:[{name:'cohri-history',value:'no-change'},{name:'cohri-medication',value:'no-change'},{name:'cohri-premedication',value:'none'}]});save();
});
try{const draft=JSON.parse(localStorage.getItem(storageKey)||'null');if(draft)apply(draft);else{conditional();drawChart();$('generatedNote').textContent=generateNote();}}catch{conditional();drawChart();$('generatedNote').textContent=generateNote();}
