import { PageState } from 'src/app/models';

export interface AuthModuleState {
    authState: AuthState;
}

export interface AuthState {
    pageState: PageState;
    accessToken: string;
    isAuthenticated: boolean;
}