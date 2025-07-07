export type InputStatus = 'typing' | 'updating' | 'success' | 'error';

export interface FieldState {
  value: string;
  status: InputStatus;
  timer?: NodeJS.Timeout;
}

export type FieldStates = Record<string, FieldState>;

export interface UseInputHandlerReturn {
  fieldStates: FieldStates;
  fieldValues: Record<string, string>;
  setFieldValues: (values: Record<string, string>) => void;
  handleInputChange: (field: string, value: string) => void;
  getInputStyle: (field: string) => string;
}