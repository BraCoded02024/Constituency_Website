'use strict';

const SURVEY_STATUSES = ['Supporting', 'Not Supporting', 'Floating'];
const SURVEY_CONFIDENCES = ['High', 'Medium', 'Low'];
const DELEGATE_STATUSES = ['Active', 'Inactive', 'Suspended'];
const GENDERS = ['Male', 'Female', 'Other'];

/** Descriptive groupings of surveyed delegates in an electoral area. */
const AREA_CLASS_THRESHOLDS = {
  supportingStrong: 50,
  notSupportingAttention: 25,
  floatingPersuasion: 18,
};

function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function classifyElectoralArea({ surveyed, supporting, notSupporting, floating }) {
  if (!surveyed) return ['Not surveyed'];
  const labels = [];
  if (pct(supporting, surveyed) >= AREA_CLASS_THRESHOLDS.supportingStrong) labels.push('Strong');
  if (pct(notSupporting, surveyed) >= AREA_CLASS_THRESHOLDS.notSupportingAttention) labels.push('Needs attention');
  if (pct(floating, surveyed) >= AREA_CLASS_THRESHOLDS.floatingPersuasion) labels.push('Persuasion');
  return labels.length ? labels : ['Unclassified'];
}

module.exports = {
  SURVEY_STATUSES,
  SURVEY_CONFIDENCES,
  DELEGATE_STATUSES,
  GENDERS,
  AREA_CLASS_THRESHOLDS,
  pct,
  classifyElectoralArea,
};
