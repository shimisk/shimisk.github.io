(function initPetbookModals() {
  const { EMOJIS, PET_TYPES } = window.PetbookConstants;

  function renderPickerField(label, inputId, type, value, emptyMessage) {
    const displayId = `${inputId}Display`;
    const valueAttribute = value ? ` value="${value}"` : '';
    const message = emptyMessage || (type === 'time' ? 'Select time' : 'Select date');
    return `
      <div class="form-group">
        <label class="picker-field" onclick="openPicker(event, '${inputId}')">
          <span class="form-label">${label}</span>
          <span class="picker-display" id="${displayId}" data-empty-message="${message}"></span>
          <input class="form-input picker-input-overlay" id="${inputId}" type="${type}"${valueAttribute} onchange="syncPickerDisplay('${inputId}', '${displayId}', '${message}')"/>
        </label>
      </div>
    `;
  }

  function getModalContent(type, getActivePet, getNotificationConfig) {
    if (type === 'settings') {
      const config = getNotificationConfig ? getNotificationConfig() : { medicine: true, vets: true, permission: 'default' };
      const permissionText = config.permission === 'granted'
        ? 'Notifications are enabled.'
        : config.permission === 'denied'
          ? 'Notifications are blocked in browser settings.'
          : 'Allow notifications to receive reminders.';

      return `
        <div class="modal-handle"></div>
        <div class="modal-title">Settings ⚙️</div>
        <div class="settings-list">
          <div class="settings-item">
            <div>
              <div class="settings-item-title">Medicine reminders</div>
              <div class="settings-item-subtitle">Due and overdue medicine alerts</div>
            </div>
            <button class="settings-toggle-btn ${config.medicine ? 'on' : 'off'}" data-action="toggle-notification-setting" data-setting="medicine">${config.medicine ? 'ON' : 'OFF'}</button>
          </div>
          <div class="settings-item">
            <div>
              <div class="settings-item-title">Vet appointment reminders</div>
              <div class="settings-item-subtitle">Due and overdue appointment alerts</div>
            </div>
            <button class="settings-toggle-btn ${config.vets ? 'on' : 'off'}" data-action="toggle-notification-setting" data-setting="vets">${config.vets ? 'ON' : 'OFF'}</button>
          </div>
        </div>
        <div class="settings-note">${permissionText}</div>
        ${config.permission !== 'granted' ? '<button class="btn-primary" data-action="request-notification-permission">Enable notifications</button>' : ''}
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">Close</button>
        </div>
      `;
    }

    if (type === 'addPet') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">Add a Pet 🐾</div>
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="form-input" id="f_name" placeholder="e.g. Buddy" />
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" id="f_type">
            ${PET_TYPES.map((typeOption) => `<option>${typeOption}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Breed (optional)</label>
          <input class="form-input" id="f_breed" placeholder="e.g. Golden Retriever" />
        </div>
        <div class="form-group">
          <label class="form-label">Age (optional)</label>
          <input class="form-input" id="f_age" placeholder="e.g. 3 years" />
        </div>
        <div class="form-group">
          <label class="form-label">Pick an emoji</label>
          <div class="emoji-picker">
            ${EMOJIS.map((emoji) => `<button class="emoji-opt" data-action="select-emoji" data-emoji="${emoji}">${emoji}</button>`).join('')}
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn-primary" data-action="save-pet">Add Pet</button>
        </div>
      `;
    }

    if (type === 'add_medicines') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">Add Medicine 💊</div>
        <div class="form-group">
          <label class="form-label">Medicine name</label>
          <input class="form-input" id="f_name" placeholder="e.g. Bravecto" />
        </div>
        <div class="form-group">
          <label class="form-label">Dose</label>
          <input class="form-input" id="f_dose" placeholder="e.g. 1 tablet" />
        </div>
        <div class="form-group">
          <label class="form-label">Frequency</label>
          <select class="form-select" id="f_freq">
            <option>Daily</option><option>Every 2 days</option><option>Weekly</option>
            <option>Monthly</option><option>Every 3 months</option><option>As needed</option>
          </select>
        </div>
        ${renderPickerField('Next due date', 'f_next', 'date')}
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="f_notes" placeholder="Any additional info..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="medicines">Save</button>
        </div>
      `;
    }

    if (type === 'add_feeding') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">Add Feeding 🍽️</div>
        ${renderPickerField('Time', 'f_time', 'time')}
        <div class="form-group">
          <label class="form-label">Food</label>
          <input class="form-input" id="f_food" placeholder="e.g. Dry kibble" />
        </div>
        <div class="form-group">
          <label class="form-label">Amount</label>
          <input class="form-input" id="f_amount" placeholder="e.g. 200g" />
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="f_notes" placeholder="Any additional info..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="feeding">Save</button>
        </div>
      `;
    }

    if (type === 'add_routine') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">Add Routine 🦮</div>
        <div class="form-group">
          <label class="form-label">Activity</label>
          <input class="form-input" id="f_name" placeholder="e.g. Morning walk" />
        </div>
        ${renderPickerField('Time', 'f_time', 'time')}
        <div class="form-group">
          <label class="form-label">Duration (minutes)</label>
          <input class="form-input" id="f_duration" type="number" placeholder="e.g. 30" />
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="f_notes" placeholder="Any additional info..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="routine">Save</button>
        </div>
      `;
    }

    if (type === 'add_vets') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">Add Vet Appointment 🏥</div>
        <div class="form-group">
          <label class="form-label">Reason</label>
          <input class="form-input" id="f_reason" placeholder="e.g. Annual checkup" />
        </div>
        ${renderPickerField('Date', 'f_date', 'date')}
        <div class="form-group">
          <label class="form-label">Vet / Clinic</label>
          <input class="form-input" id="f_vet" placeholder="e.g. Happy Paws Clinic" />
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="f_notes" placeholder="Any additional info..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="vets">Save</button>
        </div>
      `;
    }

    if (type === 'add_favorites') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">Add Favorite Toy/Thing 🎾</div>
        <div class="form-group">
          <label class="form-label">Item</label>
          <input class="form-input" id="f_item" placeholder="e.g. Tennis ball, squeaky toy" />
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="f_notes" placeholder="Optional details..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="favorites">Save</button>
        </div>
      `;
    }

    if (type === 'add_allergies') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">Add Allergy ⚠️</div>
        <div class="form-group">
          <label class="form-label">Allergen</label>
          <input class="form-input" id="f_allergen" placeholder="e.g. Chicken, Dairy" />
        </div>
        <div class="form-group">
          <label class="form-label">Reaction</label>
          <input class="form-input" id="f_reaction" placeholder="e.g. Itching, Upset stomach" />
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="f_notes" placeholder="Additional info..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="allergies">Save</button>
        </div>
      `;
    }

    if (type === 'addWeight') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">Log Weight ⚖️</div>
        <div class="form-group">
          <label class="form-label">Weight (kg)</label>
          <input class="form-input" id="f_weight" type="number" step="0.1" placeholder="e.g. 12.5" />
        </div>
        ${renderPickerField('Date', 'f_date', 'date', new Date().toISOString().split('T')[0])}
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn-primary" data-action="save-weight">Save</button>
        </div>
      `;
    }

    if (type === 'editPet') {
      const pet = getActivePet();
      if (!pet) {
        return '';
      }

      const emojiButtons = EMOJIS.map((emoji) => `
        <button class="emoji-opt ${emoji === pet.emoji ? 'selected' : ''}" data-action="select-emoji" data-emoji="${emoji}">${emoji}</button>
      `).join('');

      return `
        <div class="modal-handle"></div>
        <div class="modal-title">Edit ${pet.name}</div>
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="form-input" id="f_name" value="${pet.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Breed (optional)</label>
          <input class="form-input" id="f_breed" value="${pet.breed || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Age (optional)</label>
          <input class="form-input" id="f_age" value="${pet.age || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Pick an emoji</label>
          <div class="emoji-picker">${emojiButtons}</div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn-primary" data-action="update-pet">Save</button>
        </div>
        <div class="modal-danger-zone">
          <button class="btn-text-link" data-action="confirm-delete-pet">Remove ${pet.name} from Petbook</button>
        </div>
      `;
    }

    return '';
  }

  window.PetbookModals = { getModalContent };
})();
