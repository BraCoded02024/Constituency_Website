const express = require('express');
const router = express.Router();
const { getDb } = require('../data/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/stats', authenticateToken, async (req, res) => {
  const db = getDb();

  const count = async (table, where) => {
    const sql = where ? `SELECT COUNT(*) as c FROM ${table} WHERE ${where}` : `SELECT COUNT(*) as c FROM ${table}`;
    const { rows } = await db.query(sql);
    return parseInt(rows[0].c);
  };

  const regRows = (await db.query('SELECT * FROM constituents ORDER BY registered_at DESC LIMIT 5')).rows;
  const recentRegistrations = regRows.map(r => ({
    id: r.id,
    fullName: r.full_name,
    phone: r.phone,
    email: r.email,
    community: r.community,
    age: r.age,
    gender: r.gender,
    occupation: r.occupation,
    registeredAt: r.registered_at,
  }));

  const concernRowsRecent = (await db.query('SELECT * FROM concerns ORDER BY submitted_at DESC LIMIT 5')).rows;
  const recentConcerns = concernRowsRecent.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    community: c.community,
    category: c.category,
    subject: c.subject,
    description: c.description,
    status: c.status,
    priority: c.priority,
    submittedAt: c.submitted_at,
  }));
  const projectProgress = (await db.query('SELECT id, title, progress, status FROM projects')).rows;

  const concernRows = (await db.query('SELECT category, COUNT(*) as count FROM concerns GROUP BY category')).rows;
  const concernsByCategory = {};
  for (const r of concernRows) concernsByCategory[r.category] = parseInt(r.count);

  const communityRows = (await db.query('SELECT community, COUNT(*) as count FROM constituents GROUP BY community')).rows;
  const communityDistribution = {};
  for (const r of communityRows) communityDistribution[r.community] = parseInt(r.count);

  res.json({
    totalConstituents: await count('constituents'),
    totalDelegates: await count('delegates'),
    totalConcerns: await count('concerns'),
    pendingConcerns: await count('concerns', "status = 'Pending'"),
    inProgressConcerns: await count('concerns', "status = 'In Progress'"),
    resolvedConcerns: await count('concerns', "status = 'Resolved'"),
    underReviewConcerns: await count('concerns', "status = 'Under Review'"),
    totalProjects: await count('projects'),
    completedProjects: await count('projects', "status = 'Completed'"),
    ongoingProjects: await count('projects', "status = 'In Progress'"),
    planningProjects: await count('projects', "status = 'Planning'"),
    totalOpportunities: await count('opportunities'),
    totalEvents: await count('events'),
    totalVolunteers: await count('volunteers'),
    totalAnnouncements: await count('announcements'),
    totalGalleryItems: await count('gallery'),
    totalSuccessStories: await count('success_stories'),
    totalServices: await count('services'),
    recentRegistrations,
    recentConcerns,
    projectProgress,
    concernsByCategory,
    communityDistribution,
  });
});

module.exports = router;
