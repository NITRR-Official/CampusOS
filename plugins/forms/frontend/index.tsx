import { registry } from '@campus-os/shared/plugin-registry';
import { FormBuilder } from './components/FormBuilder';
import { FormRenderer } from './components/FormRenderer';

export * from './types/form';
export { FormBuilder, FormRenderer };
export { createDynamicSchema } from './utils/dynamic-zod';

export function initFormsFrontend() {
  registry.registerWidget('forms:builder', 'forms', ({ context }: any) => {
    return (
      <FormBuilder
        initialFields={context?.initialFields}
        onChange={context?.onChange}
      />
    );
  });

  registry.registerWidget('forms:renderer', 'forms', ({ context }: any) => {
    return (
      <FormRenderer
        schema={context?.schema}
        onSubmit={context?.onSubmit}
        initialData={context?.initialData}
      />
    );
  });
}
