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

module.exports = { constituent, volunteer, project, concern, concernResponse };
