function constituent(r) {
  if (!r) return r;
  return {
    id: r.id,
    fullName: r.full_name,
    phone: r.phone,
    email: r.email,
    community: r.community,
    age: r.age,
    gender: r.gender,
    occupation: r.occupation,
    registeredAt: r.registered_at,
  };
}

function volunteer(r) {
  if (!r) return r;
  return {
    id: r.id,
    fullName: r.full_name,
    phone: r.phone,
    email: r.email,
    community: r.community,
    skills: r.skills,
    availability: r.availability,
    registeredAt: r.registered_at,
  };
}

function concernResponse(r) {
  if (!r) return r;
  return {
    id: r.id,
    message: r.message,
    respondedBy: r.responded_by,
    respondedAt: r.responded_at,
  };
}

function project(r) {
  if (!r) return r;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    progress: r.progress,
    budget: r.budget,
    startDate: r.start_date,
    endDate: r.end_date,
    contractor: r.contractor,
    category: r.category,
    image: r.image,
  };
}

function concern(r, responses) {
  if (!r) return r;
  const base = {
    id: r.id,
    name: r.name,
    phone: r.phone,
    community: r.community,
    category: r.category,
    subject: r.subject,
    description: r.description,
    status: r.status,
    submittedAt: r.submitted_at,
    priority: r.priority,
  };
  if (responses !== undefined) base.responses = responses.map(concernResponse);
  return base;
}

function electoralArea(r) {
  if (!r) return r;
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    description: r.description,
    isActive: r.is_active !== false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    stationCount: r.station_count != null ? Number(r.station_count) : undefined,
    delegateCount: r.delegate_count != null ? Number(r.delegate_count) : undefined,
    areaDelegateCount: r.area_delegate_count != null ? Number(r.area_delegate_count) : undefined,
    stationDelegateCount: r.station_delegate_count != null ? Number(r.station_delegate_count) : undefined,
    surveyed: r.surveyed != null ? Number(r.surveyed) : undefined,
    supporting: r.supporting != null ? Number(r.supporting) : undefined,
    notSupporting: r.not_supporting != null ? Number(r.not_supporting) : undefined,
    floating: r.floating != null ? Number(r.floating) : undefined,
    classifications: Array.isArray(r.classifications) ? r.classifications : undefined,
  };
}

function pollingStation(r) {
  if (!r) return r;
  return {
    id: r.id,
    electoralAreaId: r.electoral_area_id,
    electoralAreaName: r.electoral_area_name,
    name: r.name,
    code: r.code,
    description: r.description,
    isActive: r.is_active !== false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    delegateCount: r.delegate_count != null ? Number(r.delegate_count) : undefined,
  };
}

function delegateCategory(r) {
  if (!r) return r;
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    isActive: r.is_active !== false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    delegateCount: r.delegate_count != null ? Number(r.delegate_count) : undefined,
  };
}

function delegate(r, options = {}) {
  if (!r) return r;
  const includeSensitive = options.includeSensitive === true;
  return {
    id: r.id,
    delegateCode: r.delegate_code,
    fullName: r.full_name,
    address: r.address,
    gender: r.gender,
    ghanaCard: includeSensitive ? r.ghana_card : undefined,
    votersId: includeSensitive ? r.voters_id : undefined,
    pollingStationName: r.polling_station_name,
    pollingStationCode: r.polling_station_code,
    phone: r.phone,
    email: r.email,
    community: r.community,
    status: r.status,
    registeredAt: r.registered_at,
    electoralAreaId: r.electoral_area_id,
    electoralAreaName: r.electoral_area_name,
    pollingStationId: r.polling_station_id,
    pollingStationLabel: r.polling_station_label,
    categoryId: r.category_id,
    categoryName: r.category_name,
    age: r.age != null ? Number(r.age) : null,
    level: r.level || null,
    position: r.position || null,
    isFlagged: r.is_flagged === true || r.is_flagged === 1,
    sourceNo: r.source_no != null ? Number(r.source_no) : null,
    currentStatus: r.current_status,
    currentConfidence: r.current_confidence,
    lastContactedAt: r.last_contacted_at,
    nextFollowUpAt: r.next_follow_up_at,
    notes: r.notes,
    isActive: r.is_active !== false && r.is_active !== 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function surveyRecord(r) {
  if (!r) return r;
  return {
    id: r.id,
    delegateId: r.delegate_id,
    status: r.status,
    confidence: r.confidence,
    lastContactedAt: r.last_contacted_at,
    nextFollowUpAt: r.next_follow_up_at,
    notes: r.notes,
    createdBy: r.created_by,
    createdByName: r.created_by_name,
    createdAt: r.created_at,
  };
}

function activityLog(r) {
  if (!r) return r;
  let metadata = r.metadata;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      metadata = null;
    }
  }
  return {
    id: r.id,
    actorId: r.actor_id,
    actorName: r.actor_name,
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id,
    metadata,
    createdAt: r.created_at,
  };
}

module.exports = {
  constituent,
  volunteer,
  project,
  concern,
  concernResponse,
  electoralArea,
  pollingStation,
  delegateCategory,
  delegate,
  surveyRecord,
  activityLog,
};
