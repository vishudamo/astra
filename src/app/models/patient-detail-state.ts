import { PageEntity, FormEventState } from './enums';

export interface MultiPartFormState {
    name: string;
    formName: string;
    currentEventState: FormEventState;
    untouchedSpeakData: string;
    focusedSpeakData: string;
    completedSpeakData: string;
    errorSpeakData: string;
    order: number;
    type: string;
}

export interface PatientDetailState {
    entityList: Array<PageEntity>;
    formState: FormEventState;
    form: Array<MultiPartFormState>;
}