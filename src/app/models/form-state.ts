import { FormEventState } from "./enums/form-event-state.enum";

export interface FormState {
    name: string;
    formName: string;
    currentEventState: FormEventState;
    touched: string; // Touched Speak Data
    untouched: string; // UnTouched Speak Data
    order: number;
    type?: string;
}