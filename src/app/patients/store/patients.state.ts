import { PageState } from '../../models';

export interface PatientsModuleState {
    patientsState: PatientsState;
}

export interface PatientsState {
    pageState: PageState;
}