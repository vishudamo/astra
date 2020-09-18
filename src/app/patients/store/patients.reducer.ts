import { PatientsState } from "./patients.state";
import { PatientsPageState } from "./page.state";
import { PatientsAction, PatientsActionType } from "./patients.action";

const initialState: PatientsState = {
    pageState: PatientsPageState.getInitialState()
}

export function PatientsReducer(state = initialState, action: PatientsAction.All): PatientsState {
    switch(action.type) {
        case PatientsActionType.updatePageState:
            return { pageState: PatientsPageState.UpdateState(state.pageState, action.inputState) };
        default:
            return { ...state };
    }
}