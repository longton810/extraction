"use strict";
const $=id=>document.getElementById(id);
const storageKey='extraction-note-v1';
let selected=[],dentition='permanent',override=null,chartAges={},missingTeeth=[],diagnoses=[],plannedTreatments=[],selectedFindingNames=[],providedTreatments=null; 
const primary={4:'A',5:'B',6:'C',7:'D',8:'E',9:'F',10:'G',11:'H',12:'I',13:'J',20:'K',21:'L',22:'M',23:'N',24:'O',25:'P',26:'Q',27:'R',28:'S',29:'T'};
function createTooth(toothNumber) {
 const wrapper=document.createElement('div');
 wrapper.className='tooth';wrapper.dataset.tooth=toothNumber;
 wrapper.innerHTML=`<svg class="tooth-diagram" viewBox="0 0 120 205" data-tooth="${toothNumber}" aria-hidden="true"><rect class="tooth-rectangle" x="18" y="10" width="84" height="165" rx="6"></rect><path class="planned-extraction-mark" d="M18 10 L102 175 M102 10 L18 175"></path><path class="planned-alveoloplasty-mark" d="M18 190 H102"></path></svg><div class="tooth-number" data-tooth="${toothNumber}" data-age="permanent">#${toothNumber}</div>`;
 return wrapper;
}

function chartLabel(n){
 const permanent=dentition==='permanent'||(dentition==='mixed'&&[3,14,19,30,7,8,9,10,23,24,25,26].includes(n));
 const age=chartAges[n]||(permanent?'permanent':'primary');
 return age==='primary'?(primary[n]||null):String(n);
}
function drawChart(){
 for(const [id,teeth] of [['maxillary',Array.from({length:16},(_,i)=>i+1)],['mandibular',Array.from({length:16},(_,i)=>32-i)]]){
  $(id).replaceChildren();
  teeth.forEach((n,index)=>{
   const visibleLabel=chartLabel(n),label=visibleLabel||String(n);
   const el=createTooth(n);el.hidden=!visibleLabel;el.dataset.label=label;if(index===7)el.classList.add('midline');
   const number=el.querySelector('.tooth-number');
   number.textContent='#'+label;number.dataset.age=label===String(n)?'permanent':'primary';
   number.setAttribute('role','button');number.tabIndex=0;number.setAttribute('aria-label','Select tooth '+label);
   number.classList.toggle('selected',selected.includes(label));number.setAttribute('aria-pressed',String(selected.includes(label)));
   const missing=missingTeeth.includes(label);el.querySelector('.tooth-diagram').classList.toggle('missing',missing);
   if(missing)number.setAttribute('aria-label','Select missing tooth '+label);
   const toggle=()=>{selectedFindingNames=[];$('selectAllFindings').checked=false;selected=selected.includes(label)?selected.filter(x=>x!==label):[...selected,label];drawChart();changed();};
   number.addEventListener('click',toggle);number.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
   // Extraction applies to a whole tooth; clicking its drawing selects its number.
   el.querySelector('.tooth-diagram').addEventListener('click',toggle);
   $(id).append(el);
  });
 }
 document.querySelectorAll('[data-dentition]').forEach(b=>{b.classList.toggle('active',b.dataset.dentition===dentition&&Object.keys(chartAges).length===0);b.setAttribute('aria-pressed',String(b.classList.contains('active')));});
 $('missingMain').disabled=!selected.length;$('changeAge').disabled=!selected.length;
 $('selectedTeeth').textContent=selected.length?'Selected: '+selected.map(n=>'#'+n).join(', '):'Select tooth numbers for extraction';
 syncQuadrantCheckboxes();
 colorToothFindings();
 renderTreatmentMarks();
 alignChartMidline();
}
function alignChartMidline(){
 const canvas=document.querySelector('.dentition-canvas');
 const tooth8=document.querySelector('#maxillary .tooth-diagram[data-tooth="8"]');
 const tooth9=document.querySelector('#maxillary .tooth-diagram[data-tooth="9"]');
 if(!canvas||!tooth8||!tooth9)return;
 const midpoint=(tooth8.getBoundingClientRect().right+tooth9.getBoundingClientRect().left)/2;
 canvas.style.setProperty('--tooth-midline',(midpoint-canvas.getBoundingClientRect().left)+'px');
}
requestAnimationFrame(alignChartMidline);
window.addEventListener('resize',alignChartMidline);

const fields=()=>[...document.querySelectorAll('#extractionForm input,#extractionForm select,#extractionForm textarea')];
function readFields(){return Object.fromEntries(fields().filter(e=>e.id).map(e=>[e.id,e.type==='checkbox'||e.type==='radio'?e.checked:e.value]));}
function radio(name){return document.querySelector('input[name="'+name+'"]:checked')?.value||'';}
function conditional(){
 updatePrescriptionFields();
 updateSurgicalOptions();
 $('pain').value=generatePostoperativeCare();
 updateForcepsFields();
 $('bladeDetails').hidden=!$('flap').checked;
 if(!['15','12'].includes($('blade').value))$('blade').value='15';
 ensureProvidedTreatments();
 $('providedChanges').hidden=radio('cohri-provided')!=='change';
 selectedFindingNames=selectedFindingNames.filter(name=>diagnoses.some(d=>d.finding===name));
 $('selectAllFindings').disabled=!diagnoses.length;
 if(!diagnoses.length)$('selectAllFindings').checked=false;
 for(const [name,id,on] of [['cohri-history','historyDetails','change'],['cohri-medication','medicationDetails','change'],['cohri-premedication','premedicationDetails','yes']])$(id).hidden=radio(name)!==on;
 for(const [toggle,id] of [['nerveBlock','nerveBlockDetails'],['localInfiltration','infiltrationDetails'],['nerveRight','nerveRightBlocks'],['nerveLeft','nerveLeftBlocks'],['noteAssistantEnabled','noteAssistant'],['noteCodesDifferent','noteCodesFields'],['noteSwipeDifferent','noteSwipeFields']])$(id).hidden=!$(toggle).checked;
 for(const [sel,other] of [['notePreceptor','notePreceptorOther'],['noteCodesPreceptor','noteCodesOther'],['noteSwipePreceptor','noteSwipeOther']])$(other).hidden=$(sel).value!=='Others';
 if($('diagnosis').value==='Retained root tip')$('diagnosis').value='Root tip';
 const otherDiagnosis=$('diagnosis').value==='Other';
 $('addOtherDiagnosis').hidden=!otherDiagnosis;
 $('diagnosisOther').hidden=!otherDiagnosis;$('diagnosisOther').disabled=!otherDiagnosis;
 document.querySelectorAll('[data-diagnosis]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.diagnosis===$('diagnosis').value)));

}
function generateNote(){
 const v=id=>$(id).value.trim(),c=id=>$(id).checked;
 const plannedSummary=groupPlannedTreatments().map(formatPlannedTreatment).join('; ');
 const providedRecords=currentProvidedTreatments();
 const providedSummary=groupPlannedTreatments(providedRecords).map(formatPlannedTreatment).join('; ');
 const lines=['Appointment for: '+plannedSummary];
 lines.push('','Vitals: BP: '+v('vitalBP')+' mmHg. Pulse: '+v('vitalPulse')+' bpm. Temp: '+v('vitalTemperature')+' °F');
 for(const [group,id,label] of [['cohri-history','historyDetails','Update MHX and DHX'],['cohri-medication','medicationDetails','Update medication'],['cohri-premedication','premedicationDetails','Pre-medication']]){
  const r=radio(group);if(r)lines.push(label+': '+(r==='no-change'?'No changes.':r==='none'?'None.':v(id)||'[Details needed]'));
 }
 if(diagnoses.length)lines.push('','DX: '+groupDiagnoses().map(formatDiagnosisGroup).join('; '));
 if(plannedSummary)lines.push('','Planned treatment: '+plannedSummary);
 if(providedSummary)lines.push('','TX rendered: '+providedSummary);
 if(c('consent'))lines.push('Verbal and informed consent provided.');
 if(c('inhaledNOYes'))lines.push('- Inhaled NO: Used to alleviate patient anxiety and provide mild analgesia. 100% O2 was administered during the starting procedure, then NO increased to 50%. Upon completion of the procedure, the patient inhaled with 100% O2 for 5 minutes.');
 const anesthesia=generateAnesthesiaParagraph();
 if(anesthesia)lines.push('- Anesthesia: '+anesthesia);
 const extraction=generateExtractionParts();
 if(extraction.length)lines.push('- Extraction: '+extraction.map(part=>part.text).join(''));
 if(v('additional'))lines.push(v('additional'));
 if(v('pain'))lines.push('','Post-operative care: '+v('pain'));
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
function save(){try{const data={fields:readFields(),radios:[...document.querySelectorAll('input[type=radio]:checked')].map(e=>({name:e.name,value:e.value})),selected,dentition,override,chartAges,missingTeeth,diagnoses,plannedTreatments,selectedFindingNames,providedTreatments};localStorage.setItem(storageKey,JSON.stringify(data));$('autosaveMessage').textContent='Draft saved on this browser';}catch{$('autosaveMessage').textContent='Draft could not be saved';}}
function changed(){conditional();renderPlannedTreatments();renderProvidedTreatments();renderDiagnoses();colorToothFindings();renderTreatmentMarks();override=null;renderClinicalNote(generateNote());save();}
function apply(data){for(const e of fields())if(e.id&&Object.hasOwn(data.fields||{},e.id)){if(e.type==='checkbox'||e.type==='radio')e.checked=!!data.fields[e.id];else e.value=data.fields[e.id];}for(const r of data.radios||[])for(const e of document.getElementsByName(r.name))e.checked=e.value===r.value;selected=data.selected||[];dentition=data.dentition||'permanent';chartAges=data.chartAges||{};missingTeeth=data.missingTeeth||[];diagnoses=Array.isArray(data.diagnoses)?data.diagnoses:[];if(!Array.isArray(data.diagnoses)&&data.fields?.diagnosis&&data.fields.diagnosis!=='Choose diagnosis'){const finding=data.fields.diagnosis==='Other'?data.fields.diagnosisOther:data.fields.diagnosis==='Retained root tip'?'Root tip':data.fields.diagnosis;if(finding)diagnoses=selected.map(tooth=>({tooth,finding}));}plannedTreatments=Array.isArray(data.plannedTreatments)?data.plannedTreatments:[];providedTreatments=Array.isArray(data.providedTreatments)?data.providedTreatments:null;if(!Object.hasOwn(data.fields||{},'flapReflected')&&data.fields?.flap&&data.fields?.reflector)$('flapReflected').checked=true;if(data.fields?.performed&&!radio('cohri-provided'))$('providedSame').checked=true;selectedFindingNames=Array.isArray(data.selectedFindingNames)?data.selectedFindingNames:($('selectAllFindings').checked?[...new Set(diagnoses.map(d=>d.finding))]:[]);if(!$('noteNV').value.trim()||$('noteNV').value==='Post-op check in 2 weeks')$('noteNV').value='POC in 2 weeks';restoreForcepsChoice(data);restoreSurgicalOptions(data);restorePrescriptionFields(data);override=data.override??null;conditional();renderPlannedTreatments();renderProvidedTreatments();renderDiagnoses();drawChart();renderClinicalNote(override??generateNote());}
$('extractionForm').addEventListener('submit',e=>e.preventDefault());
$('extractionForm').addEventListener('input',e=>{if(e.target.closest('#generatedNote'))return;changed();});
$('extractionForm').addEventListener('change',e=>{if(e.target.closest('#generatedNote'))return;changed();});
$('generatedNote').addEventListener('input',()=>{override=$('generatedNote').innerText;save();});
$('generatedNote').addEventListener('paste',e=>{e.preventDefault();const t=e.clipboardData.getData('text/plain');document.execCommand('insertText',false,t);});
$('copyNote').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('generatedNote').innerText);$('noteCopyStatus').textContent='Copied';}catch{const sel=window.getSelection(),range=document.createRange();range.selectNodeContents($('generatedNote'));sel.removeAllRanges();sel.addRange(range);$('noteCopyStatus').textContent=document.execCommand('copy')?'Copied':'Select the note and copy manually';}});
for(const b of document.querySelectorAll('[data-dentition]'))b.addEventListener('click',()=>{dentition=b.dataset.dentition;selectedFindingNames=[];$('selectAllFindings').checked=false;selected=[];chartAges={};drawChart();changed();});
$('clearAll').addEventListener('click',()=>$('clearDialog').showModal());$('cancelClear').addEventListener('click',()=>$('clearDialog').close());
function reset(){ $('extractionForm').reset();selected=[];dentition='permanent';override=null;chartAges={};missingTeeth=[];diagnoses=[];plannedTreatments=[];selectedFindingNames=[];providedTreatments=null; }
$('confirmClear').addEventListener('click',()=>{reset();$('clearDialog').close();drawChart();changed();});
try{const draft=JSON.parse(localStorage.getItem(storageKey)||'null');if(draft)apply(draft);else{conditional();drawChart();renderClinicalNote(generateNote());}}catch{conditional();drawChart();renderClinicalNote(generateNote());}

$('missingMain').addEventListener('click',()=>{for(const label of selected){missingTeeth=missingTeeth.includes(label)?missingTeeth.filter(x=>x!==label):[...missingTeeth,label];}selected=[];drawChart();changed();});
$('changeAge').addEventListener('click',()=>{
 for(let n=1;n<=32;n++){
  const visible=chartLabel(n),label=visible||String(n);
  if(!selected.includes(label))continue;
  const showPermanent=!visible||label!==String(n);
  chartAges[n]=showPermanent?'permanent':'primary';
 }
 selected=[];drawChart();changed();
});

function renderDiagnoses(){
 const container=$('diagnosisTags');container.replaceChildren();
 groupDiagnoses().forEach(group=>{
  const tag=document.createElement('span');tag.className='diagnosis-tag';
  const label=document.createElement('button');label.type='button';label.className='tooth-diagnosis-label diagnosis-tag-select';label.textContent=formatDiagnosisGroup(group);
  const active=selectedFindingNames.includes(group.finding);tag.classList.toggle('finding-tag-selected',active);label.setAttribute('aria-pressed',String(active));
  label.addEventListener('click',()=>{
   selectedFindingNames=[group.finding];
   selected=group.teeth.filter(tooth=>!missingTeeth.includes(tooth));
   $('selectAllFindings').checked=false;drawChart();changed();
  });
  const remove=document.createElement('button');remove.type='button';remove.className='diagnosis-tag-remove';remove.textContent='×';remove.setAttribute('aria-label','Remove '+label.textContent);
  remove.addEventListener('click',()=>{diagnoses=diagnoses.filter(record=>record.finding!==group.finding);changed();});
  tag.append(label,remove);container.append(tag);
 });
}
function addDiagnosis(finding){
 const teeth=selected.filter(tooth=>!missingTeeth.includes(tooth)&&Array.from({length:32},(_,i)=>chartLabel(i+1)).includes(tooth));
 if(!teeth.length){$('diagnosisStatus').textContent='Select teeth first.';return;}
 if(!finding.trim()){ $('diagnosisOther').focus();return; }
 teeth.forEach(tooth=>{if(!diagnoses.some(d=>d.tooth===tooth&&d.finding===finding.trim()))diagnoses.push({tooth,finding:finding.trim()});});
 selected=[];$('diagnosisStatus').textContent='';drawChart();changed();
}
document.querySelectorAll('[data-diagnosis]').forEach(button=>button.addEventListener('click',()=>{
 if(!selected.length){$('diagnosisStatus').textContent='Select teeth first.';return;}
 $('diagnosis').value=button.dataset.diagnosis;
 if(button.dataset.diagnosis==='Other'){changed();$('diagnosisOther').focus();}
 else addDiagnosis(button.dataset.diagnosis);
}));
$('addOtherDiagnosis').addEventListener('click',()=>addDiagnosis($('diagnosisOther').value));
$('diagnosisOther').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();addDiagnosis($('diagnosisOther').value);}});

function findingColor(finding){
 return {'Non-restorable':'#a5f3fc','Necrosis':'#f9a8d4','Root tip':'#d9f99d','Impacted tooth':'#fde68a','Wisdom tooth':'#bfdbfe'}[finding]||'#99f6e4';
}
function colorToothFindings(){
 document.querySelectorAll('.arch .tooth').forEach(tooth=>{
  const label=tooth.dataset.label,svg=tooth.querySelector('.tooth-diagram'),rectangle=tooth.querySelector('.tooth-rectangle'),number=tooth.querySelector('.tooth-number');
  svg.querySelector('.finding-gradient')?.remove();
  const colors=[...new Set(diagnoses.filter(d=>d.tooth===label).map(d=>findingColor(d.finding)))];
  const colored=colors.length&&!missingTeeth.includes(label);
  tooth.classList.toggle('has-finding-color',!!colored);
  rectangle.style.removeProperty('fill');rectangle.style.removeProperty('stroke');
  if(!colored)return;
  if(colors.length===1)rectangle.style.fill=colors[0];
  else{
   const id='tooth-finding-'+tooth.dataset.tooth;
   const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');defs.setAttribute('class','finding-gradient');
   const gradient=document.createElementNS('http://www.w3.org/2000/svg','linearGradient');gradient.id=id;
   colors.forEach((color,index)=>{for(const offset of [index/colors.length,(index+1)/colors.length]){const stop=document.createElementNS('http://www.w3.org/2000/svg','stop');stop.setAttribute('offset',String(offset));stop.setAttribute('stop-color',color);gradient.append(stop);}});
   defs.append(gradient);svg.prepend(defs);rectangle.style.fill='url(#'+id+')';
  }
  rectangle.style.stroke=selected.includes(label)?'#facc15':colors[0];
 });
}

function groupDiagnoses(){
 const groups=new Map();
 diagnoses.forEach(({tooth,finding})=>{
  if(!groups.has(finding))groups.set(finding,{finding,teeth:[]});
  const teeth=groups.get(finding).teeth;if(!teeth.includes(tooth))teeth.push(tooth);
 });
 return [...groups.values()].map(group=>({...group,teeth:group.teeth.sort((a,b)=>String(a).localeCompare(String(b),'en',{numeric:true}))}));
}
function formatDiagnosisGroup(group){
 const finding=group.teeth.length>1?({'Impacted tooth':'Impacted teeth','Wisdom tooth':'Wisdom teeth','Root tip':'Root tips'}[group.finding]||group.finding):group.finding;
 return '#'+group.teeth.join(', ')+': '+finding;
}


function groupPlannedTreatments(records=plannedTreatments){
 const groups=new Map();
 records.forEach(({tooth,treatment})=>{
  const quadrant=treatment==='Alveoloplasty 1-3 teeth'?toothQuadrant(tooth):null;
  const key=quadrant?treatment+'|'+quadrant:treatment;
  if(!groups.has(key))groups.set(key,{treatment,quadrant,teeth:[]});
  const teeth=groups.get(key).teeth;if(!teeth.includes(tooth))teeth.push(tooth);
 });
 return [...groups.values()].map(group=>({...group,teeth:group.teeth.sort((a,b)=>String(a).localeCompare(String(b),'en',{numeric:true}))}));
}
function toothQuadrant(label){
 const number=/^\d+$/.test(String(label))?Number(label):Number(Object.keys(primary).find(n=>primary[n]===label));
 if(number>=1&&number<=8)return 'UR';
 if(number>=9&&number<=16)return 'UL';
 if(number>=25&&number<=32)return 'LR';
 if(number>=17&&number<=24)return 'LL';
 return null;
}
function formatPlannedTreatment(group){
 if(group.treatment==='Alveoloplasty +4 teeth'){
  const quadrants=['UR','UL','LR','LL'].filter(quad=>group.teeth.some(tooth=>toothQuadrant(tooth)===quad));
  return quadrants.join(', ')+': '+group.treatment;
 }
 return '#'+group.teeth.join(', ')+': '+group.treatment;
}
function renderPlannedTreatments(){
 const container=$('plannedTreatmentTags');container.replaceChildren();
 groupPlannedTreatments().forEach(group=>{
  const tag=document.createElement('span');tag.className='diagnosis-tag';
  const label=document.createElement('span');label.className='tooth-diagnosis-label';label.textContent=formatPlannedTreatment(group);
  const remove=document.createElement('button');remove.type='button';remove.className='diagnosis-tag-remove';remove.textContent='×';remove.setAttribute('aria-label','Remove '+label.textContent);
  remove.addEventListener('click',()=>{plannedTreatments=plannedTreatments.filter(record=>record.treatment!==group.treatment||!group.teeth.includes(record.tooth));changed();});
  tag.append(label,remove);container.append(tag);
 });
}
function addPlannedTreatment(treatment){
 ensureProvidedTreatments();
 const provided=radio('cohri-provided')==='change';
 let records=provided?providedTreatments:plannedTreatments;
 const visible=Array.from({length:32},(_,i)=>chartLabel(i+1));
 const allFindings=$('selectAllFindings').checked;
 const tagSelection=allFindings||selectedFindingNames.length>0;
 const targets=tagSelection?[...new Set(diagnoses.filter(record=>allFindings||selectedFindingNames.includes(record.finding)).map(record=>record.tooth))]:selected;
 const teeth=targets.filter(tooth=>(tagSelection||visible.includes(tooth))&&!missingTeeth.includes(tooth));
 if(!teeth.length){$('plannedTreatmentStatus').textContent='Select teeth first.';return;}
 teeth.forEach(tooth=>{
  if(treatment==='Simple extraction'||treatment==='Surgical extraction')records=records.filter(record=>record.tooth!==tooth||!['Simple extraction','Surgical extraction'].includes(record.treatment));
  if(!records.some(record=>record.tooth===tooth&&record.treatment===treatment))records.push({tooth,treatment});
 });
 if(provided)providedTreatments=records;else plannedTreatments=records;
 selected=[];selectedFindingNames=[];$('selectAllFindings').checked=false;$('plannedTreatmentStatus').textContent='';drawChart();changed();
}
document.querySelectorAll('[data-planned-treatment]').forEach(button=>button.addEventListener('click',()=>addPlannedTreatment(button.dataset.plannedTreatment)));

$('selectAllFindings').addEventListener('change',()=>{
 selectedFindingNames=$('selectAllFindings').checked?[...new Set(diagnoses.map(record=>record.finding))]:[];
 selected=$('selectAllFindings').checked?[...new Set(diagnoses.map(record=>record.tooth))].filter(tooth=>!missingTeeth.includes(tooth)):[];
 drawChart();
});

function treatmentMarksForTooth(label){
 const treatments=plannedTreatments.filter(record=>record.tooth===label).map(record=>record.treatment);
 return {
  extraction:treatments.some(t=>t==='Simple extraction'||t==='Surgical extraction'),
  alveoloplasty:treatments.some(t=>t==='Alveoloplasty 1-3 teeth'||t==='Alveoloplasty +4 teeth')
 };
}
function renderTreatmentMarks(){
 document.querySelectorAll('.arch .tooth').forEach(tooth=>{
  const marks=treatmentMarksForTooth(tooth.dataset.label);
  const present=!missingTeeth.includes(tooth.dataset.label);
  tooth.classList.toggle('has-planned-extraction',present&&marks.extraction);
  tooth.classList.toggle('has-planned-alveoloplasty',present&&marks.alveoloplasty);
 });
 renderAlveoloplastyLines();
}

function quadrantTeeth(quadrant){
 const ranges={UR:[1,8],UL:[9,16],LR:[25,32],LL:[17,24]};
 const [start,end]=ranges[quadrant];
 return Array.from({length:end-start+1},(_,i)=>chartLabel(start+i)).filter(label=>label&&!missingTeeth.includes(label));
}
function syncQuadrantCheckboxes(){
 document.querySelectorAll('[data-quadrant]').forEach(box=>{
  const teeth=quadrantTeeth(box.dataset.quadrant);
  const count=teeth.filter(tooth=>selected.includes(tooth)).length;
  box.checked=teeth.length>0&&count===teeth.length;
  box.indeterminate=count>0&&count<teeth.length;
  box.disabled=!teeth.length;
 });
}
document.querySelectorAll('[data-quadrant]').forEach(box=>box.addEventListener('change',()=>{
 const teeth=quadrantTeeth(box.dataset.quadrant);
 selectedFindingNames=[];$('selectAllFindings').checked=false;
 selected=box.checked?[...new Set([...selected,...teeth])]:selected.filter(tooth=>!teeth.includes(tooth));
 drawChart();
}));

function alveoloplastyRuns(teeth){
 const runs=[];let run=[];
 teeth.forEach(tooth=>{
  if(!tooth.hidden&&tooth.classList.contains('has-planned-alveoloplasty'))run.push(tooth);
  else if(run.length){runs.push(run);run=[];}
 });
 if(run.length)runs.push(run);
 return runs;
}
function renderAlveoloplastyLines(){
 document.querySelectorAll('.arch').forEach(arch=>{
  arch.querySelector('.alveoloplasty-overlay')?.remove();
  const runs=alveoloplastyRuns([...arch.querySelectorAll(':scope > .tooth')]);
  if(!runs.length)return;
  const bounds=arch.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
  const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');
  overlay.setAttribute('class','alveoloplasty-overlay');overlay.setAttribute('aria-hidden','true');overlay.setAttribute('viewBox','0 0 '+bounds.width+' '+bounds.height);
  runs.forEach(run=>{
   const first=run[0].querySelector('.tooth-diagram').getBoundingClientRect();
   const last=run[run.length-1].querySelector('.tooth-diagram').getBoundingClientRect();
   const y=first.top-bounds.top+first.height*190/205;
   const line=document.createElementNS('http://www.w3.org/2000/svg','line');
   line.setAttribute('x1',String(first.left-bounds.left+first.width*18/120));
   line.setAttribute('x2',String(last.left-bounds.left+last.width*102/120));
   line.setAttribute('y1',String(y));line.setAttribute('y2',String(y));overlay.append(line);
  });
  arch.append(overlay);
 });
}
window.addEventListener('resize',()=>requestAnimationFrame(renderAlveoloplastyLines));
requestAnimationFrame(renderAlveoloplastyLines);

function ensureProvidedTreatments(){
 if(radio('cohri-provided')==='change'&&providedTreatments===null)providedTreatments=plannedTreatments.map(record=>({...record}));
}
function currentProvidedTreatments(){
 const mode=radio('cohri-provided');
 return mode==='same-as-planned'?plannedTreatments:mode==='change'?(providedTreatments||[]):[];
}
function renderProvidedTreatments(){
 const container=$('providedTreatmentTags');container.replaceChildren();
 if(radio('cohri-provided')!=='change')return;
 groupPlannedTreatments(providedTreatments||[]).forEach(group=>{
  const tag=document.createElement('span');tag.className='diagnosis-tag';
  const choose=document.createElement('button');choose.type='button';choose.className='diagnosis-tag-select';choose.textContent=formatPlannedTreatment(group);
  choose.setAttribute('aria-pressed',String(group.teeth.every(tooth=>selected.includes(tooth))));
  choose.addEventListener('click',()=>{selected=[...group.teeth];selectedFindingNames=[];$('selectAllFindings').checked=false;drawChart();changed();});
  const remove=document.createElement('button');remove.type='button';remove.className='diagnosis-tag-remove';remove.textContent='×';remove.setAttribute('aria-label','Remove '+choose.textContent);
  remove.addEventListener('click',()=>{providedTreatments=(providedTreatments||[]).filter(record=>record.treatment!==group.treatment||!group.teeth.includes(record.tooth));changed();});
  tag.append(choose,remove);container.append(tag);
 });
}

function generateAnesthesiaParagraph(){
 const v=id=>$(id).value.trim(),c=id=>$(id).checked;
 const sentences=[];
 const quantity=id=>{const value=v(id);return value?(value+' '+(Number(value)===1?'carpule':'carpules')):'[Quantity needed] carpules';};
 if(c('topicalBenzocaine'))sentences.push('Topical benzocaine around the tooth and '+(c('nerveBlock')?'block injection':'injection')+' locations.');
 if(c('nerveBlock')){
  const locations=[];
  for(const [side,short] of [['Right','R'],['Left','L']])if(c('nerve'+side)){
   ['PSA block','MSA block','ASA block','Palatal block','IAN block','Buccal block','Mental block'].forEach((block,index)=>{if(c('nerve'+side+index))locations.push('('+short+') '+block);});
  }
  sentences.push(quantity('nerveCarpules')+' of '+$('nerveLA').selectedOptions[0].textContent+' was administered via '+(locations.join(', ')||'[Block location needed]')+'.');
 }
 if(c('localInfiltration'))sentences.push((c('nerveBlock')?'Then local infiltration':'Local infiltration')+' with '+quantity('infiltrationCarpules')+' of '+$('infiltrationLA').selectedOptions[0].textContent+' was administered around the tooth.');
 return sentences.join(' ');
}
function renderClinicalNote(text){
 const note=$('generatedNote');note.replaceChildren();
 const titles=['Appointment for:','Vitals:','Update MHX and DHX:','Update medication:','Pre-medication:','DX:','Planned treatment:','TX rendered:','- Inhaled NO:','- Anesthesia:','- Extraction:','Post-operative care:','Post-op Rx:','NV:','Student Dr:','Assistant:','Preceptor:','Clinic:'];
 String(text).split('\n').forEach((line,index)=>{
  if(index)note.append(document.createTextNode('\n'));
  const title=titles.find(prefix=>line.startsWith(prefix));
  if(title){
   const strong=document.createElement('strong');strong.textContent=title;
   note.append(strong,document.createTextNode(line.slice(title.length)));
  }else note.append(document.createTextNode(line));
 });
}

function updateForcepsFields(){
 const selectedForceps=[];
 ['#150','#151','#23 Cowhorn'].forEach((label,index)=>{if($('forcepsChoice'+index).checked)selectedForceps.push(label);});
 const others=$('forcepsChoice3').checked;
 $('forcepsOtherDetails').hidden=!others;
 const extra=[];
 ['#150S','#151S','#3 MEAD','#1107','#18R','#18L'].forEach((label,index)=>{if($('forcepsExtra'+index).checked)extra.push(label);});
 $('forcepsOther').value=extra.join(', ');
 if(others)selectedForceps.push(...extra);
 $('forceps').value=selectedForceps.join(', ');
}
function restoreForcepsChoice(data){
 const saved=data.fields||{};
 const legacyRadio=(data.radios||[]).find(record=>record.name==='forceps-choice');
 if(legacyRadio)['#150','#151','#23 Cowhorn','Others'].forEach((value,index)=>{$('forcepsChoice'+index).checked=legacyRadio.value===value;});
 if(!['forcepsChoice0','forcepsChoice1','forcepsChoice2','forcepsChoice3'].some(id=>Object.hasOwn(saved,id))&&!legacyRadio){
  const previous=saved.forceps==='Cowhorn forceps'?'#23 Cowhorn':saved.forceps;
  ['#150','#151','#23 Cowhorn'].forEach((value,index)=>{if(previous===value)$('forcepsChoice'+index).checked=true;});
  if(['#150S','#151S','#3 MEAD','#1107','#18R','#18L'].includes(previous))$('forcepsChoice3').checked=true;
 }
 if(!Object.keys(saved).some(id=>/^forcepsExtra\d$/.test(id))){
  const previous=saved.forcepsOther||saved.forceps;
  ['#150S','#151S','#3 MEAD','#1107','#18R','#18L'].forEach((value,index)=>{if(previous===value)$('forcepsExtra'+index).checked=true;});
 }
}

function updateSurgicalOptions(){
 const burUsed=radio('surgical-bur')==='yes',sutureUsed=radio('suture-used')==='yes';
 $('burDetails').hidden=!burUsed;
 if(!['701','702'].includes($('bur').value))$('bur').value='701';
 $('sutureTypeDetails').hidden=!sutureUsed;
 $('suture').value=radio('suture-used')==='no'?'None':sutureUsed?($('sutureType').value==='4-0 PTFE'?'Non-resorbable':'Resorbable'):'';
}
function restoreSurgicalOptions(data){
 const saved=data.fields||{};
 if(!Object.hasOwn(saved,'surgicalBurYes')&&!(data.radios||[]).some(r=>r.name==='surgical-bur')){
  if(saved.bur||saved.sectioned)$('surgicalBurYes').checked=true;
 }
 if(!Object.hasOwn(saved,'sutureUsedYes')&&!(data.radios||[]).some(r=>r.name==='suture-used')){
  if(saved.suture==='None')$('sutureUsedNo').checked=true;
  else if(['Resorbable','Non-resorbable'].includes(saved.suture)){
   $('sutureUsedYes').checked=true;
   if(saved.suture==='Non-resorbable')$('sutureType').value='4-0 PTFE';
  }
 }
}

function generateExtractionParts(){
 const v=id=>$(id).value.trim(),c=id=>$(id).checked;
 const hasExtraction=currentProvidedTreatments().some(record=>['Simple extraction','Surgical extraction'].includes(record.treatment));
 if(!hasExtraction&&!c('flap')&&!c('flapReflected')&&!v('forceps')&&radio('surgical-bur')!=='yes'&&radio('cryer-elevators')!=='yes'&&!radio('suture-used'))return [];
 const parts=[];
 const sentence=text=>{if(parts.length)parts.push({text:' '});parts.push({text});};
 if(c('flap'))sentence(v('blade')+' blade was used to create a flap.');
 if(c('flapReflected'))sentence('The flap was reflected with Molt 2 and 9.');
 sentence('Small and large elevators were used to luxate the tooth.');
 if(v('forceps')){
  if(parts.length)parts.push({text:' '});
  parts.push({text:v('forceps')+' forceps'},{text:' were used to extract teeth.'});
 }
 if(radio('surgical-bur')==='yes')sentence('The tooth was sectioned with '+v('bur')+' surgical bur and removed in parts.');
 if(radio('cryer-elevators')==='yes')sentence('Cryer elevators were utilized to remove root tips and fractured tooth.');
 sentence('The tooth and socket were checked to ensure no remaining root tips.');
 sentence('Socket compressed using gauze with finger pressure.');
 if(radio('suture-used')==='no'){
  parts.push({text:' '},{text:'No suture'},{text:' was used to close sockets.'});
 }else if(radio('suture-used')==='yes'){
  parts.push({text:' '},{text:v('sutureType')+' sutures'},{text:' were used to close sockets.'});
 }
 return parts;
}

function generatePostoperativeCare(){
 const instructions=$('postop').checked,painRelief=$('painReliefProvided').checked;
 const sentences=[];
 if(instructions&&painRelief)sentences.push('The patient was provided with post-op instructions and pain relief regime (Ibuprofen and Tylenol every 4-6 hours if needed).');
 else if(instructions)sentences.push('The patient was provided with post-op instructions.');
 else if(painRelief)sentences.push('The patient was provided with pain relief regime (Ibuprofen and Tylenol every 4-6 hours if needed).');
 if(radio('suture-used')==='yes'&&['3-0 Chromic gut','4-0 Chromic gut'].includes($('sutureType').value))sentences.push('The patient was also informed that suture will dissolve on its own within 2 weeks.');
 return sentences.join(' ');
}

function selectedPrescriptions(){
 if(!$('rxEnabled').checked)return [];
 const prescriptions=[];
 if($('rxAmoxicillin').checked)prescriptions.push('Amoxicillin 500 mg TID in 7 days.');
 if($('rxCHX').checked)prescriptions.push('0.12% CHX 15 mg mouth rise BID in 7 days.');
 if($('rxOthers').checked&&$('rxOtherText').value.trim())prescriptions.push($('rxOtherText').value.trim());
 return prescriptions;
}
function updatePrescriptionFields(){
 $('rxOptions').hidden=!$('rxEnabled').checked;
 $('rxOtherText').hidden=!$('rxOthers').checked;
 $('rx').value=selectedPrescriptions().join(' ');
}
function restorePrescriptionFields(data){
 if(!Object.hasOwn(data.fields||{},'rxEnabled')&&data.fields?.rx?.trim()){
  $('rxEnabled').checked=true;$('rxOthers').checked=true;$('rxOtherText').value=data.fields.rx;
 }
}

// Fit the shared Note control line using the Composite layout.
function fitNoteHeader(){
 const row=document.querySelector('.note-fields-row'),panel=row?.closest('.note-panel');
 if(!row||!panel)return;
 row.style.zoom='1';
 const style=getComputedStyle(panel);
 const available=panel.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
 const natural=Math.max(row.offsetWidth,row.scrollWidth);
 row.style.zoom=String(Math.min(1,Math.max(0,available-2)/(natural||1)));
}
const noteHeader=document.querySelector('.note-fields-row');
if(noteHeader){
 let frame;
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=null;fitNoteHeader();});};
 new ResizeObserver(schedule).observe(noteHeader.closest('.note-panel'));
 new MutationObserver(schedule).observe(noteHeader,{subtree:true,attributes:true,attributeFilter:['hidden']});
 window.addEventListener('resize',schedule);
 if(document.fonts)document.fonts.ready.then(schedule);
 schedule();
}
