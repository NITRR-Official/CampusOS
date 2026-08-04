export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'select'
  | 'checkbox'
  | 'radio';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // Comma separated or array of strings for select/radio
}

export interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
}
