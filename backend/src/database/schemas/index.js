/**
 * All Schemas Index
 * Centralized export of all Mongoose schemas
 */

export { Vendor } from './vendor.schema.js';
export { Resource } from './resource.schema.js';
export { TimeSlot, Conflict } from './scheduling.schema.js';
export { Budget, Expense } from './budget.schema.js';
export { User } from './user.schema.js';

export default {
  Vendor: () => import('./vendor.schema.js').then((m) => m.Vendor),
  Resource: () => import('./resource.schema.js').then((m) => m.Resource),
  TimeSlot: () => import('./scheduling.schema.js').then((m) => m.TimeSlot),
  Conflict: () => import('./scheduling.schema.js').then((m) => m.Conflict),
  Budget: () => import('./budget.schema.js').then((m) => m.Budget),
  Expense: () => import('./budget.schema.js').then((m) => m.Expense),
  User: () => import('./user.schema.js').then((m) => m.User)
};
