import { apiClient } from './api/client';

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  logoUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

// TOGGLE THIS FLAG TO SWITCH BETWEEN MOCK AND REAL API
const USE_MOCK_DATA = true;

const MOCK_CLUBS: Club[] = [
  {
    id: 'c1',
    name: 'Tech Innovators',
    slug: 'tech-innovators',
    description: 'A club for technology enthusiasts and builders.',
    category: 'Technology',
    memberCount: 120,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'c2',
    name: 'Cultural Committee',
    slug: 'cultural-committee',
    description: 'Organizing the biggest cultural fests on campus.',
    category: 'Cultural',
    memberCount: 250,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'c3',
    name: 'Robotics Society',
    slug: 'robotics-society',
    description: 'Building the future of automation and robotics.',
    category: 'Engineering',
    memberCount: 85,
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

export async function fetchClubs(): Promise<Club[]> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_CLUBS;
  }

  return apiClient.get('/clubs');
}

export async function fetchClubBySlug(slug: string): Promise<Club | null> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_CLUBS.find((c) => c.slug === slug) || null;
  }

  return apiClient.get(`/clubs/${slug}`);
}
