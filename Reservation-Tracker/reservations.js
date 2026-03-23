// ─── LANGUAGE STATE ───────────────────────────────────────────────────────────
const LANG_KEY='res_lang_v1';
function detectLang(){
  const s=localStorage.getItem(LANG_KEY);
  if(s==='it'||s==='en') return s;
  return (navigator.language||'en').toLowerCase().startsWith('it')?'it':'en';
}
let lang=detectLang();
const s=()=>STRINGS[lang]; // shortcut
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

function setLang(l){lang=l;localStorage.setItem(LANG_KEY,l);applyLang();render();}

function applyLang(){
  document.body.classList.toggle('ios-pickers',isIOS());
  document.documentElement.lang=lang;
  document.title=s().appTitle;
  setText('appTitle',s().appTitle);
  setText('btn-day',s().day);
  setText('btn-week',s().week);
  setText('btn-month',s().month);
  setText('shareMainBtn',s().share);
  setText('lName',s().lName); setText('lDate',s().lDate); setText('lTime',s().lTime);
  setText('lPax',s().lPax); setText('lTable',s().lTable); setText('lPhone',s().lPhone); setText('lNote',s().lNote);
  setAttr('fName','placeholder',s().namePh); setAttr('fTable','placeholder',s().tablePh);
  setAttr('fPhone','placeholder',s().phonePh); setAttr('fNote','placeholder',s().notePh);
  setText('btnCancel',s().cancel);
  setAttr('feedbackBtn','ariaLabel',s().feedback); setAttr('feedbackBtn','title',s().feedback);
  setAttr('storeBtn','ariaLabel',s().store); setAttr('storeBtn','title',s().store);
  setText('shareCloseBtn',s().close); setText('shareTitle',s().shareTitle);
  setText('deleteTitle',s().deleteTitle); setText('deletePrompt',s().deletePrompt);
  setText('deleteCancelBtn',s().keepRes); setText('deleteConfirmBtn',s().delWord);
  document.getElementById('langEN').classList.toggle('active',lang==='en');
  document.getElementById('langIT').classList.toggle('active',lang==='it');
  refreshModalTitle();
  refreshSaveBtn();
  refreshPickerDisplays();
}
function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v;}
function setAttr(id,attr,v){const el=document.getElementById(id);if(el)el[attr]=v;}
function refreshModalTitle(){
  document.getElementById('modalTitle').innerHTML=
    editingId?`${s().editRes} <em>${s().resWord}</em>`:`${s().newRes} <em>${s().resWord}</em>`;
}
function refreshSaveBtn(){
  document.getElementById('btnSave').textContent=editingId?s().update:s().save;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const SK='restaurant_reservations_v1';
const BACKUP_SK='restaurant_reservations_backup_v1';
const DB_NAME='reservation_tracker_db';
const DB_VERSION=1;
const STORE_NAME='app_state';
const RES_KEY='reservations';
let reservations=[];
let dbPromise=null;
let currentView='day', selectedDate=todayStr(), editingId=null, deleteId=null;
function save(){return persistReservations(reservations);}
function todayStr(){const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function pad(n){return String(n).padStart(2,'0');}
function genId(){return Date.now().toString(36)+Math.random().toString(36).slice(2);}
function esc(v){const d=document.createElement('div');d.textContent=v;return d.innerHTML;}
function normalizeReservations(list){
  if(!Array.isArray(list)) return [];
  return list.filter(r=>r&&typeof r==='object').map(r=>({
    id:String(r.id||genId()),
    name:String(r.name||''),
    date:String(r.date||todayStr()),
    time:String(r.time||'19:30'),
    pax:Math.max(1,parseInt(r.pax,10)||1),
    table:r.table?String(r.table):'',
    phone:r.phone?String(r.phone):'',
    note:r.note?String(r.note):'',
  }));
}
function readLocalReservations(key){
  try{return normalizeReservations(JSON.parse(localStorage.getItem(key)||'[]'));}
  catch(_err){return [];}
}
function writeBackupReservations(list){
  try{localStorage.setItem(BACKUP_SK,JSON.stringify(list));}catch(_err){}
}
function openDb(){
  if(!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
  if(dbPromise) return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME,{keyPath:'key'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('IndexedDB open failed'));
  });
  return dbPromise;
}
function idbGetReservations(){
  return openDb().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_NAME,'readonly');
    const req=tx.objectStore(STORE_NAME).get(RES_KEY);
    req.onsuccess=()=>resolve(req.result?normalizeReservations(req.result.value):null);
    req.onerror=()=>reject(req.error||new Error('IndexedDB read failed'));
  }));
}
function idbSetReservations(list){
  writeBackupReservations(list);
  return openDb().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_NAME,'readwrite');
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||new Error('IndexedDB write failed'));
    tx.objectStore(STORE_NAME).put({key:RES_KEY,value:list,updatedAt:Date.now()});
  }));
}
async function loadReservations(){
  try{
    const stored=await idbGetReservations();
    if(stored) return stored;
    const legacy=readLocalReservations(SK);
    if(legacy.length) await idbSetReservations(legacy);
    else writeBackupReservations(legacy);
    return legacy;
  }catch(err){
    console.error('Reservation storage load failed',err);
    const fallback=readLocalReservations(SK);
    if(fallback.length) writeBackupReservations(fallback);
    return fallback.length?fallback:readLocalReservations(BACKUP_SK);
  }
}
async function persistReservations(list){
  const next=normalizeReservations(list);
  try{
    await idbSetReservations(next);
  }catch(err){
    console.error('Reservation storage save failed',err);
    writeBackupReservations(next);
    throw err;
  }
}
function openPicker(e,id){
  const input=document.getElementById(id);
  if(!input||e.target===input)return;
  e.preventDefault();
  if(typeof input.showPicker==='function'){
    try{input.showPicker();return;}catch(_err){}
  }
  input.focus();
  input.click();
}
function refreshPickerDisplays(){
  const date=document.getElementById('fDate')?.value||'';
  const time=document.getElementById('fTime')?.value||'';
  setText('fDateDisplay',date);
  setText('fTimeDisplay',time);
}
function openFeedbackPanel(){
  if(typeof window.openFeedbackWidget==='function') window.openFeedbackWidget();
}
function goToStore(){window.location.href='../index.html';}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function render(){renderStats();if(currentView==='day')renderDay();else if(currentView==='week')renderWeek();else renderMonth();}

function renderStats(){
  const today=todayStr(), now=new Date();
  const ws=new Date(now); ws.setDate(now.getDate()-(now.getDay()===0?6:now.getDay()-1));
  const we=new Date(ws); we.setDate(ws.getDate()+6);
  const todayR=reservations.filter(r=>r.date===today);
  const selR=reservations.filter(r=>r.date===selectedDate);
  const weekR=reservations.filter(r=>{const[y,m,d]=r.date.split('-').map(Number);const dt=new Date(y,m-1,d);return dt>=ws&&dt<=we;});
  const monR=reservations.filter(r=>r.date.slice(0,7)===today.slice(0,7));
  const pills=[
    {num:todayR.length,lbl:s().statToday,pax:todayR.reduce((a,r)=>a+r.pax,0),hi:true},
    {num:selR.length,  lbl:s().statSel,  pax:selR.reduce((a,r)=>a+r.pax,0)},
    {num:weekR.length, lbl:s().statWeek, pax:weekR.reduce((a,r)=>a+r.pax,0)},
    {num:monR.length,  lbl:s().statMonth,pax:monR.reduce((a,r)=>a+r.pax,0)},
  ];
  document.getElementById('statBar').innerHTML=pills.map(p=>`
    <div class="stat-pill${p.hi?' hi':''}">
      <div class="num">${p.num}</div>
      <div class="lbl">${p.lbl}</div>
      <div class="lbl" style="color:var(--rust);margin-top:1px">👥 ${p.pax}</div>
    </div>`).join('');
}

function resCard(r,now,today){
  const isPast=r.date<today||(r.date===today&&r.time<`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  const[h,mn]=r.time.split(':').map(Number);
  const phoneTxt=r.phone?` · ${r.phone}`:'';
  const noteTxt=r.note?` · ${r.note}`:'';
  const metaTxt=(phoneTxt+noteTxt).replace(/^ · /,'');
  return `<div class="res-card${isPast?' past':''}" id="card-${r.id}" onclick="toggleCard(event,'${r.id}')">
    <div class="res-main">
      <div class="res-time">${s().timeHTML(h,pad(mn))}</div>
      <div class="res-divider"></div>
      ${r.table?`<div class="res-table">${r.table}<small>${s().tableWord}</small></div><div class="res-divider"></div>`:''}
      <div class="res-pax">${r.pax}<small>${s().paxWord}</small></div>
      <div class="res-divider"></div>
      <div class="res-info">
        <div class="res-name">${esc(r.name)}</div>
        ${metaTxt?`<div class="res-meta">${metaTxt}</div>`:''}
      </div>
    </div>
    <div class="res-actions">
      <button class="act-btn edit" onclick="editRes('${r.id}')">✏️ ${s().editRes}</button>
      <button class="act-btn del" onclick="delRes(event,'${r.id}')">🗑 ${s().delWord}</button>
    </div>
  </div>`;
}

function renderDay(){
  const today=todayStr();
  const res=reservations.filter(r=>r.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time));
  let h=`<div class="date-nav">
    <button class="nav-arrow" onclick="moveDay(-1)">&#8592;</button>
    <div class="date-label">${s().fmtDate(selectedDate)}</div>
    <button class="nav-arrow" onclick="moveDay(1)">&#8594;</button>
    ${selectedDate!==today?`<button class="today-btn" onclick="goToday()">${s().today}</button>`:''}
  </div>`;
  if(!res.length){h+=`<div class="empty"><div class="icon">🍽️</div><p>${s().noRes}</p></div>`;}
  else{
    const groups={},now=new Date();
    res.forEach(r=>{const[hr]=r.time.split(':').map(Number);const lbl=hr<15?s().lunch:s().dinner;(groups[lbl]=groups[lbl]||[]).push(r);});
    Object.entries(groups).forEach(([grp,list])=>{
      const total=list.reduce((a,r)=>a+r.pax,0);
      h+=`<div class="section-header">${grp} · ${list.length} · 👥 ${total}</div>`;
      list.forEach(r=>{h+=resCard(r,now,today);});
    });
  }
  document.getElementById('mainArea').innerHTML=h;
}

function getWeekDays(from){
  const[y,m,d]=from.split('-').map(Number);
  const dt=new Date(y,m-1,d);const dow=dt.getDay();
  const mon=new Date(dt);mon.setDate(d-(dow===0?6:dow-1));
  return Array.from({length:7},(_,i)=>{const t=new Date(mon);t.setDate(mon.getDate()+i);return `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())}`;});
}

function renderWeek(){
  const today=todayStr();
  const days=getWeekDays(selectedDate);
  const NAMES=s().weekDays;
  let h=`<div class="date-nav">
    <button class="nav-arrow" onclick="moveWeek(-1)">&#8592;</button>
    <div class="date-label">${s().weekOf} ${s().fmtWeekLabel(days[0])}</div>
    <button class="nav-arrow" onclick="moveWeek(1)">&#8594;</button>
    ${!days.includes(today)?`<button class="today-btn" onclick="goToday()">${s().today}</button>`:''}
  </div><div class="week-grid">`;
  days.forEach((ds,i)=>{
    const dr=reservations.filter(r=>r.date===ds);
    const pax=dr.reduce((a,r)=>a+r.pax,0);
    const isT=ds===today,isS=ds===selectedDate;
    h+=`<div class="week-day${isT?' today':''}${isS?' selected':''}" onclick="selectDay('${ds}')">
      <div class="wd-name">${NAMES[i]}</div>
      <div class="wd-num">${Number(ds.split('-')[2])}</div>
      <div class="wd-dot${dr.length?' vis':''}"></div>
      ${dr.length?`<div class="wd-count">${dr.length}·👥${pax}</div>`:'<div class="wd-count" style="opacity:0">-</div>'}
    </div>`;
  });
  h+=`</div>`;
  const selRes=reservations.filter(r=>r.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time));
  h+=`<div class="section-header">${s().fmtDate(selectedDate)}</div>`;
  if(!selRes.length)h+=`<div class="empty" style="padding:20px 0"><p>${s().noRes}</p></div>`;
  else{const now=new Date();selRes.forEach(r=>{h+=resCard(r,now,today);});}
  document.getElementById('mainArea').innerHTML=h;
}

function renderMonth(){
  const today=todayStr();
  const[y,m]=selectedDate.split('-').map(Number);
  const firstDay=new Date(y,m-1,1),lastDay=new Date(y,m,0);
  const DNAMES=s().monthHeaders;
  let startDow=firstDay.getDay();if(startDow===0)startDow=7;
  const cells=[];
  for(let i=1;i<startDow;i++){const dt=new Date(y,m-1,1-startDow+i);cells.push({date:`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`,other:true});}
  for(let dd=1;dd<=lastDay.getDate();dd++)cells.push({date:`${y}-${pad(m)}-${pad(dd)}`,other:false});
  const rem=7-(cells.length%7);if(rem<7)for(let i=1;i<=rem;i++){const dt=new Date(y,m,i);cells.push({date:`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`,other:true});}
  let h=`<div class="date-nav">
    <button class="nav-arrow" onclick="moveMonth(-1)">&#8592;</button>
    <div class="date-label">${s().fmtMonth(selectedDate)}</div>
    <button class="nav-arrow" onclick="moveMonth(1)">&#8594;</button>
    ${selectedDate.slice(0,7)!==today.slice(0,7)?`<button class="today-btn" onclick="goToday()">${s().today}</button>`:''}
  </div><div class="month-grid">`;
  DNAMES.forEach(dn=>{h+=`<div class="month-day-header">${dn}</div>`;});
  cells.forEach(c=>{
    const dr=reservations.filter(r=>r.date===c.date);
    h+=`<div class="month-day${c.other?' other-month':''}${c.date===today?' today':''}${c.date===selectedDate?' selected':''}" onclick="selectDay('${c.date}')">
      <div class="md-num">${Number(c.date.split('-')[2])}</div>
      <div class="md-dot${dr.length?' vis':''}"></div>
    </div>`;
  });
  h+=`</div>`;
  const selRes=reservations.filter(r=>r.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time));
  h+=`<div class="section-header">${s().fmtDate(selectedDate)}</div>`;
  if(!selRes.length)h+=`<div class="empty" style="padding:16px 0"><p>${s().noRes}</p></div>`;
  else{const now=new Date();selRes.forEach(r=>{h+=resCard(r,now,today);});}
  document.getElementById('mainArea').innerHTML=h;
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function setView(v){currentView=v;['day','week','month'].forEach(x=>document.getElementById('btn-'+x).classList.toggle('active',x===v));render();}
function selectDay(d){selectedDate=d;render();}
function goToday(){selectedDate=todayStr();render();}
function moveDay(n){const[y,m,d]=selectedDate.split('-').map(Number);const dt=new Date(y,m-1,d+n);selectedDate=`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;render();}
function moveWeek(n){moveDay(n*7);}
function moveMonth(n){const[y,m]=selectedDate.split('-').map(Number);const dt=new Date(y,m-1+n,1);selectedDate=`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;render();}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function openModal(defaultDate){
  editingId=null; refreshModalTitle(); refreshSaveBtn();
  document.getElementById('fName').value='';
  document.getElementById('fDate').value=defaultDate||selectedDate;
  document.getElementById('fTime').value='19:30';
  document.getElementById('fPax').value='2';
  document.getElementById('fTable').value='';
  document.getElementById('fPhone').value='';
  document.getElementById('fNote').value='';
  refreshPickerDisplays();
  document.getElementById('modalOverlay').classList.add('open');
  if(!isIOS())setTimeout(()=>document.getElementById('fName').focus(),300);
}
function closeModal(){document.getElementById('modalOverlay').classList.remove('open');}

function editRes(id){
  const r=reservations.find(x=>x.id===id);if(!r)return;
  editingId=id; refreshModalTitle(); refreshSaveBtn();
  document.getElementById('fName').value=r.name;
  document.getElementById('fDate').value=r.date;
  document.getElementById('fTime').value=r.time;
  document.getElementById('fPax').value=r.pax;
  document.getElementById('fTable').value=r.table||'';
  document.getElementById('fPhone').value=r.phone||'';
  document.getElementById('fNote').value=r.note||'';
  refreshPickerDisplays();
  document.getElementById('modalOverlay').classList.add('open');
}

async function saveReservation(){
  const name=document.getElementById('fName').value.trim();
  const date=document.getElementById('fDate').value;
  const time=document.getElementById('fTime').value;
  const pax=parseInt(document.getElementById('fPax').value)||0;
  if(!name||!date||!time||pax<1){showToast(s().fillAll);return;}
  const prev=reservations.slice();
  const res={
    id:editingId||genId(),name,date,time,pax,
    table:document.getElementById('fTable').value.trim(),
    phone:document.getElementById('fPhone').value.trim(),
    note:document.getElementById('fNote').value.trim(),
  };
  if(editingId) reservations[reservations.findIndex(r=>r.id===editingId)]=res;
  else reservations.push(res);
  try{
    await save();
  }catch(_err){
    reservations=prev;
    showToast(s().storageError);
    return;
  }
  selectedDate=date;closeModal();render();showToast(editingId?s().updated:s().saved);
}

function toggleCard(e,id){
  e.stopPropagation();
  const card=document.getElementById('card-'+id);
  const wasOpen=card.classList.contains('expanded');
  document.querySelectorAll('.res-card.expanded').forEach(c=>c.classList.remove('expanded'));
  if(!wasOpen)card.classList.add('expanded');
}

function delRes(e,id){
  e.stopPropagation();
  openDeletePanel(id);
}

function openDeletePanel(id){
  const r=reservations.find(x=>x.id===id);if(!r)return;
  const[h,mn]=r.time.split(':').map(Number);
  const details=[`${s().fmtDate(r.date)} · ${s().timeStr(h,pad(mn))}`,s().guests(r.pax),r.table?`${s().tableWord} ${esc(r.table)}`:s().noTable];
  if(r.phone)details.push(esc(r.phone));
  if(r.note)details.push(esc(r.note));
  deleteId=id;
  document.getElementById('deletePreview').innerHTML=`<div class="delete-name">${esc(r.name)}</div><div class="delete-meta">${details.join('<br>')}</div>`;
  document.getElementById('deleteSheet').classList.add('open');
}

function closeDeletePanel(){
  deleteId=null;
  document.getElementById('deleteSheet').classList.remove('open');
}

async function confirmDelete(){
  if(!deleteId)return;
  const id=deleteId;
  const prev=reservations.slice();
  closeDeletePanel();
  reservations=reservations.filter(r=>r.id!==id);
  try{
    await save();
  }catch(_err){
    reservations=prev;
    showToast(s().storageError);
    return;
  }
  render();showToast(s().deleted);
}

// ─── SHARE ────────────────────────────────────────────────────────────────────
function buildShareText(){
  let label,list;
  if(currentView==='day'){
    label=s().fmtDate(selectedDate);
    list=reservations.filter(r=>r.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time));
  } else if(currentView==='week'){
    const days=getWeekDays(selectedDate);
    label=`${s().weekOf} ${s().fmtWeekLabel(days[0])}`;
    list=reservations.filter(r=>days.includes(r.date)).sort((a,b)=>a.date===b.date?a.time.localeCompare(b.time):a.date.localeCompare(b.date));
  } else {
    const[y,m]=selectedDate.split('-').map(Number);
    label=s().fmtMonth(selectedDate);
    list=reservations.filter(r=>r.date.startsWith(`${y}-${pad(m)}`)).sort((a,b)=>a.date===b.date?a.time.localeCompare(b.time):a.date.localeCompare(b.date));
  }
  const totalPax=list.reduce((a,r)=>a+r.pax,0);
  if(!list.length) return `🍽️ ${s().appTitle} – ${label}\n\n${s().noBookings}`;
  let txt=`🍽️ ${s().appTitle} – ${label}\n`;
  txt+=`📋 ${s().bookings(list.length)} · 👥 ${s().guests(totalPax)}\n`;
  if(currentView==='day'){
    txt+='\n';
    list.forEach(r=>{
      const[h,mn]=r.time.split(':').map(Number);
      txt+=`• ${s().timeStr(h,pad(mn))}  ${r.name}  (${s().pax(r.pax)}${r.table?`, T${r.table}`:''})`;
      if(r.note) txt+=`  📝 ${r.note}`;
      txt+='\n';
    });
  } else {
    let lastDate='';
    list.forEach(r=>{
      if(r.date!==lastDate){txt+=`\n📅 ${s().fmtShort(r.date)}\n`;lastDate=r.date;}
      const[h,mn]=r.time.split(':').map(Number);
      txt+=`• ${s().timeStr(h,pad(mn))}  ${r.name}  (${s().pax(r.pax)}${r.table?`, T${r.table}`:''})`;
      if(r.note) txt+=`  📝 ${r.note}`;
      txt+='\n';
    });
  }
  return txt;
}

let _st='';
function openShare(){
  _st=buildShareText();
  document.getElementById('shareText').textContent=_st;
  const dk={day:'shareDay',week:'shareWeek',month:'shareMonth'}[currentView];
  document.getElementById('shareDesc').textContent=s()[dk];
  document.getElementById('shareSheet').classList.add('open');
}
function closeShare(){document.getElementById('shareSheet').classList.remove('open');}
function shareWhatsapp(){
  const text=_st||buildShareText();
  _st=text;
  const encoded=encodeURIComponent(text);
  const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const appUrl='whatsapp://send?text='+encoded;
  const webUrl=(isMobile?'https://api.whatsapp.com/send?text=':'https://web.whatsapp.com/send?text=')+encoded;

  if(isMobile){
    // Open WhatsApp without replacing the current app page.
    window.open(appUrl,'_blank','noopener');
    return;
  }

  window.open(webUrl,'_blank','noopener');
}

function showToast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200);}

function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch(err=>console.error('SW registration failed',err));
}

document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)closeModal();});
document.getElementById('shareSheet').addEventListener('click',function(e){if(e.target===this)closeShare();});
document.getElementById('deleteSheet').addEventListener('click',function(e){if(e.target===this)closeDeletePanel();});
document.addEventListener('click',function(e){if(!e.target.closest('.res-card'))document.querySelectorAll('.res-card.expanded').forEach(c=>c.classList.remove('expanded'));});

async function initApp(){
  registerServiceWorker();
  applyLang();
  reservations=await loadReservations();
  render();
}

initApp();
