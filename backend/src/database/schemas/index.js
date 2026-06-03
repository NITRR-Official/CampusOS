/**
 * Core Schemas Index
 * Centralized export of core backend Mongoose schemas.
 * Feature schemas (e.g. Vendor, Event) are managed by their respective plugins.
 */

export { User } from './user.schema.js';
export { Plugin } from './plugin.schema.js';

export default {
  User: () => import('./user.schema.js').then((m) => m.User),
  Plugin: () => import('./plugin.schema.js').then((m) => m.Plugin)
};
