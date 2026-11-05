import { RequestContext } from '../core/request-context.js';

/**
 * Request Context Middleware
 * Initializes a request-scoped cache (req.contextCache) and wraps the execution
 * of all subsequent middlewares, context resolvers, services, and route handlers
 * inside an AsyncLocalStorage boundary (RequestContext).
 */
export function requestContextMiddleware(req, res, next) {
  const store = new Map();
  req.contextCache = store;

  if (req.id) {
    store.set('req:id', req.id);
  }

  return RequestContext.run(store, () => next());
}

export default requestContextMiddleware;
