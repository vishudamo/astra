import { PageState, FormState } from '../../models';
import { PageEntity, FormEventState } from '../../models/enums';

export abstract class PatientsPageState {
    public static getInitialState(): PageState {
        return {
            entityList: [PageEntity.Form],
            formState: [
                {
                    name: "firstColonoscopy",
                    formName: "observation",
                    currentEventState: FormEventState.UnTouched,
                    untouched: "has the patient undergone endoscopy before",
                    touched: "Please confirm again whether the patient has undergone endoscopy before",
                    order: 1,
                    type: "radio"
                },
                {
                    name: "dialysispatient",
                    formName: "observation",
                    currentEventState: FormEventState.UnTouched,
                    untouched: "is patient undergoing dialysis treatment",
                    touched: "Please confirm again whether the patient is patient undergoing dialysis treatment",
                    order: 2,
                    type: "radio"
                },
                {
                    name: "notes",
                    formName: "observation",
                    currentEventState: FormEventState.UnTouched,
                    untouched: "can you please provide some notes before the procedure",
                    touched: "can you please provide the notes again before the procedure",
                    order: 3,
                    type: "textarea"
                },
                {
                    name: "procedurePerformed",
                    formName: "procedure",
                    currentEventState: FormEventState.UnTouched,
                    untouched: "can you please provide the procedure performed",
                    touched: "can you please provide again the procedure performed",
                    order: 1,
                    type: "textarea"
                },
                {
                    name: "exam",
                    formName: "procedure",
                    currentEventState: FormEventState.UnTouched,
                    untouched: "how about indications for examination",
                    touched: "can you please provide again indications for examination",
                    order: 2,
                    type: "textarea"
                },
                {
                    name: "finding",
                    formName: "procedure",
                    currentEventState: FormEventState.UnTouched,
                    touched: "can you please provide details again about other findings",
                    untouched: "can you provide details about other findings, if any",
                    order: 3,
                    type: "textarea"
                },
                {
                    name: "enddia",
                    formName: "procedure",
                    currentEventState: FormEventState.UnTouched,
                    untouched: "what are the Endoscopic diagnosis performed",
                    touched: "can you please provide again the endoscopic diagnosis performed",
                    order: 4,
                    type: "textarea"
                }
            ]
        }
    }

    public static UpdateState(currentPageState: PageState, inputState: FormState): PageState {
        let pageState: PageState = {
            ...currentPageState
        };

        pageState.formState = currentPageState.formState.map(row => {
            if(row.order === inputState.order && row.formName === inputState.formName ) {
                return inputState;
            }
            return row;
        });

        return pageState;
    }
}