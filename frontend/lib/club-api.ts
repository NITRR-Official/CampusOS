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
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  createdAt: string;
}

// TOGGLE THIS FLAG TO SWITCH BETWEEN MOCK AND REAL API
const USE_MOCK_DATA = true;

const INITIAL_MOCK_CLUBS: Club[] = [
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

function getMockClubs(): Club[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('MOCK_CLUBS');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('MOCK_CLUBS', JSON.stringify(INITIAL_MOCK_CLUBS));
  }
  return INITIAL_MOCK_CLUBS;
}

function saveMockClubs(clubs: Club[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('MOCK_CLUBS', JSON.stringify(clubs));
  }
}

export async function fetchClubs(
  status?: 'active' | 'pending' | 'rejected'
): Promise<Club[]> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    let clubs = getMockClubs();
    if (status) {
      clubs = clubs.filter((c) => c.status === status);
    }
    return clubs;
  }

  const query = status ? `?status=${status}` : '';
  return apiClient.get(`/clubs${query}`);
}

export async function fetchClubBySlug(slug: string): Promise<Club | null> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getMockClubs().find((c) => c.slug === slug) || null;
  }

  return apiClient.get(`/clubs/${slug}`);
}

export async function createClub(payload: Partial<Club>): Promise<Club> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const clubs = getMockClubs();
    const newClub: Club = {
      id: `c${clubs.length + 1}`,
      name: payload.name || '',
      slug: (payload.name || '').toLowerCase().replace(/ /g, '-'),
      description: payload.description || '',
      category: payload.category || 'General',
      memberCount: 1,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    clubs.push(newClub);
    saveMockClubs(clubs);
    return newClub;
  }
  return apiClient.post('/clubs', payload);
}

export async function approveClub(id: string): Promise<Club> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const clubs = getMockClubs();
    const club = clubs.find((c) => c.id === id);
    if (club) {
      club.status = 'active';
      saveMockClubs(clubs);
    }
    return club as Club;
  }
  return apiClient.patch(`/clubs/${id}/approve`, {});
}

export async function rejectClub(id: string): Promise<Club> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const clubs = getMockClubs();
    const club = clubs.find((c) => c.id === id);
    if (club) {
      club.status = 'rejected';
      saveMockClubs(clubs);
    }
    return club as Club;
  }
  return apiClient.patch(`/clubs/${id}/reject`, {});
}
