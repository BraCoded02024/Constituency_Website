export interface Delegate {
  id: string;
  delegateCode?: string | null;
  fullName: string;
  address: string | null;
  gender: string | null;
  ghanaCard: string | null;
  votersId: string | null;
  pollingStationName: string | null;
  pollingStationCode: string | null;
  phone: string | null;
  email: string | null;
  community: string | null;
  status: string;
  registeredAt: string;
  electoralAreaId?: string | null;
  electoralAreaName?: string | null;
  pollingStationId?: string | null;
  pollingStationLabel?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  age?: number | null;
  level?: string | null;
  position?: string | null;
  isFlagged?: boolean;
  sourceNo?: number | null;
  currentStatus?: string | null;
  currentConfidence?: string | null;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
  notes?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ElectoralArea {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  stationCount?: number;
  delegateCount?: number;
  areaDelegateCount?: number;
  stationDelegateCount?: number;
  surveyed?: number;
  supporting?: number;
  notSupporting?: number;
  floating?: number;
  classifications?: string[];
}

export interface PollingStation {
  id: string;
  electoralAreaId: string;
  electoralAreaName?: string | null;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  delegateCount?: number;
}

export interface DelegateCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  delegateCount?: number;
}

export interface SurveyRecord {
  id: string;
  delegateId: string;
  status: string;
  confidence: string;
  lastContactedAt: string;
  nextFollowUpAt: string | null;
  notes: string | null;
  createdBy: string | null;
  createdByName?: string | null;
  createdAt: string;
}

export interface DelegatesPageResult {
  data: Delegate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;
export const STATUS_OPTIONS = ['Active', 'Inactive', 'Suspended'] as const;
export const SURVEY_STATUS_OPTIONS = ['Supporting', 'Not Supporting', 'Floating'] as const;

export const emptyDelegateForm = {
  fullName: '',
  address: '',
  gender: '',
  ghanaCard: '',
  votersId: '',
  pollingStationName: '',
  pollingStationCode: '',
  phone: '',
  email: '',
  community: '',
  status: 'Active',
  electoralAreaId: '',
  pollingStationId: '',
  categoryId: '',
  notes: '',
};

export type DelegateFormState = typeof emptyDelegateForm;

const GHANA_CARD_RE = /^GHA-\d{9}-\d$/;
const VOTERS_ID_RE = /^\d{10}$/;
const POLLING_CODE_RE = /^[A-Z0-9]{4,12}$/i;
const PHONE_RE = /^0[2-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDelegateForm(form: DelegateFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.fullName.trim()) errors.fullName = 'Full name is required';
  if (form.ghanaCard && !GHANA_CARD_RE.test(form.ghanaCard)) errors.ghanaCard = 'Format: GHA-XXXXXXXXX-X';
  if (form.votersId && !VOTERS_ID_RE.test(form.votersId)) errors.votersId = 'Must be exactly 10 digits';
  if (form.pollingStationCode && !POLLING_CODE_RE.test(form.pollingStationCode)) {
    errors.pollingStationCode = '4–12 alphanumeric characters';
  }
  if (form.phone && !PHONE_RE.test(form.phone.replace(/[\s-]/g, ''))) errors.phone = 'e.g. 0241234567';
  if (form.email && !EMAIL_RE.test(form.email)) errors.email = 'Invalid email';
  return errors;
}

export function delegateToForm(d: Delegate): DelegateFormState {
  return {
    fullName: d.fullName || '',
    address: d.address || '',
    gender: d.gender || '',
    ghanaCard: d.ghanaCard || '',
    votersId: d.votersId || '',
    pollingStationName: d.pollingStationName || '',
    pollingStationCode: d.pollingStationCode || '',
    phone: d.phone || '',
    email: d.email || '',
    community: d.community || '',
    status: d.status || 'Active',
    electoralAreaId: d.electoralAreaId || '',
    pollingStationId: d.pollingStationId || '',
    categoryId: d.categoryId || '',
    notes: d.notes || '',
  };
}

export function formToPayload(form: DelegateFormState): Record<string, unknown> {
  return {
    fullName: form.fullName.trim(),
    address: form.address || null,
    gender: form.gender || null,
    ghanaCard: form.ghanaCard || null,
    votersId: form.votersId || null,
    pollingStationName: form.pollingStationName || null,
    pollingStationCode: form.pollingStationCode || null,
    phone: form.phone || null,
    email: form.email || null,
    community: form.community || null,
    status: form.status || 'Active',
    electoralAreaId: form.electoralAreaId || null,
    pollingStationId: form.pollingStationId || null,
    categoryId: form.categoryId || null,
    notes: form.notes || null,
  };
}
