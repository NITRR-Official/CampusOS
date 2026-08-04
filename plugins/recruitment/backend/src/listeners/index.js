import { registerFormsListener } from './forms.listener.js';

export function registerEventHandlers(eventBus, services) {
  registerFormsListener(eventBus, services);
}
