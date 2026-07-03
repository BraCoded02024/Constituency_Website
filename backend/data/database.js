const { getPoolConfig } = require('../lib/dbConfig');
const { ALL_PRIVILEGES } = require('../lib/permissions');

let pool = null;

function getDb() {
  if (!pool) {
    const { Pool } = require('pg');
    pool = new Pool(getPoolConfig());
  }
  return pool;
}

async function pingDatabase() {
  await getDb().query('SELECT 1 AS ok');
}

async function initializeDatabase() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT,
      date TEXT,
      image TEXT,
      urgent BOOLEAN DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT,
      deadline TEXT,
      requirements TEXT,
      slots INTEGER DEFAULT 0,
      applied INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Planning',
      progress INTEGER DEFAULT 0,
      budget TEXT,
      start_date TEXT,
      end_date TEXT,
      contractor TEXT,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT,
      time TEXT,
      location TEXT,
      type TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS constituents (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      community TEXT,
      age INTEGER,
      gender TEXT,
      occupation TEXT,
      registered_at TEXT
    );

    CREATE TABLE IF NOT EXISTS concerns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      community TEXT,
      category TEXT,
      subject TEXT,
      description TEXT,
      status TEXT DEFAULT 'Pending',
      submitted_at TEXT,
      priority TEXT DEFAULT 'Medium'
    );

    CREATE TABLE IF NOT EXISTS concern_responses (
      id TEXT PRIMARY KEY,
      concern_id TEXT NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
      message TEXT,
      responded_by TEXT,
      responded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS volunteers (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      community TEXT,
      skills TEXT,
      availability TEXT,
      registered_at TEXT
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      image TEXT,
      category TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS success_stories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      story TEXT,
      image TEXT,
      year TEXT
    );

    CREATE TABLE IF NOT EXISTS delegates (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      address TEXT,
      gender TEXT,
      ghana_card TEXT,
      voters_id TEXT,
      polling_station_name TEXT,
      polling_station_code TEXT,
      phone TEXT,
      email TEXT,
      community TEXT,
      status TEXT DEFAULT 'Active',
      registered_at TEXT NOT NULL
    );
  `);

  await db.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS image TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS voters_id TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS polling_station_name TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS polling_station_code TEXT');
  await db.query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS privileges TEXT DEFAULT \'[]\'');
  await db.query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true');
  await db.query(
    `UPDATE admins SET role = 'super_admin', privileges = $1 WHERE role = 'admin'`,
    [JSON.stringify(ALL_PRIVILEGES)],
  );

  await seedIfEmpty();
  console.log('Database initialized successfully');
}

async function seedIfEmpty() {
  const { rows } = await getDb().query('SELECT COUNT(*) as count FROM admins');
  if (parseInt(rows[0].count) === 0) {
    console.log('Seeding database with default data...');
    await seedAll();
  }
}

async function seedAll() {
  const bcrypt = require('bcryptjs');
  const { uuidv4 } = require('../lib/uuid');
  const client = await getDb().connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'INSERT INTO admins (id, name, email, password, role, privileges, is_active, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        uuidv4(),
        'Super Admin',
        process.env.ADMIN_EMAIL || 'admin@constituency.gov.gh',
        bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@2026', 10),
        'super_admin',
        JSON.stringify(ALL_PRIVILEGES),
        true,
        '2026-01-01',
      ],
    );

    if (process.env.VERCEL) {
      await client.query('COMMIT');
      console.log('Seeded admin user on Vercel (demo content skipped)');
      return;
    }

    const services = [
      ['Birth & Death Registration', 'Register births and deaths within the constituency. Get certified copies of certificates.', 'FileText', 'Civil Services'],
      ['Business Registration Assistance', 'Get help with registering your business, obtaining permits, and accessing government programs.', 'Briefcase', 'Business'],
      ['Educational Scholarships', 'Apply for constituency scholarships for SHS, tertiary, and vocational education.', 'GraduationCap', 'Education'],
      ['Health Insurance Support', 'Assistance with NHIS registration and renewal. Free health screenings available monthly.', 'Heart', 'Health'],
      ['Infrastructure Requests', 'Report and request infrastructure improvements — roads, water, electricity, and sanitation.', 'Building', 'Infrastructure'],
      ['Youth Employment Programs', 'Access training programs, apprenticeships, and job placement services for youth.', 'Users', 'Employment'],
    ];
    for (const s of services) {
      await client.query('INSERT INTO services (id,title,description,icon,category) VALUES ($1,$2,$3,$4,$5)', [uuidv4(), ...s]);
    }

    const announcements = [
      ['Community Health Outreach Program', 'Free health screening exercise for all constituents at the Constituency Health Center. Bring your NHIS card and a valid ID. Services include blood pressure checks, blood sugar tests, eye screening, and dental check-ups.', 'Health', '2026-04-25', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800', false],
      ['Road Construction Update - Phase 2', 'Phase 2 of the constituency road construction project begins next week. Affected areas include Main Street, Market Road, and School Lane. Please plan alternative routes during construction.', 'Infrastructure', '2026-04-20', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', true],
      ['Scholarship Applications Now Open', "The MP's Education Fund is now accepting applications for the 2026/2027 academic year. Eligible students from SHS to tertiary level can apply. Deadline: May 30, 2026.", 'Education', '2026-04-18', 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800', false],
    ];
    for (const a of announcements) {
      await client.query('INSERT INTO announcements (id,title,content,category,date,image,urgent) VALUES ($1,$2,$3,$4,$5,$6,$7)', [uuidv4(), ...a]);
    }

    const opportunities = [
      ['Youth in Agriculture Program', 'Government-backed farming initiative for youth aged 18-35. Receive training, startup kits, and mentorship in modern agricultural practices.', 'Employment', '2026-05-15', JSON.stringify(['Age 18-35', 'Resident of constituency', 'Valid Ghana Card']), 50, 23],
      ['Free ICT Training Workshop', 'Learn computer skills, digital marketing, and basic programming. Certificate provided upon completion.', 'Training', '2026-05-01', JSON.stringify(['Basic literacy', 'Must attend all sessions', 'Bring valid ID']), 100, 67],
      ['Small Business Grants', 'Micro-grants available for small business owners within the constituency. Up to GHS 5,000 per applicant.', 'Grants', '2026-06-01', JSON.stringify(['Registered business', 'Operating for 6+ months', 'Resident of constituency']), 30, 12],
      ['Community Policing Volunteer Program', 'Join the community policing initiative. Training provided by Ghana Police Service.', 'Volunteer', '2026-05-20', JSON.stringify(['Age 21+', 'No criminal record', 'Physically fit']), 40, 18],
    ];
    for (const o of opportunities) {
      await client.query('INSERT INTO opportunities (id,title,description,type,deadline,requirements,slots,applied) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [uuidv4(), ...o]);
    }

    const projects = [
      ['Constituency Road Rehabilitation', 'Complete rehabilitation of 15km of road network within the constituency including drainage systems.', 'In Progress', 65, 'GHS 2,500,000', '2026-01-15', '2026-08-30', 'GhanaRoads Construction Ltd', 'Infrastructure'],
      ['Community Library & ICT Center', 'Construction of a modern library and ICT center with 50 computers and high-speed internet.', 'In Progress', 40, 'GHS 800,000', '2026-02-01', '2026-09-30', 'BuildRight Ghana', 'Education'],
      ['Borehole Drilling Project', '10 new boreholes across underserved communities to provide clean drinking water.', 'Completed', 100, 'GHS 450,000', '2025-09-01', '2026-03-15', 'AquaDrill Services', 'Water & Sanitation'],
      ['Market Renovation Project', 'Renovation of the central market with new stalls, drainage, and fire safety systems.', 'Planning', 10, 'GHS 1,200,000', '2026-06-01', '2027-02-28', 'TBD', 'Commerce'],
      ['Street Lighting Installation', 'Installation of 200 solar-powered street lights across major roads and community centers.', 'In Progress', 80, 'GHS 600,000', '2025-11-01', '2026-05-30', 'SolarTech Ghana', 'Infrastructure'],
    ];
    for (const p of projects) {
      await client.query('INSERT INTO projects (id,title,description,status,progress,budget,start_date,end_date,contractor,category) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [uuidv4(), ...p]);
    }

    const events = [
      ['Town Hall Meeting', 'Quarterly town hall meeting with the MP. Share your concerns and hear updates on constituency projects.', '2026-05-02', '10:00 AM', 'Community Center Hall', 'Meeting', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'],
      ['Independence Day Celebration', "Join us for the constituency's Independence Day celebration with cultural performances and community feast.", '2026-03-06', '8:00 AM', 'Constituency Durbar Grounds', 'Celebration', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'],
      ['Youth Empowerment Summit', 'A full-day summit featuring workshops on entrepreneurship, career development, and leadership.', '2026-05-15', '9:00 AM', 'Constituency Conference Hall', 'Summit', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'],
    ];
    for (const e of events) {
      await client.query('INSERT INTO events (id,title,description,date,time,location,type,image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [uuidv4(), ...e]);
    }

    const constituents = [
      ['Kwame Asante', '0241234567', 'kwame.asante@email.com', 'Abokobi', 34, 'Male', 'Teacher', '2026-01-15'],
      ['Ama Serwah', '0551234567', 'ama.serwah@email.com', 'Pantang', 28, 'Female', 'Nurse', '2026-02-20'],
    ];
    for (const c of constituents) {
      await client.query('INSERT INTO constituents (id,full_name,phone,email,community,age,gender,occupation,registered_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [uuidv4(), ...c]);
    }

    const concerns = [
      ['Kofi Mensah', '0201234567', 'Agbogba', 'Infrastructure', 'Broken Bridge at Market Road', 'The bridge connecting Market Road to the main highway has developed cracks and is dangerous for vehicles and pedestrians.', 'Under Review', '2026-04-10', 'High'],
      ['Akua Donkor', '0271234567', 'Dome', 'Education', 'School Needs More Teachers', 'Our community school has only 3 teachers for over 300 students. Children are not getting quality education.', 'In Progress', '2026-03-25', 'Medium'],
    ];
    for (const c of concerns) {
      await client.query('INSERT INTO concerns (id,name,phone,community,category,subject,description,status,submitted_at,priority) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [uuidv4(), ...c]);
    }

    const galleryItems = [
      ['Road Construction Phase 1 Completion', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', 'Infrastructure', '2026-03-01'],
      ['Community Health Screening', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800', 'Health', '2026-02-15'],
      ['Youth Mentorship Program', 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=800', 'Education', '2026-01-20'],
      ['Town Hall Meeting', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'Governance', '2026-01-10'],
      ['Borehole Commissioning', 'https://images.unsplash.com/photo-1594398901394-4e34939a4fd0?w=800', 'Water & Sanitation', '2026-03-15'],
      ['Independence Day Celebration', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800', 'Events', '2026-03-06'],
    ];
    for (const g of galleryItems) {
      await client.query('INSERT INTO gallery (id,title,image,category,date) VALUES ($1,$2,$3,$4,$5)', [uuidv4(), ...g]);
    }

    const stories = [
      ['Abena Osei', "Thanks to the MP's scholarship fund, I was able to complete my nursing degree at KNUST. I am now a registered nurse serving my community.", 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400', '2025'],
      ['Yaw Boateng', 'The Youth in Agriculture program gave me the training and tools to start my poultry farm. I now employ 5 people from my community.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', '2025'],
      ['Efua Mensah', "The small business grant helped me expand my tailoring shop. My monthly income has tripled and I can now support my children's education.", 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', '2026'],
    ];
    for (const s of stories) {
      await client.query('INSERT INTO success_stories (id,name,story,image,year) VALUES ($1,$2,$3,$4,$5)', [uuidv4(), ...s]);
    }

    await client.query('COMMIT');
    console.log('Database seeded with default data');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

const api = { getDb, pingDatabase, initializeDatabase, closeDb };
module.exports = api;
module.exports.default = api;
