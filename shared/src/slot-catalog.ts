/**
 * CampusOS Extension Slot Catalog & Context Specification (Issue #133)
 *
 * Provides strongly-typed identifiers and context definitions for all official
 * extension points across CampusOS core pages.
 */

export type KnownSlotId =
  | 'dashboard-top'
  | 'dashboard-stats'
  | 'dashboard-actions'
  | 'dashboard-activity'
  | 'profile-tabs'
  | 'profile-header-actions'
  | 'club-header-actions'
  | 'club-tabs'
  | 'event-details-sidebar'
  | 'navbar-actions'
  | 'sidebar-bottom';

/**
 * Union type representing all valid slot IDs.
 * Allows standard catalog slots with IDE autocompletion while permitting arbitrary string IDs.
 */
export type CampusOSSlotId = KnownSlotId | (string & {});

/**
 * Expected context payload provided by core pages to mounted widgets.
 */
export interface SlotContextMap {
  'dashboard-top': { dashboard?: boolean; [key: string]: unknown };
  'dashboard-stats': { activePlugins?: string[]; [key: string]: unknown };
  'dashboard-actions': Record<string, unknown>;
  'dashboard-activity': Record<string, unknown>;
  'profile-tabs': {
    user?: {
      name?: string;
      email?: string;
      role?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  'profile-header-actions': {
    user?: { id?: string; role?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
  'club-header-actions': {
    clubId: string;
    slug?: string;
    userRole?: string;
    [key: string]: unknown;
  };
  'club-tabs': { clubId: string; slug?: string; [key: string]: unknown };
  'event-details-sidebar': { eventId: string; [key: string]: unknown };
  'navbar-actions': Record<string, unknown>;
  'sidebar-bottom': Record<string, unknown>;
  [key: string]: unknown;
}
