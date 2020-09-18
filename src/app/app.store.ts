import { ActionReducerMap } from "@ngrx/store";

import { AuthState, AuthReducer } from './auth/store';

export interface AppModuleState {
    authState: AuthState
}

export const AppReducer: ActionReducerMap<AppModuleState> = {
    authState: AuthReducer
}

