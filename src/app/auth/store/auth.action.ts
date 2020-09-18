import { Action } from '@ngrx/store';
import { FormState } from 'src/app/models';

export const enum AuthActionType {
    logIn = "[Auth] Login In",
    logInSuccess = "[Auth] Login Success",
    loginFailed = "[Auth] Login Failed",
    updatePageState = "[Auth] Update Page State"
}

export namespace AuthAction {
    export class Login implements Action {
        readonly type = AuthActionType.logIn;
        constructor(public credential: Credential) {}
    }

    export class LoginSuccess implements Action {
        readonly type = AuthActionType.logInSuccess;
        constructor(public accessToken: string) {}
    }

    export class LoginFailed implements Action {
        readonly type = AuthActionType.loginFailed;
    }

    export class UpdatePageState implements Action {
        readonly type = AuthActionType.updatePageState;
        constructor( public inputState: FormState ) {}
    }

    export type All = Login
        | LoginSuccess
        | LoginFailed
        | UpdatePageState
        ;
}