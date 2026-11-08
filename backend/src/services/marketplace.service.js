/**
 * CampusOS Community Marketplace Service (Issue #165)
 * Manages fetching, caching, and installing verified plugins from the community catalog.
 */

// Official Curated Community Catalog Fallback
export const DEFAULT_MARKETPLACE_CATALOG = [
  {
    id: 'hackathon-portal',
    name: 'Hackathon Hub',
    version: '2.0.1',
    author: 'DevClub NITRR',
    verified: true,
    category: 'Events',
    icon: 'Trophy',
    description:
      'Complete hackathon operations: team formation, submission judging, and live leaderboards.',
    tags: ['hackathon', 'teams', 'judging', 'competitions'],
    rating: 4.9,
    downloads: 3850,
    capabilities: ['db:rw', 'events:emit', 'events:listen', 'ui:slot'],
    downloadUrl:
      'https://github.com/NITRR-Official/CampusOS-Hackathon/releases/download/v2.0.1/hackathon-portal.zip',
    minCampusOsVersion: '1.0.0'
  },
  {
    id: 'alumni-tracker',
    name: 'Alumni Network',
    version: '1.1.0',
    author: 'CampusOS Core',
    verified: true,
    category: 'Club Operations',
    icon: 'GraduationCap',
    description:
      'Directory of alumni, mentorship matching, job board, and donor engagement tracking.',
    tags: ['alumni', 'mentorship', 'networking', 'careers'],
    rating: 4.8,
    downloads: 1420,
    capabilities: ['db:rw', 'events:listen'],
    downloadUrl:
      'https://github.com/NITRR-Official/CampusOS-Alumni/releases/download/v1.1.0/alumni-tracker.zip',
    minCampusOsVersion: '1.0.0'
  },
  {
    id: 'equipment-rental',
    name: 'Lab & Equipment Rental',
    version: '1.0.4',
    author: 'Robotics Club',
    verified: true,
    category: 'Utilities',
    icon: 'Wrench',
    description:
      'Manage club equipment reservations, barcode checkouts, condition checks, and return deadlines.',
    tags: ['hardware', 'equipment', 'inventory', 'booking'],
    rating: 4.7,
    downloads: 890,
    capabilities: ['db:rw', 'events:listen'],
    downloadUrl:
      'https://github.com/NITRR-Official/CampusOS-Equipment/releases/download/v1.0.4/equipment-rental.zip',
    minCampusOsVersion: '1.0.0'
  },
  {
    id: 'certificate-generator',
    name: 'Certificate Studio',
    version: '1.3.0',
    author: 'CampusOS Core',
    verified: true,
    category: 'Utilities',
    icon: 'Award',
    description:
      'Automated batch PDF certificate generator with cryptographically verifiable QR verification badges.',
    tags: ['certificates', 'pdf', 'qr', 'verification'],
    rating: 4.9,
    downloads: 5210,
    capabilities: ['db:rw', 'storage:upload'],
    downloadUrl:
      'https://github.com/NITRR-Official/CampusOS-Certificates/releases/download/v1.3.0/certificate-generator.zip',
    minCampusOsVersion: '1.0.0'
  },
  {
    id: 'attendance-kiosk',
    name: 'NFC & QR Attendance Kiosk',
    version: '1.2.2',
    author: 'Turing Society',
    verified: true,
    category: 'Events',
    icon: 'QrCode',
    description:
      'High-throughput check-in kiosk interface supporting RFID/NFC smartcards and camera QR scanning.',
    tags: ['attendance', 'nfc', 'qr', 'events'],
    rating: 4.6,
    downloads: 2130,
    capabilities: ['db:rw', 'network:outbound'],
    downloadUrl:
      'https://github.com/NITRR-Official/CampusOS-Attendance/releases/download/v1.2.2/attendance-kiosk.zip',
    minCampusOsVersion: '1.0.0'
  },
  {
    id: 'budget-planner',
    name: 'Club Treasury & Ledger',
    version: '1.0.2',
    author: 'Finance Council',
    verified: true,
    category: 'Club Operations',
    icon: 'DollarSign',
    description:
      'Ledger management, expense tracking, invoice generation, and reimbursement workflows for student organizations.',
    tags: ['finance', 'budget', 'treasury', 'reimbursement'],
    rating: 4.8,
    downloads: 1650,
    capabilities: ['db:rw'],
    downloadUrl:
      'https://github.com/NITRR-Official/CampusOS-Treasury/releases/download/v1.0.2/budget-planner.zip',
    minCampusOsVersion: '1.0.0'
  }
];

export class MarketplaceService {
  constructor(options = {}) {
    this.registry = options.registry || null;
    this.catalogCache = null;
    this.cacheExpiresAt = 0;
    this.cacheTtlMs = options.cacheTtlMs || 10 * 60 * 1000; // 10 minutes
    this.catalogUrl =
      options.catalogUrl || process.env.CAMPUSOS_MARKETPLACE_URL || null;
  }

  /**
   * Fetches the marketplace catalog with in-memory caching and fallback.
   */
  async getCatalog(options = {}) {
    const now = Date.now();

    // Check cache
    if (
      !this.catalogCache ||
      now > this.cacheExpiresAt ||
      options.forceRefresh
    ) {
      let fetched = null;

      if (this.catalogUrl) {
        try {
          const res = await fetch(this.catalogUrl, {
            headers: { 'User-Agent': 'CampusOS-Marketplace/1.0' },
            signal: AbortSignal.timeout(5000)
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              fetched = data;
            } else if (Array.isArray(data?.plugins)) {
              fetched = data.plugins;
            }
          }
        } catch (fetchErr) {
          console.warn(
            '[MarketplaceService] Notice: Remote catalog fetch failed, using curated fallback:',
            fetchErr.message
          );
        }
      }

      this.catalogCache = fetched || DEFAULT_MARKETPLACE_CATALOG;
      this.cacheExpiresAt = now + this.cacheTtlMs;
    }

    let results = [...this.catalogCache];

    // Filter by search query
    if (options.q && typeof options.q === 'string' && options.q.trim()) {
      const q = options.q.trim().toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          p.id.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (
      options.category &&
      options.category !== 'all' &&
      typeof options.category === 'string'
    ) {
      const cat = options.category.toLowerCase();
      results = results.filter((p) => p.category?.toLowerCase() === cat);
    }

    return {
      success: true,
      count: results.length,
      plugins: results
    };
  }

  /**
   * Look up a single plugin by its catalog ID.
   */
  async getPluginById(pluginId) {
    const catalog = await this.getCatalog();
    const plugin = catalog.plugins.find(
      (p) => p.id.toLowerCase() === pluginId.toLowerCase()
    );
    if (!plugin) {
      return {
        success: false,
        error: `Plugin '${pluginId}' not found in marketplace catalog`
      };
    }
    return { success: true, plugin };
  }

  /**
   * Install a plugin from the marketplace by its catalog ID.
   */
  async installPlugin(pluginId, options = {}) {
    const found = await this.getPluginById(pluginId);
    if (!found.success) {
      return { success: false, statusCode: 404, error: found.error };
    }

    const plugin = found.plugin;
    const downloadUrl = plugin.downloadUrl;

    if (!downloadUrl) {
      return {
        success: false,
        statusCode: 400,
        error: `Plugin '${pluginId}' does not specify a valid downloadUrl`
      };
    }

    // Delegate installation to registered plugin installer service
    const installer =
      this.registry?.getService('core:plugin_installer', false) ||
      options.installer;

    if (installer?.installPluginPackage) {
      return installer.installPluginPackage({
        packageUrl: downloadUrl,
        force: options.force === true
      });
    }

    return {
      success: false,
      statusCode: 500,
      error: 'Plugin installer service is not available'
    };
  }
}
