(function initPetbookModals() {
  const { EMOJIS, PET_TYPES } = window.PetbookConstants;
  const i18n = window.PetbookI18n;
  const t = (key, vars) => (i18n ? i18n.t(key, vars) : key);

  function renderPickerField(label, inputId, type, value, emptyMessage) {
    const displayId = `${inputId}Display`;
    const valueAttribute = value ? ` value="${value}"` : '';
    const message = emptyMessage || (type === 'time' ? t('selectTime') : t('selectDate'));
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
      const config = getNotificationConfig ? getNotificationConfig() : { medicine: false, vets: false, permission: 'default', canToggle: false };
      const languages = i18n ? i18n.LANGUAGES : [{ code: 'en', label: 'English' }, { code: 'ja', label: 'Japanese' }];
      const selectedLanguage = i18n ? i18n.getLanguage() : 'en';
      const permissionText = config.permission === 'granted'
        ? t('permissionGranted')
        : config.permission === 'denied'
          ? t('permissionDenied')
          : t('permissionDefault');
      const toggleDisabledAttr = config.canToggle ? '' : ' disabled aria-disabled="true"';
      const toggleDisabledClass = config.canToggle ? '' : ' disabled';
      const languageOptions = languages.map((lang) => {
        const selectedAttr = lang.code === selectedLanguage ? ' selected' : '';
        return `<option value="${lang.code}"${selectedAttr}>${lang.label}</option>`;
      }).join('');

      return `
        <div class="modal-handle"></div>
        <div class="modal-title">${t('settingsTitle')}</div>
        <div class="settings-list">
          <div class="settings-item settings-item-language">
            <div>
              <div class="settings-item-title">${t('languageLabel')}</div>
              <div class="settings-item-subtitle">${t('languageHelp')}</div>
            </div>
            <select class="form-select settings-language-select" data-change-action="change-language">
              ${languageOptions}
            </select>
          </div>
          <div class="settings-item">
            <div>
              <div class="settings-item-title">${t('medicineRemindersTitle')}</div>
              <div class="settings-item-subtitle">${t('medicineRemindersSubtitle')}</div>
            </div>
            <button class="settings-toggle-btn ${config.medicine ? 'on' : 'off'}${toggleDisabledClass}" data-action="toggle-notification-setting" data-setting="medicine"${toggleDisabledAttr}>${config.medicine ? t('on') : t('off')}</button>
          </div>
          <div class="settings-item">
            <div>
              <div class="settings-item-title">${t('vetRemindersTitle')}</div>
              <div class="settings-item-subtitle">${t('vetRemindersSubtitle')}</div>
            </div>
            <button class="settings-toggle-btn ${config.vets ? 'on' : 'off'}${toggleDisabledClass}" data-action="toggle-notification-setting" data-setting="vets"${toggleDisabledAttr}>${config.vets ? t('on') : t('off')}</button>
          </div>
        </div>
        <div class="settings-note">${permissionText}</div>
        ${config.permission !== 'granted' ? `<button class="btn-primary" data-action="request-notification-permission">${t('enableNotifications')}</button>` : ''}
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">${t('close')}</button>
        </div>
      `;
    }

    if (type === 'addPet') {
      const petTypeLabels = {
        Dog: t('petTypeDog'),
        Cat: t('petTypeCat'),
        Rabbit: t('petTypeRabbit'),
        Hamster: t('petTypeHamster'),
        Bird: t('petTypeBird'),
        Fish: t('petTypeFish'),
        Turtle: t('petTypeTurtle'),
        Other: t('petTypeOther')
      };
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">${t('addPetTitle')}</div>
        <div class="form-group">
          <label class="form-label">${t('nameLabel')}</label>
          <input class="form-input" id="f_name" placeholder="e.g. Buddy" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('typeLabel')}</label>
          <select class="form-select" id="f_type">
            ${PET_TYPES.map((typeOption) => `<option value="${typeOption}">${petTypeLabels[typeOption] || typeOption}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('breedOptional')}</label>
          <input class="form-input" id="f_breed" placeholder="e.g. Golden Retriever" />
        </div>
        ${renderPickerField(t('birthdayOptional'), 'f_birthday', 'date')}
        <div class="form-group">
          <label class="form-label">${t('pickEmoji')}</label>
          <div class="emoji-picker">
            ${EMOJIS.map((emoji) => `<button class="emoji-opt" data-action="select-emoji" data-emoji="${emoji}">${emoji}</button>`).join('')}
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
          <button class="btn-primary" data-action="save-pet">${t('addPetButton')}</button>
        </div>
      `;
    }

    if (type === 'add_medicines') {
      const frequencyOptions = [
        t('daily'),
        t('every2Days'),
        t('weekly'),
        t('monthly'),
        t('every3Months'),
        t('asNeeded')
      ];
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">${t('addMedicineTitle')}</div>
        <div class="form-group">
          <label class="form-label">${t('medicineNameLabel')}</label>
          <input class="form-input" id="f_name" placeholder="e.g. Bravecto" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('doseLabel')}</label>
          <input class="form-input" id="f_dose" placeholder="e.g. 1 tablet" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('frequencyLabel')}</label>
          <select class="form-select" id="f_freq">
            ${frequencyOptions.map((label) => `<option>${label}</option>`).join('')}
          </select>
        </div>
        ${renderPickerField(t('timeLabel'), 'f_time', 'time')}
        <div class="form-group">
          <label class="form-label">${t('notesLabel')}</label>
          <textarea class="form-textarea" id="f_notes" placeholder="${t('notesPlaceholder')}"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="medicines">${t('save')}</button>
        </div>
      `;
    }

    if (type === 'add_feeding') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">${t('addFeedingTitle')}</div>
        ${renderPickerField(t('timeLabel'), 'f_time', 'time')}
        <div class="form-group">
          <label class="form-label">${t('foodLabel')}</label>
          <input class="form-input" id="f_food" placeholder="e.g. Dry kibble" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('amountLabel')}</label>
          <input class="form-input" id="f_amount" placeholder="e.g. 200g" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('notesLabel')}</label>
          <textarea class="form-textarea" id="f_notes" placeholder="${t('notesPlaceholder')}"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="feeding">${t('save')}</button>
        </div>
      `;
    }

    if (type === 'add_routine') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">${t('addRoutineTitle')}</div>
        <div class="form-group">
          <label class="form-label">${t('activityLabel')}</label>
          <input class="form-input" id="f_name" placeholder="e.g. Morning walk" />
        </div>
        ${renderPickerField(t('timeLabel'), 'f_time', 'time')}
        <div class="form-group">
          <label class="form-label">${t('durationMinutes')}</label>
          <input class="form-input" id="f_duration" type="number" placeholder="e.g. 30" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('notesLabel')}</label>
          <textarea class="form-textarea" id="f_notes" placeholder="${t('notesPlaceholder')}"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="routine">${t('save')}</button>
        </div>
      `;
    }

    if (type === 'add_vets') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">${t('addVetTitle')}</div>
        <div class="form-group">
          <label class="form-label">${t('reasonLabel')}</label>
          <input class="form-input" id="f_reason" placeholder="e.g. Annual checkup" />
        </div>
        ${renderPickerField(t('dateLabel'), 'f_date', 'date')}
        ${renderPickerField(t('timeSlotLabel'), 'f_time', 'time')}
        <div class="form-group">
          <label class="form-label">${t('vetClinicLabel')}</label>
          <input class="form-input" id="f_vet" placeholder="e.g. Happy Paws Clinic" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('notesLabel')}</label>
          <textarea class="form-textarea" id="f_notes" placeholder="${t('notesPlaceholder')}"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="vets">${t('save')}</button>
        </div>
      `;
    }

    if (type === 'add_favorites') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">${t('addFavoriteTitle')}</div>
        <div class="form-group">
          <label class="form-label">${t('itemLabel')}</label>
          <input class="form-input" id="f_item" placeholder="e.g. Tennis ball, squeaky toy" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('notesLabel')}</label>
          <textarea class="form-textarea" id="f_notes" placeholder="${t('optionalDetails')}"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="favorites">${t('save')}</button>
        </div>
      `;
    }

    if (type === 'add_allergies') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">${t('addAllergyTitle')}</div>
        <div class="form-group">
          <label class="form-label">${t('allergenLabel')}</label>
          <input class="form-input" id="f_allergen" placeholder="e.g. Chicken, Dairy" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('reactionLabel')}</label>
          <input class="form-input" id="f_reaction" placeholder="e.g. Itching, Upset stomach" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('notesLabel')}</label>
          <textarea class="form-textarea" id="f_notes" placeholder="${t('additionalInfo')}"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
          <button class="btn-primary" data-action="save-entry" data-entry-key="allergies">${t('save')}</button>
        </div>
      `;
    }

    if (type === 'addWeight') {
      return `
        <div class="modal-handle"></div>
        <div class="modal-title">${t('addWeightTitle')}</div>
        <div class="form-group">
          <label class="form-label">${t('weightKgLabel')}</label>
          <input class="form-input" id="f_weight" type="number" step="0.1" placeholder="e.g. 12.5" />
        </div>
        ${renderPickerField(t('dateLabel'), 'f_date', 'date', new Date().toISOString().split('T')[0])}
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
          <button class="btn-primary" data-action="save-weight">${t('save')}</button>
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
        <div class="modal-title">${t('editPetTitle', { name: pet.name })}</div>
        <div class="form-group">
          <label class="form-label">${t('nameLabel')}</label>
          <input class="form-input" id="f_name" value="${pet.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('breedOptional')}</label>
          <input class="form-input" id="f_breed" value="${pet.breed || ''}" />
        </div>
        ${renderPickerField(t('birthdayOptional'), 'f_birthday', 'date', pet.birthday || '')}
        <div class="form-group">
          <label class="form-label">${t('pickEmoji')}</label>
          <div class="emoji-picker">${emojiButtons}</div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
          <button class="btn-primary" data-action="update-pet">${t('save')}</button>
        </div>
        <div class="modal-danger-zone">
          <button class="btn-text-link" data-action="confirm-delete-pet">${t('removePetLink', { name: pet.name })}</button>
        </div>
      `;
    }

    return '';
  }

  window.PetbookModals = { getModalContent };
})();
