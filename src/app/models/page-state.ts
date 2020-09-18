import { PageEntity } from './enums';
import { FormState } from './form-state';

export interface PageState {
    entityList: Array<PageEntity>;
    formState: Array<FormState>;
}