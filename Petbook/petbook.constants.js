window.PetbookConstants = {
  EMOJIS: ['🐶', '🐱', '🐰', '🐹', '🐸', '🐦', '🐠', '🐢', '🦜', '🐾', '🦴'],
  PET_TYPES: ['Dog', 'Cat', 'Rabbit', 'Hamster', 'Bird', 'Fish', 'Turtle', 'Other'],
  TAB_ORDER: ['care', 'schedule', 'health'],
  WEIGHT_RANGE_LABELS: {
    week: 'Week',
    month: 'Month',
    year: 'Year'
  },
  SECTION_ICON_CLASSES: {
    medicines: 'section-icon-medicines',
    feeding: 'section-icon-feeding',
    routine: 'section-icon-routine',
    vets: 'section-icon-vets',
    favorites: 'section-icon-favorites',
    allergies: 'section-icon-allergies'
  },
  ENTRY_FIELDS: {
    medicines: { name: 'f_name', dose: 'f_dose', frequency: 'f_freq', time: 'f_time', notes: 'f_notes' },
    feeding: { time: 'f_time', food: 'f_food', amount: 'f_amount', notes: 'f_notes' },
    routine: { name: 'f_name', time: 'f_time', duration: 'f_duration', notes: 'f_notes' },
    vets: { reason: 'f_reason', date: 'f_date', time: 'f_time', vet: 'f_vet', notes: 'f_notes' },
    favorites: { item: 'f_item', notes: 'f_notes' },
    allergies: { allergen: 'f_allergen', reaction: 'f_reaction', notes: 'f_notes' }
  }
};
