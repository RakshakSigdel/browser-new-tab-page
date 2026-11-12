const fs=require('fs');
let html=fs.readFileSync('index.html','utf8');
html=html.replace('<script defer src="app.js">','<script defer src="vendor/nepali-date-converter.js"></script><script defer src="app.js">');
html=html.replace('<div class="weekdays">','<div class="calendar-controls"><select id="calendar-mode" aria-label="Calendar type"><option value="bs">नेपाली · BS</option><option value="ad">English · AD</option></select><span id="calendar-subtitle"></span></div><div class="weekdays" id="weekdays">');
html=html.replace('<p class="hint">Site icons load automatically.</p>','<label>Position <input id="position" type="number" min="1" step="1" required></label><p class="hint">1 is first. You can also drag shortcuts to rearrange them.</p>');
fs.writeFileSync('index.html',html);
let js=fs.readFileSync('app.js','utf8');
js=js.replace('return card}\nfunction render()', 'setupReorder(card,a,i,kind);return card}\nfunction render()');
js=js.replace("$('error').textContent='';$('editor').showModal();", "$('position').max=list.length+(i<0?1:0);$('position').value=i<0?list.length+1:i+1;$('error').textContent='';$('editor').showModal();");
js=js.replace("if(selected<0)next.push(entry);else next[selected]=entry;if(!saveLinks(next))return;if(selected<0&&group==='main')page=Math.floor((next.length-1)/6);", "const position=Number($('position').value)-1;if(selected>=0)next.splice(selected,1);next.splice(position,0,entry);if(!saveLinks(next))return;if(group==='main')page=Math.floor(position/6);");
const calendarStart=js.indexOf('let calendarDate=new Date();');const calendarEnd=js.indexOf('function tick()',calendarStart);
js=js.slice(0,calendarStart)+`function nepalToday(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kathmandu',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());const get=t=>Number(parts.find(p=>p.type===t).value);return new Date(get('year'),get('month')-1,get('day'),12)}
let calendarMode=read('dashboard-calendar-mode','bs');if(!['ad','bs'].includes(calendarMode))calendarMode='bs';$('calendar-mode').value=calendarMode;
let calendarDate=nepalToday(),lastDay='';
function monthStart(date){if(calendarMode==='bs'){const n=new NepaliDate(date);return new NepaliDate(n.getYear(),n.getMonth(),1).toJsDate()}return new Date(date.getFullYear(),date.getMonth(),1)}
calendarDate=monthStart(calendarDate);
function renderCalendar(){
 const now=nepalToday(),bs=calendarMode==='bs',month=bs?new NepaliDate(calendarDate).getMonth():calendarDate.getMonth();
 $('month').textContent=bs?new NepaliDate(calendarDate).format('MMMM YYYY','np'):calendarDate.toLocaleDateString('en-US',{month:'long',year:'numeric'});
 $('calendar-subtitle').textContent=bs?calendarDate.toLocaleDateString('en-US',{month:'short',year:'numeric'}):'Gregorian';
 const labels=bs?['आइत','सोम','मङ्गल','बुध','बिहि','शुक्र','शनि']:['S','M','T','W','T','F','S'];$('weekdays').replaceChildren(...labels.map(t=>{const s=document.createElement('span');s.textContent=t;return s}));
 const start=new Date(calendarDate);start.setDate(1);start.setTime(calendarDate.getTime());start.setDate(start.getDate()-start.getDay());const cells=[];
 for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);let n;try{n=bs?new NepaliDate(d):null}catch{}const value=bs?n?.getDate():d.getDate();const currentMonth=bs?n?.getMonth():d.getMonth();const el=document.createElement('span');el.className='day'+(currentMonth!==month?' outside':'')+(d.toDateString()===now.toDateString()?' today':'');el.textContent=value===undefined?'':bs?String(value).replace(/\\d/g,x=>'०१२३४५६७८९'[Number(x)]):value;el.title=d.toDateString();el.setAttribute('aria-label',(n?n.format('D MMMM YYYY')+' BS / ':'')+d.toDateString());if(d.toDateString()===now.toDateString())el.setAttribute('aria-current','date');cells.push(el)}
 $('calendar-grid').replaceChildren(...cells);$('calendar-today').textContent=bs?'आज':'Today';
 $('month-prev').disabled=bs&&new NepaliDate(calendarDate).getYear()<=2000&&month===0;$('month-next').disabled=bs&&new NepaliDate(calendarDate).getYear()>=2090&&month===11;
}
function changeMonth(delta){try{if(calendarMode==='bs'){const n=new NepaliDate(calendarDate);calendarDate=new NepaliDate(n.getYear(),n.getMonth()+delta,1).toJsDate()}else calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+delta,1);renderCalendar()}catch{notify('This date is outside the supported calendar range.')}}
$('month-prev').onclick=()=>changeMonth(-1);$('month-next').onclick=()=>changeMonth(1);$('calendar-today').onclick=()=>{calendarDate=monthStart(nepalToday());renderCalendar()};$('calendar-mode').onchange=()=>{calendarMode=$('calendar-mode').value;write('dashboard-calendar-mode',calendarMode);calendarDate=monthStart(nepalToday());renderCalendar()};
`+js.slice(calendarEnd);
js=js.replace("if(lastDay!==now.toDateString()){lastDay=now.toDateString();", "if(lastDay!==nepalToday().toDateString()){lastDay=nepalToday().toDateString();");
js=js.replace("let theme=read('dashboard-theme',0);", "if(!read('dashboard-dark-default',false)){if(write('dashboard-theme',0))write('dashboard-dark-default',true)}let theme=read('dashboard-theme',0);");
js=js.replace("const engine=read('dashboard-engine','brave');", "if(!read('dashboard-google-default',false)){if(write('dashboard-engine','google'))write('dashboard-google-default',true)}const engine=read('dashboard-engine','google');");
js=js.replace("?engine:'brave'", "?engine:'google'");
// Function declarations are hoisted; dragging starts only after initialization.
js+=`\nlet dragging=null;
function moveShortcut(kind,from,to){const list=kind==='main'?shortcuts:quickLinks;if(from===to||from<0||to<0||from>=list.length||to>=list.length)return;const next=list.slice();const [moved]=next.splice(from,1);next.splice(to,0,moved);if(!write(kind==='main'?'void-shortcuts':'dashboard-quick-links',next))return;if(kind==='main'){shortcuts=next;page=Math.floor(to/6)}else quickLinks=next;render();notify('Shortcut order saved.');}
function setupReorder(card,anchor,index,kind){card.draggable=true;anchor.draggable=false;card.title='Drag to reorder · Alt + arrow keys to move';card.dataset.index=index;card.dataset.group=kind;
 card.addEventListener('dragstart',e=>{dragging={index,kind};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(index));card.classList.add('dragging')});
 card.addEventListener('dragend',()=>{dragging=null;document.querySelectorAll('.dragging,.drop-target').forEach(el=>el.classList.remove('dragging','drop-target'))});
 card.addEventListener('dragover',e=>{if(dragging?.kind===kind){e.preventDefault();e.dataTransfer.dropEffect='move';card.classList.add('drop-target')}});
 card.addEventListener('dragleave',()=>card.classList.remove('drop-target'));
 card.addEventListener('drop',e=>{e.preventDefault();if(dragging?.kind===kind){const source=dragging;dragging=null;moveShortcut(kind,source.index,index)}});
 anchor.addEventListener('keydown',e=>{if(e.altKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const to=index+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1);moveShortcut(kind,index,to);document.querySelector('[data-group="'+kind+'"][data-index="'+to+'"] a')?.focus()}});
}
`;
fs.writeFileSync('app.js',js);
const pkg=JSON.parse(fs.readFileSync('package.json'));pkg.name='rakshak-dashboard';pkg.version='2.1.0';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
