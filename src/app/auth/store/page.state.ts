import { PageState, FormState } from '../../models';
import { PageEntity, FormEventState } from '../../models/enums';

export abstract class LoginPageState {
    public static getInitialState(): PageState {
        return {
            entityList: [PageEntity.Form],
            formState: [
                {
                    name: "username",
                    formName: "loginForm",
                    currentEventState: FormEventState.UnTouched,
                    untouched: "Hello. Please may i have your username",
                    touched: "Please provide the username again",
                    order: 1,
                },
                {
                    name: "password",
                    formName: "loginForm",
                    currentEventState: FormEventState.UnTouched,
                    untouched: "can you help me with your passcode",
                    touched: "Please provide the passcode again",
                    order: 2
                }
            ]
          }
    }

    public static UpdateState(currentPageState: PageState, inputState: FormState): PageState {
        let pageState: PageState = {
            ...currentPageState
        };

        pageState.formState = currentPageState.formState.map(row => {
            if(row.order === inputState.order) {
                return { ...inputState };
            }
            return row;
        });

        return pageState;
    }
}