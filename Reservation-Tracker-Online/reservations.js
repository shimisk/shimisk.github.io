// ─── LANGUAGE STATE ───────────────────────────────────────────────────────────
const LANG_KEY='res_lang_v1';
const pickerLayer=window.IOSPickerLayer;
function detectLang(){
  const s=localStorage.getItem(LANG_KEY);
  if(s==='it'||s==='en') return s;
  return (navigator.language||'en').toLowerCase().startsWith('it')?'it':'en';
}
let lang=detectLang();
const s=()=>STRINGS[lang]; // shortcut
const firebaseCtx=window.reservationTrackerFirebase||{app:null,auth:null,db:null,isConfigured:false};
let currentUser=null;
let authReady=false;
let isSigningIn=false;

function setLang(l){lang=l;localStorage.setItem(LANG_KEY,l);applyLang();render();}

function applyLang(){
  if(pickerLayer) pickerLayer.applyBodyClass({className:'ios-pickers'});
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
  setText('logoutBtn',s().authSignOut);
  setText('authKicker',s().authKicker);
  setText('authTitleText',s().authTitle);
  setText('authLead',s().authLead);
  setText('authEmailLabel',s().authEmail);
  setText('authPasswordLabel',s().authPassword);
  setAttr('authEmail','placeholder',s().authEmailPh);
  setAttr('authPassword','placeholder',s().authPasswordPh);
  setText('authLoadingText',s().authLoading);
  setText('timePickerTitle',s().timePickerTitle);
  setText('timeHourLabel',s().timeHour);
  setText('timeMinuteLabel',s().timeMinute);
  setText('timeCancelBtn',s().cancel);
  setText('timeApplyBtn',s().apply);
  document.getElementById('langEN').classList.toggle('active',lang==='en');
  document.getElementById('langIT').classList.toggle('active',lang==='it');
  refreshModalTitle();
  refreshSaveBtn();
  refreshPickerDisplays();
  refreshAuthButton();
  renderAuthState();
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
let reservations=[];
let currentRestaurantId=null;
let hasRestaurantAccess=false;
let reservationsUnsubscribe=null;
let currentView='day', selectedDate=todayStr(), editingId=null, deleteId=null;
function todayStr(){const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function pad(n){return String(n).padStart(2,'0');}
function snapTimeToQuarter(timeStr){
  if(!timeStr||typeof timeStr!=='string'||!timeStr.includes(':')) return timeStr;
  const parts=timeStr.split(':');
  const hh=parseInt(parts[0],10);
  const mm=parseInt(parts[1],10);
  if(Number.isNaN(hh)||Number.isNaN(mm)) return timeStr;
  let total=hh*60+mm;
  total=Math.round(total/15)*15;
  const maxMinutes=(23*60)+45;
  if(total<0) total=0;
  if(total>maxMinutes) total=maxMinutes;
  const snappedH=Math.floor(total/60);
  const snappedM=total%60;
  return `${pad(snappedH)}:${pad(snappedM)}`;
}
function genId(){return Date.now().toString(36)+Math.random().toString(36).slice(2);}
function esc(v){const d=document.createElement('div');d.textContent=v;return d.innerHTML;}
function getDb(){return firebaseCtx.db||null;}
function getReservationsCollection(restaurantId){
  return getDb().collection('restaurants').doc(restaurantId).collection('reservations');
}
function getUserDocRef(uid){
  return getDb().collection('users').doc(uid);
}
function stopReservationsListener(){
  if(typeof reservationsUnsubscribe==='function') reservationsUnsubscribe();
  reservationsUnsubscribe=null;
}
function normalizeReservation(entry){
  const r=entry&&typeof entry==='object'?entry:{};
  return {
    id:String(r.id||genId()),
    name:String(r.name||''),
    date:String(r.date||todayStr()),
    time:String(r.time||'19:30'),
    pax:Math.max(1,parseInt(r.pax,10)||1),
    table:r.table?String(r.table):'',
    phone:r.phone?String(r.phone):'',
    note:r.note?String(r.note):'',
    arrived:Boolean(r.arrived),
  };
}
function normalizeReservations(list){
  if(!Array.isArray(list)) return [];
  return list.filter(r=>r&&typeof r==='object').map(normalizeReservation);
}
async function resolveRestaurantForUser(user){
  const db=getDb();
  if(!db||!user) throw new Error('DB_UNAVAILABLE');
  const uid=user.uid;
  const userRef=getUserDocRef(uid);
  const userSnap=await userRef.get();
  const userData=userSnap.exists?(userSnap.data()||{}):{};
  let activeRestaurantId=userData.activeRestaurantId?String(userData.activeRestaurantId):'';
  if(!activeRestaurantId&&Array.isArray(userData.restaurantIds)&&userData.restaurantIds.length){
    activeRestaurantId=String(userData.restaurantIds[0]||'');
  }
  if(!activeRestaurantId) throw new Error('NO_RESTAURANT_ACCESS');

  let memberSnap;
  try{
    memberSnap=await db.collection('restaurants').doc(activeRestaurantId).collection('members').doc(uid).get();
  }catch(err){
    if(err&&err.code==='permission-denied') throw new Error('NO_RESTAURANT_ACCESS');
    throw err;
  }

  if(!memberSnap.exists) throw new Error('NO_RESTAURANT_ACCESS');
  const memberData=memberSnap.data()||{};
  if(memberData.active===false) throw new Error('NO_RESTAURANT_ACCESS');

  await userRef.set({
    email:user.email||'',
    activeRestaurantId:activeRestaurantId,
    updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
  },{merge:true});

  return activeRestaurantId;
}
function listenToReservations(restaurantId){
  const db=getDb();
  if(!db) throw new Error('DB_UNAVAILABLE');
  stopReservationsListener();
  reservations=[];
  render();
  reservationsUnsubscribe=getReservationsCollection(restaurantId).onSnapshot(snapshot=>{
    reservations=normalizeReservations(snapshot.docs.map(doc=>Object.assign({id:doc.id},doc.data()||{})));
    render();
  },err=>{
    console.error('Reservations listener failed',err);
    showToast(s().storageError);
  });
}
async function upsertReservation(res){
  if(!currentRestaurantId||!currentUser) throw new Error('NO_RESTAURANT_SCOPE');
  const record=normalizeReservation(res);
  const basePayload={
    name:record.name,
    date:record.date,
    time:record.time,
    pax:record.pax,
    table:record.table,
    phone:record.phone,
    note:record.note,
    arrived:record.arrived,
    arrivedAt:record.arrived?firebase.firestore.FieldValue.serverTimestamp():null,
    arrivedBy:record.arrived?currentUser.uid:null,
    updatedBy:currentUser.uid,
    updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
  };
  const docRef=getReservationsCollection(currentRestaurantId).doc(record.id);
  if(editingId){
    await docRef.set(basePayload,{merge:true});
    return;
  }
  await docRef.set(Object.assign({},basePayload,{
    createdBy:currentUser.uid,
    createdAt:firebase.firestore.FieldValue.serverTimestamp(),
  }),{merge:true});
}
async function removeReservation(id){
  if(!currentRestaurantId) throw new Error('NO_RESTAURANT_SCOPE');
  await getReservationsCollection(currentRestaurantId).doc(id).delete();
}
function openPicker(e,id){
  if(id==='fTime'){
    openTimePicker(e);
    return;
  }
  const input=document.getElementById(id);
  if(!input||e.target===input)return;
  if(pickerLayer){pickerLayer.openPicker(e,input);return;}
  e.preventDefault();
  input.focus();
  input.click();
}
function initTimePickerOptions(){
  const hour=document.getElementById('timeHour');
  if(!hour||hour.options.length) return;
  for(let h=0;h<24;h+=1){
    const v=pad(h);
    const opt=document.createElement('option');
    opt.value=v;
    opt.textContent=v;
    hour.appendChild(opt);
  }
}
function openTimePicker(e){
  if(e&&typeof e.preventDefault==='function') e.preventDefault();
  initTimePickerOptions();
  const timeInput=document.getElementById('fTime');
  const current=snapTimeToQuarter(timeInput?.value||'19:30');
  const parts=current.split(':');
  const hh=parts[0]||'19';
  const mm=parts[1]||'30';
  const hourSelect=document.getElementById('timeHour');
  const minuteSelect=document.getElementById('timeMinute');
  if(hourSelect) hourSelect.value=hh;
  if(minuteSelect) minuteSelect.value=['00','15','30','45'].includes(mm)?mm:'00';
  document.getElementById('timeSheet').classList.add('open');
}
function closeTimePicker(){
  document.getElementById('timeSheet').classList.remove('open');
}
function applyTimePicker(){
  const hour=document.getElementById('timeHour')?.value||'19';
  const minute=document.getElementById('timeMinute')?.value||'30';
  const timeValue=snapTimeToQuarter(`${hour}:${minute}`);
  const timeInput=document.getElementById('fTime');
  if(timeInput) timeInput.value=timeValue;
  refreshPickerDisplays();
  closeTimePicker();
}
function refreshPickerDisplays(){
  if(pickerLayer){
    pickerLayer.syncDisplayByIds('fDate','fDateDisplay',{emptyText:''});
    pickerLayer.syncDisplayByIds('fTime','fTimeDisplay',{emptyText:''});
    return;
  }
  const date=document.getElementById('fDate')?.value||'';
  const timeInput=document.getElementById('fTime');
  if(timeInput&&timeInput.value){
    const snapped=snapTimeToQuarter(timeInput.value);
    if(snapped&&snapped!==timeInput.value) timeInput.value=snapped;
  }
  const time=timeInput?.value||'';
  setText('fDateDisplay',date);
  setText('fTimeDisplay',time);
}
function openFeedbackPanel(){
  if(typeof window.openFeedbackWidget==='function') window.openFeedbackWidget();
}
function goToStore(){window.location.href='../index.html';}
function setHidden(id,hidden){const el=document.getElementById(id);if(el)el.hidden=hidden;}
function closeHeaderMenu(){
  const menu=document.getElementById('headerMenu');
  if(menu) menu.classList.remove('open');
  const btn=document.getElementById('menuBtn');
  if(btn) btn.setAttribute('aria-expanded','false');
}
function toggleHeaderMenu(event){
  if(event) event.stopPropagation();
  const menu=document.getElementById('headerMenu');
  if(!menu) return;
  const willOpen=!menu.classList.contains('open');
  menu.classList.toggle('open',willOpen);
  const btn=document.getElementById('menuBtn');
  if(btn) btn.setAttribute('aria-expanded',String(willOpen));
}
function showAuthError(message){
  const el=document.getElementById('authError');
  if(!el) return;
  el.textContent=message||'';
  el.hidden=!message;
}
function refreshAuthButton(){
  const btn=document.getElementById('authSignInBtn');
  if(!btn) return;
  btn.textContent=isSigningIn?s().authSigningIn:s().authSignIn;
  btn.disabled=isSigningIn||!firebaseCtx.isConfigured;
}
function renderAuthState(){
  const showLogin=!currentUser;
  const showNoAccess=!!currentUser&&!hasRestaurantAccess;
  document.body.classList.toggle('signed-in',!!currentUser);
  setHidden('authLoading',true);
  setHidden('authScreen',!(showLogin||showNoAccess));
  setHidden('authForm',!showLogin);
  setHidden('appShell',!currentUser||!hasRestaurantAccess);
  setHidden('logoutBtn',!currentUser);
  setHidden('authUserBadge',!currentUser);
  if(currentUser&&hasRestaurantAccess) setText('authUserBadge',`${s().authSignedInAs} ${currentUser.email||''}`);
  else if(currentUser) setText('authUserBadge',currentUser.email||'');
  else setText('authUserBadge','');

  if(showNoAccess){
    setText('authTitleText',s().authSignOut);
    setText('authLead',s().authNoRestaurant);
    showAuthError('');
  }else{
    setText('authTitleText',s().authTitle);
    setText('authLead',s().authLead);
  }
  closeHeaderMenu();
}
function getAuthErrorMessage(err){
  const code=err&&err.code?String(err.code):'';
  if(code==='auth/invalid-credential'||code==='auth/wrong-password'||code==='auth/user-not-found'||code==='auth/invalid-email') return s().authInvalidCreds;
  if(code==='auth/too-many-requests') return s().authTooMany;
  return s().authGenericError;
}
async function signInRestaurant(event){
  if(event) event.preventDefault();
  if(!firebaseCtx.isConfigured||!firebaseCtx.auth){showAuthError(s().authConfigMissing);return;}
  const email=document.getElementById('authEmail').value.trim();
  const password=document.getElementById('authPassword').value;
  if(!email||!password){showAuthError(s().fillAll);return;}
  isSigningIn=true;
  refreshAuthButton();
  showAuthError('');
  try{
    await firebaseCtx.auth.signInWithEmailAndPassword(email,password);
    document.getElementById('authPassword').value='';
  }catch(err){
    showAuthError(getAuthErrorMessage(err));
  }finally{
    isSigningIn=false;
    refreshAuthButton();
  }
}
async function signOutRestaurant(){
  if(!firebaseCtx.auth) return;
  try{
    await firebaseCtx.auth.signOut();
  }catch(err){
    console.error('Sign-out failed',err);
    showToast(s().authGenericError);
  }
}
async function handleAuthStateChange(user){
  stopReservationsListener();
  currentUser=user||null;
  currentRestaurantId=null;
  hasRestaurantAccess=false;
  authReady=true;
  editingId=null;
  deleteId=null;
  closeModal();
  closeShare();
  closeDeletePanel();
  if(currentUser){
    try{
      currentRestaurantId=await resolveRestaurantForUser(currentUser);
      hasRestaurantAccess=true;
      selectedDate=todayStr();
      showAuthError('');
      listenToReservations(currentRestaurantId);
    }catch(err){
      console.error('Restaurant scope resolution failed',err);
      reservations=[];
      hasRestaurantAccess=false;
      showAuthError(err&&err.message==='NO_RESTAURANT_ACCESS'?s().authNoRestaurant:s().authGenericError);
      document.getElementById('statBar').innerHTML='';
      document.getElementById('mainArea').innerHTML='';
    }
  }else{
    reservations=[];
    selectedDate=todayStr();
    if(document.getElementById('authPassword')) document.getElementById('authPassword').value='';
    document.getElementById('statBar').innerHTML='';
    document.getElementById('mainArea').innerHTML='';
  }
  renderAuthState();
  if(currentUser) render();
}
function initAuth(){
  authReady=true;
  renderAuthState();
  refreshAuthButton();
  if(!firebaseCtx.isConfigured||!firebaseCtx.auth){
    showAuthError(s().authConfigMissing);
    refreshAuthButton();
    return;
  }
  try{
    firebaseCtx.auth.onAuthStateChanged(user=>{
      handleAuthStateChange(user).catch(err=>{
        console.error('Auth state handling failed',err);
        currentUser=null;
        reservations=[];
        renderAuthState();
        showAuthError(s().authGenericError);
      });
    },err=>{
      console.error('Auth listener failed',err);
      currentUser=null;
      reservations=[];
      renderAuthState();
      showAuthError(getAuthErrorMessage(err));
    });
  }catch(err){
    console.error('Auth bootstrap failed',err);
    renderAuthState();
    showAuthError(s().authGenericError);
  }
}

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
  return `<div class="res-card${isPast?' past':''}${r.arrived?' arrived':''}" id="card-${r.id}" onclick="toggleCard(event,'${r.id}')">
    <div class="res-main">
      <div class="res-time">${s().timeHTML(h,pad(mn))}</div>
      <div class="res-divider"></div>
      ${r.table?`<div class="res-table">${r.table}<small>${s().tableWord}</small></div><div class="res-divider"></div>`:''}
      <div class="res-pax">${r.pax}<small>${s().paxWord}</small></div>
      <div class="res-divider"></div>
      <div class="res-info">
        <div class="res-name">${esc(r.name)}${r.arrived?` <span class="arrived-pill">${s().arrived}</span>`:''}</div>
        ${metaTxt?`<div class="res-meta">${metaTxt}</div>`:''}
      </div>
    </div>
    <div class="res-actions">
      <button class="act-btn arrive${r.arrived?' done':''}" onclick="toggleArrived(event,'${r.id}')">${r.arrived?'↩️':'✅'} ${r.arrived?s().markNotArrived:s().markArrived}</button>
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
  if(!currentUser){showToast(s().authRequired);return;}
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
  if(!(pickerLayer&&pickerLayer.isIOS&&pickerLayer.isIOS()))setTimeout(()=>document.getElementById('fName').focus(),300);
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
  if(!currentUser){showToast(s().authRequired);return;}
  if(!hasRestaurantAccess){showToast(s().authRequired);return;}
  const name=document.getElementById('fName').value.trim();
  const date=document.getElementById('fDate').value;
  const time=snapTimeToQuarter(document.getElementById('fTime').value);
  const pax=parseInt(document.getElementById('fPax').value)||0;
  if(!name||!date||!time||pax<1){showToast(s().fillAll);return;}
  document.getElementById('fTime').value=time;
  const prev=editingId?reservations.find(r=>r.id===editingId):null;
  const res={
    id:editingId||genId(),name,date,time,pax,
    table:document.getElementById('fTable').value.trim(),
    phone:document.getElementById('fPhone').value.trim(),
    note:document.getElementById('fNote').value.trim(),
    arrived:prev?Boolean(prev.arrived):false,
  };
  try{
    await upsertReservation(res);
  }catch(_err){
    showToast(s().storageError);
    return;
  }
  selectedDate=date;closeModal();showToast(editingId?s().updated:s().saved);
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

async function toggleArrived(e,id){
  e.stopPropagation();
  if(!currentUser||!hasRestaurantAccess){showToast(s().authRequired);return;}
  const res=reservations.find(r=>r.id===id);
  if(!res) return;
  try{
    await upsertReservation(Object.assign({},res,{arrived:!res.arrived}));
    showToast(s().arrivalUpdated);
  }catch(_err){
    showToast(s().storageError);
  }
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
  if(!currentUser){showToast(s().authRequired);return;}
  if(!hasRestaurantAccess){showToast(s().authRequired);return;}
  if(!deleteId)return;
  const id=deleteId;
  closeDeletePanel();
  try{
    await removeReservation(id);
  }catch(_err){
    showToast(s().storageError);
    return;
  }
  showToast(s().deleted);
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
  const isAndroid=/Android/i.test(navigator.userAgent);
  const isIphone=/iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if(isAndroid){
    // Android: use intent:// scheme for reliable app opening with system fallback
    const intentUrl='intent://send?text='+encoded+'#Intent;scheme=whatsapp;package=com.whatsapp;end';
    window.location.href=intentUrl;
  } else if(isIphone){
    // iPhone: use deep link
    window.location.href='whatsapp://send?text='+encoded;
  } else {
    // Desktop: use web URL in new tab
    window.open('https://web.whatsapp.com/send?text='+encoded,'_blank','noopener');
  }
}

function showToast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200);}

function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch(err=>{
    console.error('SW registration failed',err);
  });
}

document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)closeModal();});
document.getElementById('shareSheet').addEventListener('click',function(e){if(e.target===this)closeShare();});
document.getElementById('deleteSheet').addEventListener('click',function(e){if(e.target===this)closeDeletePanel();});
document.getElementById('timeSheet').addEventListener('click',function(e){if(e.target===this)closeTimePicker();});
document.addEventListener('click',function(e){
  if(!e.target.closest('.res-card')) document.querySelectorAll('.res-card.expanded').forEach(c=>c.classList.remove('expanded'));
  if(!e.target.closest('#headerMenu')&&!e.target.closest('#menuBtn')) closeHeaderMenu();
});

async function initApp(){
  registerServiceWorker();
  applyLang();
  initAuth();
}

initApp();
