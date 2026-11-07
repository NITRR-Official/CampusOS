/**
 * CampusOS Comprehensive Database Seeder & Reset Script
 *
 * Cleans the database and populates production-grade, relational mock data across:
 * - Core Users (SuperAdmins, Club Leads, Faculty, Students) with scrypt hashes
 * - Institutes (NIT Raipur)
 * - Clubs (Approved & Pending approval for testing admin workflows)
 * - Roles & Club Memberships with hierarchical permissions
 * - Events & Event Registrations
 * - Tasks with priorities and assignees
 * - Vendors with realistic contact details
 * - Budgets & Expenses with line item breakdowns
 * - Calendar Events synced with club activities
 * - Forms & Recruitment Campaigns with applicant responses
 * - Activity Logs for admin audit trail
 * - All 16 Core Plugins enabled in DB
 */

import crypto from 'node:crypto';
import { promisify } from 'node:util';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/campusos';

async function seed() {
  console.log(
    '═══════════════════════════════════════════════════════════════'
  );
  console.log('  🌱 CampusOS Master Database Seeder');
  console.log(
    '═══════════════════════════════════════════════════════════════'
  );
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('✅ Connected to MongoDB successfully.\n');

  // 1. Clean old data completely
  console.log('🧹 Purging old collections for a fresh state...');
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    if (!col.name.startsWith('system.')) {
      await db
        .collection(col.name)
        .drop()
        .catch(() => {});
    }
  }
  console.log('✨ Database cleared.\n');

  // 2. Enable All 16 Plugins
  console.log('🔌 Registering and enabling all 16 core plugins...');
  const pluginNames = [
    'activity',
    'admin',
    'auth',
    'budget',
    'calendar',
    'checkin',
    'club',
    'event',
    'forms',
    'institute',
    'plugin-manager',
    'recruitment',
    'resource',
    'scheduling',
    'task',
    'vendor'
  ];

  const pluginDocs = pluginNames.map((name) => ({
    name,
    enabled: true,
    version: '1.0.0',
    tier: 'core',
    requestedCapabilities: ['*'],
    grantedCapabilities: ['*'],
    trusted: true,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  await db.collection('plugins').insertMany(pluginDocs);
  console.log(`✅ ${pluginDocs.length} plugins enabled in database.`);

  // 3. Seed Institute
  console.log('\n🏛️ Creating Campus Institute...');
  const instituteId = new mongoose.Types.ObjectId();
  const superAdminId = new mongoose.Types.ObjectId();

  await db.collection('institutes').insertOne({
    _id: instituteId,
    name: 'National Institute of Technology Raipur',
    code: 'NITRR',
    description:
      'Premier national technical institution located in Raipur, Chhattisgarh.',
    location: 'G.E. Road, Raipur, Chhattisgarh 492010',
    createdBy: superAdminId.toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log(
    '✅ Institute created: National Institute of Technology Raipur (NITRR)'
  );

  // 4. Seed Core Users
  console.log('\n👥 Seeding Core Platform Users & Passwords...');
  const adminPasswordHash = await hashPassword('CampusOS@Admin2026!');
  const studentPasswordHash = await hashPassword('CampusOS@2026!');

  const userIds = {
    superAdmin: superAdminId,
    ownerAdmin: new mongoose.Types.ObjectId(),
    facultyAdvisor: new mongoose.Types.ObjectId(),
    turingPresident: new mongoose.Types.ObjectId(),
    roboticsLead: new mongoose.Types.ObjectId(),
    ecellHead: new mongoose.Types.ObjectId(),
    raagaHead: new mongoose.Types.ObjectId(),
    techLead: new mongoose.Types.ObjectId(),
    prLead: new mongoose.Types.ObjectId(),
    coreMember1: new mongoose.Types.ObjectId(),
    coreMember2: new mongoose.Types.ObjectId()
  };

  const coreUsers = [
    {
      _id: userIds.superAdmin,
      name: 'Super Administrator',
      email: 'admin@campusos.local',
      passwordHash: adminPasswordHash,
      isSuperAdmin: true,
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: userIds.ownerAdmin,
      name: 'Sanskar Gupta',
      email: 'sanskar2904@gmail.com',
      passwordHash: adminPasswordHash,
      isSuperAdmin: true,
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: userIds.facultyAdvisor,
      name: 'Dr. Rajesh Sharma',
      email: 'dr.sharma@nitrr.ac.in',
      passwordHash: studentPasswordHash,
      isSuperAdmin: false,
      isActive: true,
      createdAt: new Date(Date.now() - 25 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: userIds.turingPresident,
      name: 'Aarav Sharma',
      email: 'aarav.turing@nitrr.ac.in',
      passwordHash: studentPasswordHash,
      isSuperAdmin: false,
      isActive: true,
      createdAt: new Date(Date.now() - 20 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: userIds.roboticsLead,
      name: 'Ananya Verma',
      email: 'ananya.robotics@nitrr.ac.in',
      passwordHash: studentPasswordHash,
      isSuperAdmin: false,
      isActive: true,
      createdAt: new Date(Date.now() - 20 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: userIds.ecellHead,
      name: 'Rohan Patel',
      email: 'rohan.ecell@nitrr.ac.in',
      passwordHash: studentPasswordHash,
      isSuperAdmin: false,
      isActive: true,
      createdAt: new Date(Date.now() - 15 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: userIds.raagaHead,
      name: 'Priyanshi Singh',
      email: 'priyanshi.raaga@nitrr.ac.in',
      passwordHash: studentPasswordHash,
      isSuperAdmin: false,
      isActive: true,
      createdAt: new Date(Date.now() - 15 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: userIds.techLead,
      name: 'Vikram Aditya',
      email: 'vikram.tech@nitrr.ac.in',
      passwordHash: studentPasswordHash,
      isSuperAdmin: false,
      isActive: true,
      createdAt: new Date(Date.now() - 10 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: userIds.prLead,
      name: 'Sneha Roy',
      email: 'sneha.pr@nitrr.ac.in',
      passwordHash: studentPasswordHash,
      isSuperAdmin: false,
      isActive: true,
      createdAt: new Date(Date.now() - 10 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: userIds.coreMember1,
      name: 'Ishaan Shukla',
      email: 'ishaan.shukla@nitrr.ac.in',
      passwordHash: studentPasswordHash,
      isSuperAdmin: false,
      isActive: true,
      createdAt: new Date(Date.now() - 8 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: userIds.coreMember2,
      name: 'Tanvi Patel',
      email: 'tanvi.patel@nitrr.ac.in',
      passwordHash: studentPasswordHash,
      isSuperAdmin: false,
      isActive: true,
      createdAt: new Date(Date.now() - 8 * 86400000),
      updatedAt: new Date()
    }
  ];

  // 15 general campus students generated via faker
  const generalStudents = [];
  for (let i = 0; i < 15; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const studentUser = {
      _id: new mongoose.Types.ObjectId(),
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@nitrr.ac.in`,
      passwordHash: studentPasswordHash,
      isSuperAdmin: false,
      isActive: true,
      createdAt: new Date(Date.now() - (i + 1) * 86400000),
      updatedAt: new Date()
    };
    generalStudents.push(studentUser);
  }

  const allUsers = [...coreUsers, ...generalStudents];
  await db.collection('users').insertMany(allUsers);
  console.log(
    `✅ Seeded ${allUsers.length} users with verified scrypt password hashes.`
  );

  // 5. Seed Clubs
  console.log('\n🏢 Seeding Campus Clubs...');
  const clubIds = {
    turing: new mongoose.Types.ObjectId(),
    robotics: new mongoose.Types.ObjectId(),
    raaga: new mongoose.Types.ObjectId(),
    ecell: new mongoose.Types.ObjectId(),
    litsoc: new mongoose.Types.ObjectId()
  };

  const clubs = [
    {
      _id: clubIds.turing,
      name: 'Turing Club of NITRR',
      slug: 'turing-club',
      email: 'turing@nitrr.ac.in',
      category: 'Coding & AI',
      status: 'approved',
      description:
        'The official Computer Science, Artificial Intelligence, and Open Source Software Developers Society of NIT Raipur.',
      createdBy: userIds.turingPresident,
      createdAt: new Date(Date.now() - 25 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: clubIds.robotics,
      name: 'Robotics & Automation Society',
      slug: 'robotics-club',
      email: 'robotics@nitrr.ac.in',
      category: 'Hardware & IoT',
      status: 'approved',
      description:
        'Center for combat robotics, autonomous rovers, drone design, and micro-controller automation engineering.',
      createdBy: userIds.roboticsLead,
      createdAt: new Date(Date.now() - 22 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: clubIds.raaga,
      name: 'Raaga - Music & Performing Arts Club',
      slug: 'raaga-music',
      email: 'raaga@nitrr.ac.in',
      category: 'Cultural & Music',
      status: 'approved',
      description:
        'The musical heartbeat of campus, featuring bands, classical orchestras, acoustic jam sessions, and audio productions.',
      createdBy: userIds.raagaHead,
      createdAt: new Date(Date.now() - 20 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: clubIds.ecell,
      name: 'Entrepreneurship Cell (E-Cell)',
      slug: 'ecell-nitrr',
      email: 'ecell@nitrr.ac.in',
      category: 'Entrepreneurship',
      status: 'pending', // Pending approval so Admin can test the Approval flow!
      description:
        'Fostering innovation, student startup incubation, pitch competitions, and angel investor networking.',
      createdBy: userIds.ecellHead,
      createdAt: new Date(Date.now() - 2 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: clubIds.litsoc,
      name: 'Literary & Debating Society',
      slug: 'litsoc-nitrr',
      email: 'litsoc@nitrr.ac.in',
      category: 'Literary & Debating',
      status: 'pending_verification',
      description:
        'Parliamentary debates, Model United Nations, creative writing workshops, and campus literary publishing.',
      createdBy: userIds.coreMember1,
      createdAt: new Date(Date.now() - 1 * 86400000),
      updatedAt: new Date()
    }
  ];

  await db.collection('clubs').insertMany(clubs);
  console.log(
    `✅ Seeded ${clubs.length} clubs (3 Approved, 1 Pending Admin Review, 1 Pending Verification).`
  );

  // 6. Seed Roles & Club Memberships
  console.log('\n🛡️ Establishing Club Hierarchical Roles & RBAC...');
  const roleDocs = [];
  const memberDocs = [];

  const clubRoleConfigs = [
    {
      clubId: clubIds.turing,
      roles: [
        {
          name: 'President',
          level: 100,
          perms: [
            'administrator',
            'event:create',
            'event:manage',
            'event:publish',
            'budget:manage',
            'member:manage',
            'task:manage',
            'recruitment:manage'
          ],
          color: '#3b82f6'
        },
        {
          name: 'Technical Lead',
          level: 70,
          perms: ['event:create', 'event:manage', 'task:manage'],
          color: '#10b981'
        },
        {
          name: 'PR & Media Head',
          level: 60,
          perms: ['event:manage', 'recruitment:manage'],
          color: '#f59e0b'
        },
        {
          name: 'Core Member',
          level: 30,
          perms: ['event:view', 'task:view', 'task:manage'],
          color: '#8b5cf6'
        },
        {
          name: 'Volunteer',
          level: 10,
          perms: ['event:view', 'task:view'],
          color: '#6b7280'
        }
      ]
    },
    {
      clubId: clubIds.robotics,
      roles: [
        {
          name: 'President',
          level: 100,
          perms: [
            'administrator',
            'event:create',
            'event:manage',
            'event:publish',
            'budget:manage',
            'member:manage',
            'task:manage'
          ],
          color: '#ef4444'
        },
        {
          name: 'Hardware Coordinator',
          level: 60,
          perms: ['event:manage', 'task:manage', 'budget:manage'],
          color: '#ec4899'
        },
        {
          name: 'Member',
          level: 10,
          perms: ['event:view', 'task:view'],
          color: '#6b7280'
        }
      ]
    },
    {
      clubId: clubIds.raaga,
      roles: [
        {
          name: 'Club Head',
          level: 100,
          perms: [
            'administrator',
            'event:create',
            'event:manage',
            'event:publish',
            'member:manage'
          ],
          color: '#8b5cf6'
        },
        {
          name: 'Band Coordinator',
          level: 50,
          perms: ['event:manage', 'task:manage'],
          color: '#06b6d4'
        }
      ]
    }
  ];

  const roleMapByClub = {};

  for (const cfg of clubRoleConfigs) {
    const cIdStr = cfg.clubId.toString();
    roleMapByClub[cIdStr] = {};

    for (const r of cfg.roles) {
      const rId = new mongoose.Types.ObjectId();
      roleMapByClub[cIdStr][r.name] = rId.toString();

      roleDocs.push({
        _id: rId,
        clubId: cIdStr,
        name: r.name,
        permissions: r.perms,
        hierarchyLevel: r.level,
        roleType: 'role',
        color: r.color,
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  await db.collection('roles').insertMany(roleDocs);
  console.log(`✅ Seeded ${roleDocs.length} customized club roles.`);

  // Memberships: Link users to clubs with appropriate roles
  const turingIdStr = clubIds.turing.toString();
  const roboticsIdStr = clubIds.robotics.toString();
  const raagaIdStr = clubIds.raaga.toString();

  // Turing Club Members
  memberDocs.push(
    // SuperAdmin also added as honorary member so workspace widgets/pages show for admin
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userIds.superAdmin.toString(),
      clubId: turingIdStr,
      roles: [roleMapByClub[turingIdStr]['President']],
      joinedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userIds.turingPresident.toString(),
      clubId: turingIdStr,
      roles: [roleMapByClub[turingIdStr]['President']],
      joinedAt: new Date(Date.now() - 25 * 86400000)
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userIds.techLead.toString(),
      clubId: turingIdStr,
      roles: [roleMapByClub[turingIdStr]['Technical Lead']],
      joinedAt: new Date(Date.now() - 20 * 86400000)
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userIds.prLead.toString(),
      clubId: turingIdStr,
      roles: [roleMapByClub[turingIdStr]['PR & Media Head']],
      joinedAt: new Date(Date.now() - 18 * 86400000)
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userIds.coreMember1.toString(),
      clubId: turingIdStr,
      roles: [roleMapByClub[turingIdStr]['Core Member']],
      joinedAt: new Date(Date.now() - 15 * 86400000)
    }
  );

  // Robotics Club Members
  memberDocs.push(
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userIds.roboticsLead.toString(),
      clubId: roboticsIdStr,
      roles: [roleMapByClub[roboticsIdStr]['President']],
      joinedAt: new Date(Date.now() - 22 * 86400000)
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userIds.coreMember2.toString(),
      clubId: roboticsIdStr,
      roles: [roleMapByClub[roboticsIdStr]['Hardware Coordinator']],
      joinedAt: new Date(Date.now() - 15 * 86400000)
    }
  );

  // Raaga Music Members
  memberDocs.push({
    _id: new mongoose.Types.ObjectId(),
    userId: userIds.raagaHead.toString(),
    clubId: raagaIdStr,
    roles: [roleMapByClub[raagaIdStr]['Club Head']],
    joinedAt: new Date(Date.now() - 20 * 86400000)
  });

  // Assign several general students as volunteers
  for (let i = 0; i < 5; i++) {
    memberDocs.push({
      _id: new mongoose.Types.ObjectId(),
      userId: generalStudents[i]._id.toString(),
      clubId: turingIdStr,
      roles: [roleMapByClub[turingIdStr]['Volunteer']],
      joinedAt: new Date(Date.now() - (i + 1) * 86400000)
    });
  }

  await db.collection('clubmembers').insertMany(memberDocs);
  console.log(`✅ Seeded ${memberDocs.length} club memberships.`);

  // 7. Seed Events & Registrations
  console.log('\n🎪 Seeding Campus Events & Registrations...');
  const eventIds = {
    hackathon: new mongoose.Types.ObjectId(),
    robowars: new mongoose.Types.ObjectId(),
    acoustic: new mongoose.Types.ObjectId(),
    pitching: new mongoose.Types.ObjectId()
  };

  const now = Date.now();
  const events = [
    {
      _id: eventIds.hackathon,
      title: 'HackNITR 2026: 36-Hour National Hackathon',
      description:
        'Central India’s largest student-driven hackathon. 36 hours of relentless innovation, mentorship from top tech leaders, and ₹2,50,000+ prize pool.',
      instituteId,
      clubId: clubIds.turing,
      createdBy: userIds.turingPresident,
      venue: 'Central Computer Center & Mega Auditorium',
      capacity: 350,
      startsAt: new Date(now + 4 * 86400000),
      endsAt: new Date(now + 6 * 86400000),
      status: 'published',
      registrationsCount: 15,
      createdAt: new Date(now - 10 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: eventIds.robowars,
      title: 'RoboWars 2026: Heavyweight Arena Combat',
      description:
        '15kg and 30kg combat robot showdown in an armored bulletproof polycarbonate battle arena with spinning blades, flippers, and wedge bots.',
      instituteId,
      clubId: clubIds.robotics,
      createdBy: userIds.roboticsLead,
      venue: 'Main Indoor Sports Complex',
      capacity: 250,
      startsAt: new Date(now + 12 * 86400000),
      endsAt: new Date(now + 13 * 86400000),
      status: 'published',
      registrationsCount: 8,
      createdAt: new Date(now - 8 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: eventIds.acoustic,
      title: 'Raaga Unplugged: Moonlight Acoustic Jam',
      description:
        'An enchanting evening of soulful acoustic melodies, guitar riffs, violin solos, and vocal harmony under the open skies.',
      instituteId,
      clubId: clubIds.raaga,
      createdBy: userIds.raagaHead,
      venue: 'Open Air Theatre (OAT)',
      capacity: 500,
      startsAt: new Date(now + 18 * 86400000),
      endsAt: new Date(now + 18 * 86400000 + 4 * 3600000),
      status: 'published',
      registrationsCount: 12,
      createdAt: new Date(now - 5 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: eventIds.pitching,
      title: 'Campus Pitch Day: Startup Showcase',
      description:
        'Pitch your breakthrough tech venture to seed investors, alumni founders, and incubation managers.',
      instituteId,
      clubId: clubIds.ecell,
      createdBy: userIds.ecellHead,
      venue: 'Executive Seminar Hall 2',
      capacity: 100,
      startsAt: new Date(now + 25 * 86400000),
      endsAt: new Date(now + 25 * 86400000 + 5 * 3600000),
      status: 'draft',
      registrationsCount: 0,
      createdAt: new Date(now - 2 * 86400000),
      updatedAt: new Date()
    }
  ];

  await db.collection('events').insertMany(events);
  console.log(`✅ Seeded ${events.length} campus events.`);

  // Event Registrations
  const registrationDocs = [];
  // Register 15 students to HackNITR
  for (let i = 0; i < 15; i++) {
    const student = generalStudents[i];
    registrationDocs.push({
      _id: new mongoose.Types.ObjectId(),
      eventId: eventIds.hackathon,
      attendeeName: student.name,
      attendeeEmail: student.email,
      userId: student._id.toString(),
      createdAt: new Date(now - (15 - i) * 3600000)
    });
  }

  // Register 8 students to RoboWars
  for (let i = 0; i < 8; i++) {
    const student = generalStudents[i];
    registrationDocs.push({
      _id: new mongoose.Types.ObjectId(),
      eventId: eventIds.robowars,
      attendeeName: student.name,
      attendeeEmail: student.email,
      userId: student._id.toString(),
      createdAt: new Date(now - (8 - i) * 3600000)
    });
  }

  await db.collection('event_registrations').insertMany(registrationDocs);
  console.log(`✅ Seeded ${registrationDocs.length} real event attendees.`);

  // 8. Seed Tasks
  console.log('\n📋 Seeding Club Tasks & Workflows...');
  const tasks = [
    {
      _id: new mongoose.Types.ObjectId(),
      clubId: turingIdStr,
      title: 'Deploy HackNITR participant judging portal',
      description:
        'Host the judging portal on AWS with GitHub OAuth and rubric rating scoring system.',
      assigneeName: 'Vikram Aditya',
      assigneeId: userIds.techLead,
      dueDate: new Date(now + 2 * 86400000),
      priority: 'high',
      status: 'in-progress',
      createdBy: userIds.turingPresident,
      dependsOn: [],
      createdAt: new Date(now - 5 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId(),
      clubId: turingIdStr,
      title: 'Finalize sponsor pitch deck & email recruiters',
      description:
        'Contact platinum and gold tier sponsor leads and attach deck v3.',
      assigneeName: 'Sneha Roy',
      assigneeId: userIds.prLead,
      dueDate: new Date(now + 1 * 86400000),
      priority: 'high',
      status: 'done',
      createdBy: userIds.turingPresident,
      dependsOn: [],
      createdAt: new Date(now - 7 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId(),
      clubId: turingIdStr,
      title: 'Distribute event badges and stickers',
      description: 'Verify 350 kits with lanyard tags and sponsor stickers.',
      assigneeName: 'Ishaan Shukla',
      assigneeId: userIds.coreMember1,
      dueDate: new Date(now + 4 * 86400000),
      priority: 'medium',
      status: 'todo',
      createdBy: userIds.techLead,
      dependsOn: [],
      createdAt: new Date(now - 2 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId(),
      clubId: roboticsIdStr,
      title: 'Procure 12mm polycarbonate safety arena sheets',
      description:
        'Inspect supplier samples for impact rating against rotating horizontal spinners.',
      assigneeName: 'Ananya Verma',
      assigneeId: userIds.roboticsLead,
      dueDate: new Date(now + 5 * 86400000),
      priority: 'high',
      status: 'in-progress',
      createdBy: userIds.roboticsLead,
      dependsOn: [],
      createdAt: new Date(now - 3 * 86400000),
      updatedAt: new Date()
    }
  ];

  await db.collection('tasks').insertMany(tasks);
  console.log(`✅ Seeded ${tasks.length} prioritized tasks.`);

  // 9. Seed Vendors
  console.log('\n💼 Seeding Campus Event Vendors...');
  const vendors = [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      clubId: turingIdStr,
      name: 'Raipur Digital Displays & Audio',
      nameLower: 'raipur digital displays & audio',
      category: 'Audio / Visual Equipment',
      contactPerson: 'Ramesh Verma',
      email: 'rentals@raipurdisplays.in',
      phone: '+91 98271 23456',
      address: 'Shop 14, City Mall Complex, G.E. Road, Raipur',
      bankDetails: {
        bank: 'State Bank of India',
        ifsc: 'SBIN0003014',
        account: '30982341234'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      clubId: turingIdStr,
      name: 'QuickPrint Merchandising & Badges',
      nameLower: 'quickprint merchandising & badges',
      category: 'Printing & Branding',
      contactPerson: 'Mahesh Dewangan',
      email: 'print@quickprintraipur.com',
      phone: '+91 94252 87654',
      address: 'Opposite NIT Gate 2, Raipur',
      bankDetails: {
        bank: 'HDFC Bank',
        ifsc: 'HDFC0001234',
        account: '50100234123'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      clubId: roboticsIdStr,
      name: 'National Steel & Metals Fabricators',
      nameLower: 'national steel & metals fabricators',
      category: 'Hardware & Fabrication',
      contactPerson: 'Sanjay Sahu',
      email: 'orders@nationalmetals.in',
      phone: '+91 77140 12345',
      address: 'Industrial Area, Bhanpuri, Raipur',
      bankDetails: {
        bank: 'Punjab National Bank',
        ifsc: 'PUNB0045600',
        account: '1234002100045'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await db.collection('vendors').insertMany(vendors);
  console.log(`✅ Seeded ${vendors.length} campus event vendors.`);

  // 10. Seed Budgets & Expenses
  console.log('\n💰 Seeding Budgets & Expense Breakdown...');
  const budgetId = new mongoose.Types.ObjectId();
  const budgets = [
    {
      _id: budgetId,
      eventId: eventIds.hackathon,
      totalAllocation: 250000,
      currency: 'INR',
      approvalStatus: 'approved',
      approvedBy: 'Dr. Rajesh Sharma (Faculty Advisor)',
      approvedDate: new Date(now - 7 * 86400000),
      notes:
        'Approved under Dean Student Welfare Annual Technical Events Fund FY26.',
      budgetBreakdown: [
        {
          category: 'Prizes & Cash Rewards',
          amount: 120000,
          description: '1st, 2nd, 3rd, and Track Winners'
        },
        {
          category: 'Food & Midnight Refreshments',
          amount: 65000,
          description: 'Meals for 350 participants across 36 hours'
        },
        {
          category: 'Swags, Badges & T-Shirts',
          amount: 40000,
          description: 'Custom printed tees, stickers, and tags'
        },
        {
          category: 'Cloud Infrastructure & Tokens',
          amount: 25000,
          description: 'API credits and server costs'
        }
      ],
      createdAt: new Date(now - 8 * 86400000),
      updatedAt: new Date()
    }
  ];

  await db.collection('budgets').insertMany(budgets);

  const expenses = [
    {
      _id: new mongoose.Types.ObjectId(),
      budgetId,
      category: 'Swags, Badges & T-Shirts',
      amount: 32000,
      description:
        'Advance payment to QuickPrint for 350 HackNITR tees and lanyards',
      submittedBy: userIds.techLead.toString(),
      receiptUrl: 'https://campusos.local/uploads/receipt-quickprint-001.pdf',
      status: 'approved',
      createdAt: new Date(now - 4 * 86400000),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId(),
      budgetId,
      category: 'Food & Midnight Refreshments',
      amount: 15000,
      description: 'Midnight energy drinks and snack boxes purchase order',
      submittedBy: userIds.turingPresident.toString(),
      receiptUrl: 'https://campusos.local/uploads/receipt-snacks-002.pdf',
      status: 'pending',
      createdAt: new Date(now - 1 * 86400000),
      updatedAt: new Date()
    }
  ];

  await db.collection('expenses').insertMany(expenses);
  console.log(
    `✅ Seeded event budget (₹2,50,000) and ${expenses.length} tracked expenses.`
  );

  // 11. Seed Calendar Events
  console.log('\n📅 Seeding Calendar Timeline & Milestones...');
  const calendarEvents = [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      title: 'HackNITR 2026: Opening Keynote & Hack Launch',
      eventType: 'event',
      startsAt: new Date(now + 4 * 86400000),
      endsAt: new Date(now + 4 * 86400000 + 3 * 3600000),
      description:
        'Official opening ceremony, problem statement release, and team pitching.',
      linkedEventId: eventIds.hackathon.toString(),
      createdBy: userIds.turingPresident.toString(),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      title: 'Judging Platform Freeze Deadline',
      eventType: 'task-deadline',
      startsAt: new Date(now + 3 * 86400000),
      endsAt: new Date(now + 3 * 86400000),
      description:
        'Strict freeze on jury rubric changes and database schema setup.',
      linkedTaskId: tasks[0]._id.toString(),
      createdBy: userIds.techLead.toString(),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      title: 'RoboWars Safety Arena Inspection',
      eventType: 'milestone',
      startsAt: new Date(now + 10 * 86400000),
      endsAt: new Date(now + 10 * 86400000 + 2 * 3600000),
      description:
        'Mandatory technical inspection of all combat bots and fail-safe kills.',
      linkedEventId: eventIds.robowars.toString(),
      createdBy: userIds.roboticsLead.toString(),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await db.collection('calendarevents').insertMany(calendarEvents);
  console.log(
    `✅ Seeded ${calendarEvents.length} calendar schedule milestones.`
  );

  // 12. Seed Forms & Recruitment Campaign
  console.log('\n📝 Seeding Forms & Recruitment Drive...');
  const formId = new mongoose.Types.ObjectId();
  const campaignId = new mongoose.Types.ObjectId();

  await db.collection('forms').insertOne({
    _id: formId,
    title: 'Turing Club Developer & Lead Recruitment 2026',
    description:
      'Apply to become an executive member or technical contributor for Turing Club.',
    entityType: 'club',
    entityId: turingIdStr,
    fields: [
      {
        id: 'q1',
        label: 'Why do you want to join Turing Club?',
        type: 'textarea',
        required: true
      },
      {
        id: 'q2',
        label: 'Primary Technical Domain',
        type: 'select',
        options: [
          'Full Stack Web',
          'AI / ML',
          'Systems & Cloud',
          'Design & UI/UX'
        ],
        required: true
      },
      {
        id: 'q3',
        label: 'GitHub or Portfolio URL',
        type: 'text',
        required: true
      }
    ],
    status: 'active',
    createdAt: new Date(now - 6 * 86400000),
    updatedAt: new Date()
  });

  await db.collection('campaigns').insertOne({
    _id: campaignId,
    title: 'Autumn Technical Induction 2026',
    description:
      'Recruiting 2nd and 3rd year engineers for core developer and project lead roles.',
    entityType: 'club',
    entityId: turingIdStr,
    formId,
    status: 'active',
    onboardRoleName: 'Volunteer',
    createdAt: new Date(now - 6 * 86400000),
    updatedAt: new Date()
  });

  // Seed 5 candidate applications
  const candidateDocs = [];
  const formResponseDocs = [];
  for (let i = 0; i < 5; i++) {
    const student = generalStudents[i];
    const respId = new mongoose.Types.ObjectId();

    formResponseDocs.push({
      _id: respId,
      formId,
      respondentEmail: student.email,
      answers: {
        q1: 'I have built multiple Next.js open source projects and want to contribute to CampusOS.',
        q2: 'Full Stack Web',
        q3: `https://github.com/${student.name.split(' ')[0].toLowerCase()}`
      },
      createdAt: new Date(now - (5 - i) * 86400000)
    });

    candidateDocs.push({
      _id: new mongoose.Types.ObjectId(),
      campaignId,
      name: student.name,
      email: student.email,
      status: i === 0 ? 'accepted' : i === 1 ? 'shortlisted' : 'applied',
      formResponseId: respId,
      createdAt: new Date(now - (5 - i) * 86400000)
    });
  }

  await db.collection('formresponses').insertMany(formResponseDocs);
  await db.collection('candidates').insertMany(candidateDocs);
  console.log(
    `✅ Seeded recruitment campaign with ${candidateDocs.length} candidate applications.`
  );

  // 13. Seed Activity Audit Logs
  console.log('\n📊 Seeding Admin Activity Audit Trail...');
  const activityLogs = [
    {
      _id: new mongoose.Types.ObjectId(),
      actorId: userIds.superAdmin,
      action: 'institute:configured',
      entityId: instituteId,
      entityType: 'Institute',
      metadata: { name: 'NITRR', status: 'active' },
      createdAt: new Date(now - 28 * 86400000)
    },
    {
      _id: new mongoose.Types.ObjectId(),
      actorId: userIds.turingPresident,
      action: 'club:created',
      entityId: clubIds.turing,
      entityType: 'Club',
      metadata: { name: 'Turing Club of NITRR' },
      createdAt: new Date(now - 25 * 86400000)
    },
    {
      _id: new mongoose.Types.ObjectId(),
      actorId: userIds.superAdmin,
      action: 'club:approved',
      entityId: clubIds.turing,
      entityType: 'Club',
      metadata: { status: 'approved' },
      createdAt: new Date(now - 24 * 86400000)
    },
    {
      _id: new mongoose.Types.ObjectId(),
      actorId: userIds.turingPresident,
      action: 'event:published',
      entityId: eventIds.hackathon,
      entityType: 'Event',
      metadata: {
        title: 'HackNITR 2026: 36-Hour National Hackathon',
        capacity: 350
      },
      createdAt: new Date(now - 10 * 86400000)
    },
    {
      _id: new mongoose.Types.ObjectId(),
      actorId: userIds.facultyAdvisor,
      action: 'budget:approved',
      entityId: budgetId,
      entityType: 'Budget',
      metadata: { amount: 250000, event: 'HackNITR 2026' },
      createdAt: new Date(now - 7 * 86400000)
    },
    {
      _id: new mongoose.Types.ObjectId(),
      actorId: userIds.ecellHead,
      action: 'club:proposal_submitted',
      entityId: clubIds.ecell,
      entityType: 'Club',
      metadata: { name: 'Entrepreneurship Cell (E-Cell)', status: 'pending' },
      createdAt: new Date(now - 2 * 86400000)
    }
  ];

  await db.collection('activitylogs').insertMany(activityLogs);
  console.log(
    `✅ Seeded ${activityLogs.length} audit log entries for Super Admin oversight.`
  );

  console.log(
    '\n═══════════════════════════════════════════════════════════════'
  );
  console.log('  🎉 Database Seeding & Reset Complete!');
  console.log(
    '═══════════════════════════════════════════════════════════════'
  );
  console.log('🔑 Login Credentials:');
  console.log(
    '   👑 Super Admin: admin@campusos.local  |  PW: CampusOS@Admin2026!'
  );
  console.log(
    '   👤 Owner Admin: sanskar2904@gmail.com  |  PW: CampusOS@Admin2026!'
  );
  console.log('   🎓 Student Leads / Faculty:           |  PW: CampusOS@2026!');
  console.log('      - Turing President:   aarav.turing@nitrr.ac.in');
  console.log('      - Robotics Lead:      ananya.robotics@nitrr.ac.in');
  console.log('      - Faculty Advisor:    dr.sharma@nitrr.ac.in');
  console.log(
    '═══════════════════════════════════════════════════════════════\n'
  );

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
