const KEY = 'grax_rooms_v1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const save = d => localStorage.setItem(KEY, JSON.stringify(d));
const dk = d => d.toISOString().slice(0,10);
const fmtShort = d => d.toLocaleDateString('en',{month:'short',day:'numeric'});
const fmtDay = d => d.toLocaleDateString('en',{weekday:'long'});
const fmtFull = d => d.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'}).toUpperCase();

const today = new Date();
const yest = new Date(today); yest.setDate(today.getDate()-1);
const tk = dk(today), yk = dk(yest);

const TASK_ICONS = {
  deep: '🧼',
  reset: '🔄',
  clean: '🧹',
  check: '✅'
};

const TASK_LABELS = {
  deep: 'Deep clean',
  reset: 'Reset',
  clean: 'Clean',
  check: 'Check'
};

let data = load();
let tmp = new Set();
let currentMode = 'today'; // 'today', 'yesterday' or 'assignment'

function normalizeForNewDay() {
  if (!data.meta) data.meta = {};
  const lastDate = data.meta.lastDate;
  if (lastDate === tk) {
    return;
  }
  if (lastDate && data[lastDate]?.rooms?.length) {
    data[yk] = { rooms: data[lastDate].rooms, done: data[lastDate].done || [] };
  } else {
    data[yk] = { rooms: [], done: [] };
  }
  data[tk] = { rooms: [], done: [] };
  data.tasks = {};
  data.notes = {};
  data.meta.lastDate = tk;
  save(data);
}

normalizeForNewDay();

if (!data[tk]) data[tk] = {rooms:[],done:[]};
if (!data[yk] || !Array.isArray(data[yk].rooms) || !data[yk].rooms.length) {
  data[yk] = {rooms:[],done:[]};
}
if (!data.tasks) data.tasks = {};

function renderY() {
  const g = document.getElementById('yGrid');
  const {rooms=[],done=[]} = data[yk]||{};
  g.innerHTML = rooms.length
    ? rooms.map(r=>`<div class="room-pill ${done.includes(r)?'done':''}">${r}</div>`).join('')
    : '<span class="empty-state">No rooms logged for yesterday.</span>';
}

function renderT() {
  const g = document.getElementById('tGrid');
  const {rooms=[],done=[]} = data[tk]||{};

  if (!rooms.length) {
    g.innerHTML = '<span class="empty-state">Tap Edit to assign rooms for today.</span>';
    return;
  }

  g.innerHTML = '';
  rooms.forEach(r => {
    const item = document.createElement('div');
    item.className = `room-pill ${done.includes(r) ? 'done' : ''}`;
    item.textContent = r;
    g.appendChild(item);
  });
}

function getTaskKeys(isY, isT) {
  if (isY && isT) return ['deep', 'reset', 'clean', 'check'];
  if (isY) return ['deep', 'reset', 'clean'];
  return ['clean', 'check'];
}

function ensureTaskState(room, taskKeys) {
  if (!data.tasks) data.tasks = {};
  if (!data.tasks[room]) data.tasks[room] = {};
  for (const key of taskKeys) {
    if (data.tasks[room][key] === undefined) data.tasks[room][key] = false;
  }
}

function isTaskComplete(room, taskKeys) {
  ensureTaskState(room, taskKeys);
  return taskKeys.every(key => data.tasks[room][key]);
}

function renderAss() {
  const g = document.getElementById('assGrid');
  const yRooms = new Set(data[yk]?.rooms || []);
  const tRooms = new Set(data[tk]?.rooms || []);
  const combined = [...new Set([...yRooms, ...tRooms])].sort();
  if (!combined.length) {
    g.innerHTML = '<span class="empty-state">Tap Edit to assign combined rooms.</span>';
    document.getElementById('todoStats').textContent = '';
    return;
  }
  const counts = { both: 0, yesterday: 0, today: 0 };
  g.className = 'todo-grid';
  g.innerHTML = combined.map(r => {
    const isY = yRooms.has(r);
    const isT = tRooms.has(r);
    const note = data.notes?.[r] || '';
    const taskKeys = getTaskKeys(isY, isT);
    ensureTaskState(r, taskKeys);
    const done = isTaskComplete(r, taskKeys);
    const type = isY && isT ? 'todo-both' : isY ? 'todo-yesterday' : 'todo-today';
    if (type === 'todo-both') counts.both += 1;
    else if (type === 'todo-yesterday') counts.yesterday += 1;
    else counts.today += 1;
    const labelHtml = taskKeys.map(key => {
      const active = data.tasks[r][key];
      return `
        <button type="button" class="task-tag ${active ? 'active' : ''}" title="${TASK_LABELS[key]}" onclick="toggleTask('${r}','${key}')">
          ${TASK_ICONS[key]}
          <span class="sr-only">${TASK_LABELS[key]}</span>
        </button>`;
    }).join('');
    return `
      <div class="todo-card ${type}${done ? ' completed' : ''}">
        <div class="todo-card-label">${r}</div>
        <div class="todo-card-meta">
          <div class="todo-task-list">${labelHtml}</div>
          <button type="button" class="note-btn" onclick="openNote('${r}')">✎</button>
        </div>
        <div class="todo-note">${note ? note : ''}</div>
        <button type="button" class="complete-btn" onclick="toggleComplete('${r}')" aria-pressed="${done ? 'true' : 'false'}">✓ ${done ? 'Done' : 'Undone'}</button>
      </div>
    `;
  }).join('');
  document.getElementById('todoStats').innerHTML = `
    <span class="todo-stat todo-stat-both">Both: <strong>${counts.both}</strong></span>
    <span class="todo-stat todo-stat-yesterday">Yesterday: <strong>${counts.yesterday}</strong></span>
    <span class="todo-stat todo-stat-today">Today: <strong>${counts.today}</strong></span>
  `;
}

function toggleTask(room, task) {
  if (!data.tasks) data.tasks = {};
  if (!data.tasks[room]) data.tasks[room] = {};
  data.tasks[room][task] = !data.tasks[room][task];
  save(data);
  renderAss();
}

function toggleComplete(room) {
  const yRooms = new Set(data[yk]?.rooms || []);
  const tRooms = new Set(data[tk]?.rooms || []);
  const isY = yRooms.has(room);
  const isT = tRooms.has(room);
  const taskKeys = getTaskKeys(isY, isT);
  ensureTaskState(room, taskKeys);
  const completed = isTaskComplete(room, taskKeys);
  taskKeys.forEach(key => data.tasks[room][key] = !completed);
  save(data);
  renderAss();
}

function buildGrid() {
  const g = document.getElementById('gridSel');
  g.innerHTML = '';
  const sourceRooms = currentMode === 'yesterday'
    ? new Set(data[yk]?.rooms || [])
    : new Set(data[tk]?.rooms || []);
  tmp = new Set(sourceRooms);
  document.getElementById('sheetTitle').textContent = currentMode === 'today'
    ? "Today's Rooms"
    : currentMode === 'yesterday'
      ? "Yesterday's Rooms"
      : "Combined Yesterday & Today";
  for (let i = 1; i <= 32; i++) {
    const r = String(i).padStart(2, '0');
    const b = document.createElement('button');
    const isPreSelected = sourceRooms.has(r);
    b.className = 'rc' + (isPreSelected ? ' on' : '');
    b.textContent = r;
    b.onclick = () => {
      tmp.has(r) ? tmp.delete(r) : tmp.add(r);
      b.classList.toggle('on');
      document.getElementById('selCount').textContent = tmp.size;
    };
    g.appendChild(b);
  }
  document.getElementById('selCount').textContent = tmp.size;
}

function clearSel() {
  tmp.clear();
  document.getElementById('selCount').textContent = tmp.size;
  document.querySelectorAll('#gridSel .rc.on').forEach(btn => btn.classList.remove('on'));
}

function openSheet(mode) {
  currentMode = mode;
  buildGrid();
  document.getElementById('overlay').classList.add('open');
}

function closeSheet() { document.getElementById('overlay').classList.remove('open'); }

function confirm() {
  const rooms = Array.from(tmp).sort();
  if (currentMode === 'today') {
    const prev = data[tk]?.done || [];
    data[tk] = { rooms, done: prev.filter(r => tmp.has(r)) };
  } else if (currentMode === 'yesterday') {
    const prev = data[yk]?.done || [];
    data[yk] = { rooms, done: prev.filter(r => tmp.has(r)) };
  } else if (currentMode === 'assignment') {
    const prev = data[tk]?.done || [];
    data[tk] = { rooms, done: prev.filter(r => tmp.has(r)) };
  }
  save(data);
  renderY();
  renderT();
  renderAss();
  closeSheet();
}

let currentNoteRoom = null;

function openNote(room) {
  currentNoteRoom = room;
  const noteInput = document.getElementById('noteInput');
  noteInput.value = data.notes?.[room] || '';
  document.getElementById('noteRoomLabel').textContent = room;
  document.getElementById('noteOverlay').classList.add('open');
  setTimeout(() => noteInput.focus(), 50);
}

function closeNote() {
  document.getElementById('noteOverlay').classList.remove('open');
}

function saveNote() {
  const note = document.getElementById('noteInput').value.trim();
  if (!data.notes) data.notes = {};
  if (note) {
    data.notes[currentNoteRoom] = note;
  } else {
    delete data.notes[currentNoteRoom];
  }
  save(data);
  renderAss();
  closeNote();
}

function clearNote() {
  document.getElementById('noteInput').value = '';
}

function noteOverlayClick(e) { if (e.target===document.getElementById('noteOverlay')) closeNote(); }

function overlayClick(e) { if(e.target===document.getElementById('overlay')) closeSheet(); }

renderY(); renderT(); renderAss();