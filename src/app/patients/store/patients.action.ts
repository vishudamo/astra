import { Action } from '@ngrx/store';
import { FormState } from '../../models';

export const enum PatientsActionType {
    updatePageState = "[Patients] Update Page State"
}

export namespace PatientsAction {
    export class UpdatePageState implements Action {
        readonly type = PatientsActionType.updatePageState;
        constructor(
            public inputState: FormState
        ) {}
    }

    export type All = UpdatePageState;
}