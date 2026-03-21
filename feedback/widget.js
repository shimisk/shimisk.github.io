import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyATnLuZmfLZ15q6BJL1rp3VUTtt8MuQzkk",
  authDomain: "shimisk-feedback.firebaseapp.com",
  projectId: "shimisk-feedback",
  storageBucket: "shimisk-feedback.firebasestorage.app",
  messagingSenderId: "218198792768",
  appId: "1:218198792768:web:90370a425e6aa78cdf9da5"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const MAX_MESSAGE_LENGTH = 2000;
const SUBMIT_COOLDOWN_MS = 30 * 1000;
const FEEDBACK_COOLDOWN_KEY = "shimisk-feedback-last-submit";

const APP_NAME = document.title;
const isDiaryApp = APP_NAME.includes('Diary');

// ── Detect app theme ──────────────────────────────────────────
let themeColor = '#5c6bc0';  // default
let hoverColor = '#3f51b5';
let btnWidth = '42px';
let btnHeight = '42px';
let fontSize = '18px';
let posBottom = '20px';
let posLeft = 'auto';
let posRight = '20px';

if (APP_NAME.includes('Sudoku')) {
  themeColor = '#f9c6d0';
  hoverColor = '#f0a8c0';
  btnWidth = '44px';
  btnHeight = '44px';
  fontSize = '1.15rem';
  posBottom = '20px';
  posRight = '20px';
  posLeft = 'auto';
} else if (APP_NAME.includes('Valheim')) {
  themeColor = '#d4aa60';
  hoverColor = '#e5c074';
  btnWidth = '42px';
  btnHeight = '42px';
  fontSize = '18px';
  posBottom = '20px';
  posRight = '20px';
  posLeft = 'auto';
} else if (APP_NAME.includes('Diary')) {
  themeColor = '#9b59b6';
  hoverColor = '#7d3ca0';
  btnWidth = '42px';
  btnHeight = '42px';
  fontSize = '18px';
  posBottom = '20px';
  posLeft = '20px';
  posRight = 'auto';
}

// ── Styles ────────────────────────────────────────────────────
const css = `
  #fw-btn {
    position: fixed;
    bottom: ${posBottom};
    left: ${posLeft};
    right: ${posRight};
    z-index: 9998;
    width: ${btnWidth};
    height: ${btnHeight};
    border-radius: 50%;
    background: ${themeColor};
    color: #fff;
    border: none;
    font-size: ${fontSize};
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s, background 0.15s;
    line-height: 1;
  }
  ${isDiaryApp ? '#fw-btn { display: none; }' : ''}
  #fw-btn:hover { background: ${hoverColor}; transform: scale(1.08); }

  #fw-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 9999;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  #fw-backdrop.open { display: flex; }

  #fw-modal {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    max-width: 380px;
    font-family: system-ui, -apple-system, sans-serif;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  }

  #fw-modal h2 {
    margin: 0 0 4px;
    font-size: 18px;
    color: #1a1a2e;
  }

  #fw-app-label {
    font-size: 12px;
    color: #888;
    margin: 0 0 16px;
  }

  .fw-type-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .fw-type-btn {
    flex: 1;
    padding: 8px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: #f5f5f5;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s;
  }
  .fw-type-btn.fw-active {
    border-color: #5c6bc0;
    background: #ede7f6;
    color: #3f51b5;
    font-weight: 600;
  }

  #fw-message {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    font-family: system-ui, -apple-system, sans-serif;
    resize: vertical;
    min-height: 100px;
    outline: none;
    transition: border-color 0.15s;
  }
  #fw-message:focus { border-color: #5c6bc0; }

  .fw-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    justify-content: flex-end;
  }

  #fw-cancel {
    padding: 10px 18px;
    border: none;
    border-radius: 8px;
    background: #f0f0f0;
    color: #555;
    cursor: pointer;
    font-size: 14px;
  }
  #fw-cancel:hover { background: #e0e0e0; }

  #fw-submit {
    padding: 10px 18px;
    border: none;
    border-radius: 8px;
    background: #5c6bc0;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: background 0.15s;
  }
  #fw-submit:hover { background: #3f51b5; }
  #fw-submit:disabled { background: #aaa; cursor: not-allowed; }

  #fw-status {
    margin-top: 12px;
    font-size: 13px;
    text-align: center;
    min-height: 18px;
  }
  .fw-success { color: #2e7d32; }
  .fw-error { color: #c62828; }
`;

const styleEl = document.createElement('style');
styleEl.textContent = css;
document.head.appendChild(styleEl);

// ── Build UI ──────────────────────────────────────────────────
const wrapper = document.createElement('div');
wrapper.innerHTML = `
  <button id="fw-btn" aria-label="Send feedback">?</button>
  <div id="fw-backdrop">
    <div id="fw-modal" role="dialog" aria-modal="true" aria-labelledby="fw-title">
      <h2 id="fw-title">Send Feedback</h2>
      <p id="fw-app-label">${APP_NAME}</p>
      <div class="fw-type-row">
        <button class="fw-type-btn fw-active" data-type="suggestion">💡 Suggestion</button>
        <button class="fw-type-btn" data-type="bug">🐛 Bug</button>
      </div>
      <textarea id="fw-message" maxlength="2000" placeholder="What would you like to see, or what went wrong?"></textarea>
      <div class="fw-actions">
        <button id="fw-cancel">Cancel</button>
        <button id="fw-submit">Send</button>
      </div>
      <div id="fw-status"></div>
    </div>
  </div>
`;
document.body.appendChild(wrapper);

// ── Logic ─────────────────────────────────────────────────────
const backdrop  = document.getElementById('fw-backdrop');
const openBtn   = document.getElementById('fw-btn');
const cancelBtn = document.getElementById('fw-cancel');
const submitBtn = document.getElementById('fw-submit');
const messageEl = document.getElementById('fw-message');
const statusEl  = document.getElementById('fw-status');
const typeBtns  = document.querySelectorAll('.fw-type-btn');

let selectedType = 'suggestion';

function openModal() {
  backdrop.classList.add('open');
  messageEl.focus();
}

window.openFeedbackWidget = openModal;

openBtn.addEventListener('click', openModal);

cancelBtn.addEventListener('click', closeModal);
backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

typeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    typeBtns.forEach(b => b.classList.remove('fw-active'));
    btn.classList.add('fw-active');
    selectedType = btn.dataset.type;
  });
});

submitBtn.addEventListener('click', async () => {
  const message = messageEl.value.trim();
  if (!message) {
    statusEl.textContent = 'Please write a message.';
    statusEl.className = 'fw-error';
    return;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    statusEl.textContent = 'Message is too long.';
    statusEl.className = 'fw-error';
    return;
  }

  const lastSubmittedAt = Number(localStorage.getItem(FEEDBACK_COOLDOWN_KEY) || 0);
  const cooldownRemaining = SUBMIT_COOLDOWN_MS - (Date.now() - lastSubmittedAt);
  if (cooldownRemaining > 0) {
    statusEl.textContent = `Please wait ${Math.ceil(cooldownRemaining / 1000)}s before sending again.`;
    statusEl.className = 'fw-error';
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = 'Sending…';
  statusEl.className = '';

  try {
    await addDoc(collection(db, 'feedback'), {
      app: APP_NAME,
      type: selectedType,
      message,
      timestamp: serverTimestamp()
    });
    localStorage.setItem(FEEDBACK_COOLDOWN_KEY, String(Date.now()));
    statusEl.textContent = '✓ Thanks for your feedback!';
    statusEl.className = 'fw-success';
    messageEl.value = '';
    setTimeout(closeModal, 1500);
  } catch (err) {
    statusEl.textContent = 'Failed to send. Please try again.';
    statusEl.className = 'fw-error';
    console.error('Feedback widget error:', err);
  } finally {
    submitBtn.disabled = false;
  }
});

function closeModal() {
  backdrop.classList.remove('open');
  statusEl.textContent = '';
  statusEl.className = '';
}
