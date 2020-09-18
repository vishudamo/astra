import { AuthState } from './auth.state';
import { AuthAction, AuthActionType } from "./auth.action";
import { LoginPageState } from './page.state';

const initialState: AuthState = {
    pageState: LoginPageState.getInitialState(),
    accessToken: "",
    isAuthenticated: false,
};

export function AuthReducer(state = initialState, action: AuthAction.All): AuthState {
    switch(action.type) {
        case AuthActionType.logIn:
            return { ...state };
        case AuthActionType.logInSuccess:
            return { ...state, isAuthenticated: true, accessToken: action.accessToken };
        case AuthActionType.loginFailed:
            return { ...state, isAuthenticated: false, accessToken: "" };
        case AuthActionType.updatePageState:
            return {
                        ...state,
                        pageState: LoginPageState.UpdateState(state.pageState, action.inputState) 
                    };
        default:
            return state;
    };
}
