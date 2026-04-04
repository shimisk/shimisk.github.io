(function initPetbookI18n() {
  const LANGUAGE_STORAGE_KEY = 'petbook_language';

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' }
  ];

  const DICTIONARY = {
    en: {
      appTitle: 'Petbook',
      navCare: 'Care',
      navSchedule: 'Schedule',
      navHealth: 'Health',
      openStore: 'Open Store',
      sendFeedback: 'Send Feedback',
      settingsButton: 'Settings',

      settingsTitle: 'Settings ⚙️',
      languageLabel: 'Language',
      languageHelp: 'Choose your display language.',

      medicineRemindersTitle: 'Medicine reminders',
      medicineRemindersSubtitle: 'Due and overdue medicine alerts',
      vetRemindersTitle: 'Vet appointment reminders',
      vetRemindersSubtitle: 'Due and overdue appointment alerts',

      permissionGranted: 'Notifications are enabled.',
      permissionDenied: 'Notifications are blocked in browser settings.',
      permissionDefault: 'Allow notifications to receive reminders.',
      enableNotifications: 'Enable notifications',
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      on: 'ON',
      off: 'OFF',

      welcomeTitle: 'Welcome to Petbook',
      welcomeCopy: 'Add your first pet to start tracking their care routine.',
      addPetCta: '+ Add a Pet',
      addChip: 'Add',
      share: 'Share',
      editPet: 'Edit pet',

      sectionMedicine: 'Medicine',
      sectionFeeding: 'Feeding',
      sectionRoutine: 'Walks & Routine',
      sectionFavorites: 'Favorite Toys & Things',
      sectionAllergies: 'Allergies',
      sectionVetAppointments: 'Vet Appointments',
      sectionWeightLog: 'Weight Log',
      nothingAddedYet: 'Nothing added yet.',
      addEntry: '+ Add entry',
      addWeight: '+ Add weight',
      noWeightInRange: 'No weight entries in this range yet.',
      noWeightYet: 'No weight entries yet.',
      upcomingAppointments: 'Upcoming appointments',
      healthWeightMeta: 'Health & weight log',
      timeLabel: 'Time',
      nextLabel: 'Next',
      atLabel: 'at',
      unitMinutes: 'min',
      causesLabel: 'causes',

      addPetTitle: 'Add a Pet 🐾',
      editPetTitle: 'Edit {name}',
      nameLabel: 'Name',
      typeLabel: 'Type',
      breedOptional: 'Breed (optional)',
      birthdayOptional: 'Birthday (optional)',
      pickEmoji: 'Pick an emoji',
      addPetButton: 'Add Pet',
      removePetLink: 'Remove {name} from Petbook',

      addMedicineTitle: 'Add Medicine 💊',
      medicineNameLabel: 'Medicine name',
      doseLabel: 'Dose',
      frequencyLabel: 'Frequency',
      notesLabel: 'Notes',
      notesPlaceholder: 'Any additional info...',

      addFeedingTitle: 'Add Feeding 🍽️',
      foodLabel: 'Food',
      amountLabel: 'Amount',

      addRoutineTitle: 'Add Routine 🦮',
      activityLabel: 'Activity',
      durationMinutes: 'Duration (minutes)',

      addVetTitle: 'Add Vet Appointment 🏥',
      reasonLabel: 'Reason',
      dateLabel: 'Date',
      timeSlotLabel: 'Time slot',
      vetClinicLabel: 'Vet / Clinic',

      addFavoriteTitle: 'Add Favorite Toy/Thing 🎾',
      itemLabel: 'Item',
      optionalDetails: 'Optional details...',

      addAllergyTitle: 'Add Allergy ⚠️',
      allergenLabel: 'Allergen',
      reactionLabel: 'Reaction',
      additionalInfo: 'Additional info...',

      addWeightTitle: 'Log Weight ⚖️',
      weightKgLabel: 'Weight (kg)',

      selectDate: 'Select date',
      selectTime: 'Select time',

      daily: 'Daily',
      every2Days: 'Every 2 days',
      weekly: 'Weekly',
      monthly: 'Monthly',
      every3Months: 'Every 3 months',
      asNeeded: 'As needed',
      rangeWeek: 'Week',
      rangeMonth: 'Month',
      rangeYear: 'Year',

      petTypeDog: 'Dog',
      petTypeCat: 'Cat',
      petTypeRabbit: 'Rabbit',
      petTypeHamster: 'Hamster',
      petTypeBird: 'Bird',
      petTypeFish: 'Fish',
      petTypeTurtle: 'Turtle',
      petTypeOther: 'Other',

      removePetConfirmTitle: 'Remove {name}? 🗑️',
      removePetConfirmCopy: 'This will delete all of {name}\'s data permanently. This cannot be undone.',
      yesRemove: 'Yes, remove',

      toastLanguageUpdated: 'Language updated.',
      toastEnableNotificationsFirst: 'Enable notifications first to change reminder toggles.',
      toastNotificationUnsupported: 'Notifications are not supported in this browser.',
      toastInstallForIOSNotifications: 'On iPhone/iPad, install Petbook to Home Screen to enable notifications.',
      toastNotificationsEnabled: 'Notifications enabled.',
      toastNotificationsNotEnabled: 'Notifications were not enabled.',
      toastSettingsUpdated: 'Settings updated.',
      toastEnterName: 'Please enter a name',
      toastPetRemoved: '👋 {name} removed.',
      toastPetUpdated: '✓ {name} updated!',
      toastPetAdded: '🐾 {name} added!',
      toastSaved: 'Saved!',
      toastFillAllFields: 'Please fill all fields',
      toastWeightLogged: 'Weight logged!',

      notificationMedicineTitle: '{name}: Medicine reminder',
      notificationMedicineBody: '{medicine} is due{detail}.',
      notificationVetTitle: '{name}: Vet appointment reminder',
      notificationVetBody: '{reason} is due{detail}.',

      shareMedicineHeader: '*💊 Medicine*',
      shareFeedingHeader: '*🍽️ Feeding*',
      shareRoutineHeader: '*🦮 Routine*',
      shareVetsHeader: '*🏥 Vet Appointments*',
      shareFavoritesHeader: '*🎾 Favorite Toys & Things*',
      shareAllergiesHeader: '*⚠️ Allergies*',
      sharedFrom: '_Shared from Petbook 🐾_'
    },
    ja: {
      appTitle: 'Petbook',
      navCare: 'ケア',
      navSchedule: '予定',
      navHealth: '健康',
      openStore: 'ストアを開く',
      sendFeedback: 'フィードバック送信',
      settingsButton: '設定',

      settingsTitle: '設定 ⚙️',
      languageLabel: '言語',
      languageHelp: '表示言語を選択できます。',

      medicineRemindersTitle: '薬のリマインダー',
      medicineRemindersSubtitle: '期限到来・期限超過の薬アラート',
      vetRemindersTitle: '通院リマインダー',
      vetRemindersSubtitle: '期限到来・期限超過の通院アラート',

      permissionGranted: '通知は有効です。',
      permissionDenied: '通知はブラウザ設定でブロックされています。',
      permissionDefault: 'リマインダーを受け取るには通知を許可してください。',
      enableNotifications: '通知を有効にする',
      close: '閉じる',
      cancel: 'キャンセル',
      save: '保存',
      on: 'オン',
      off: 'オフ',

      welcomeTitle: 'Petbookへようこそ',
      welcomeCopy: '最初のペットを追加してケア管理を始めましょう。',
      addPetCta: '+ ペットを追加',
      addChip: '追加',
      share: '共有',
      editPet: 'ペットを編集',

      sectionMedicine: '薬',
      sectionFeeding: '食事',
      sectionRoutine: '散歩・ルーティン',
      sectionFavorites: 'お気に入りのおもちゃ・好きなもの',
      sectionAllergies: 'アレルギー',
      sectionVetAppointments: '通院予定',
      sectionWeightLog: '体重ログ',
      nothingAddedYet: 'まだ追加されていません。',
      addEntry: '+ 追加',
      addWeight: '+ 体重を追加',
      noWeightInRange: 'この期間の体重記録はありません。',
      noWeightYet: '体重記録はまだありません。',
      upcomingAppointments: '今後の予定',
      healthWeightMeta: '健康・体重ログ',
      timeLabel: '時間',
      nextLabel: '次回',
      atLabel: 'の',
      unitMinutes: '分',
      causesLabel: '症状',

      addPetTitle: 'ペットを追加 🐾',
      editPetTitle: '{name}を編集',
      nameLabel: '名前',
      typeLabel: '種類',
      breedOptional: '品種（任意）',
      birthdayOptional: '誕生日（任意）',
      pickEmoji: '絵文字を選択',
      addPetButton: 'ペットを追加',
      removePetLink: '{name}をPetbookから削除',

      addMedicineTitle: '薬を追加 💊',
      medicineNameLabel: '薬の名前',
      doseLabel: '用量',
      frequencyLabel: '頻度',
      notesLabel: 'メモ',
      notesPlaceholder: '追加情報...',

      addFeedingTitle: '食事を追加 🍽️',
      foodLabel: 'フード',
      amountLabel: '量',

      addRoutineTitle: 'ルーティンを追加 🦮',
      activityLabel: 'アクティビティ',
      durationMinutes: '時間（分）',

      addVetTitle: '通院予定を追加 🏥',
      reasonLabel: '理由',
      dateLabel: '日付',
      timeSlotLabel: '時間帯',
      vetClinicLabel: '病院 / クリニック',

      addFavoriteTitle: 'お気に入りを追加 🎾',
      itemLabel: '項目',
      optionalDetails: '任意の詳細...',

      addAllergyTitle: 'アレルギーを追加 ⚠️',
      allergenLabel: 'アレルゲン',
      reactionLabel: '反応',
      additionalInfo: '追加情報...',

      addWeightTitle: '体重を記録 ⚖️',
      weightKgLabel: '体重 (kg)',

      selectDate: '日付を選択',
      selectTime: '時間を選択',

      daily: '毎日',
      every2Days: '2日ごと',
      weekly: '毎週',
      monthly: '毎月',
      every3Months: '3か月ごと',
      asNeeded: '必要時',
      rangeWeek: '週',
      rangeMonth: '月',
      rangeYear: '年',

      petTypeDog: '犬',
      petTypeCat: '猫',
      petTypeRabbit: 'うさぎ',
      petTypeHamster: 'ハムスター',
      petTypeBird: '鳥',
      petTypeFish: '魚',
      petTypeTurtle: 'カメ',
      petTypeOther: 'その他',

      removePetConfirmTitle: '{name}を削除しますか？ 🗑️',
      removePetConfirmCopy: '{name}のデータはすべて完全に削除されます。元に戻せません。',
      yesRemove: '削除する',

      toastLanguageUpdated: '言語を更新しました。',
      toastEnableNotificationsFirst: '通知を有効にするとリマインダー切替が使えます。',
      toastNotificationUnsupported: 'このブラウザは通知に対応していません。',
      toastInstallForIOSNotifications: 'iPhone/iPadでは、ホーム画面に追加すると通知を有効にできます。',
      toastNotificationsEnabled: '通知を有効にしました。',
      toastNotificationsNotEnabled: '通知は有効になりませんでした。',
      toastSettingsUpdated: '設定を更新しました。',
      toastEnterName: '名前を入力してください',
      toastPetRemoved: '👋 {name}を削除しました。',
      toastPetUpdated: '✓ {name}を更新しました！',
      toastPetAdded: '🐾 {name}を追加しました！',
      toastSaved: '保存しました！',
      toastFillAllFields: 'すべての項目を入力してください',
      toastWeightLogged: '体重を記録しました！',

      notificationMedicineTitle: '{name}: 薬のリマインダー',
      notificationMedicineBody: '{medicine}の時間です{detail}。',
      notificationVetTitle: '{name}: 通院リマインダー',
      notificationVetBody: '{reason}の予定です{detail}。',

      shareMedicineHeader: '*💊 薬*',
      shareFeedingHeader: '*🍽️ 食事*',
      shareRoutineHeader: '*🦮 ルーティン*',
      shareVetsHeader: '*🏥 通院予定*',
      shareFavoritesHeader: '*🎾 お気に入り*',
      shareAllergiesHeader: '*⚠️ アレルギー*',
      sharedFrom: '_Petbookから共有 🐾_'
    }
  };

  function normalizeLanguage(value) {
    const tag = (value || '').toLowerCase();
    if (tag.startsWith('ja')) {
      return 'ja';
    }
    return 'en';
  }

  function readSavedLanguage() {
    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) || '';
    } catch (_err) {
      return '';
    }
  }

  function writeSavedLanguage(value) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
    } catch (_err) {}
  }

  let currentLanguage = normalizeLanguage(readSavedLanguage() || navigator.language || navigator.userLanguage || 'en');

  function setLanguage(nextLanguage, persist) {
    currentLanguage = normalizeLanguage(nextLanguage);
    if (persist !== false) {
      writeSavedLanguage(currentLanguage);
    }
    return currentLanguage;
  }

  function getLanguage() {
    return currentLanguage;
  }

  function t(key, vars) {
    const template = DICTIONARY[currentLanguage]?.[key] || DICTIONARY.en[key] || key;
    if (!vars || typeof template !== 'string') {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, (_match, token) => {
      if (Object.prototype.hasOwnProperty.call(vars, token)) {
        return String(vars[token]);
      }
      return `{${token}}`;
    });
  }

  window.PetbookI18n = {
    LANGUAGES: LANGUAGES.slice(),
    setLanguage,
    getLanguage,
    t
  };
})();
