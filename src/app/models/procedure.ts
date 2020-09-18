import { ScreeningType, SurgeryStatus } from './enums';
import { InitIdentifierValue } from './init-identifier-value';

export interface Procedure {
    surgeryType: string;
    screeningType: ScreeningType;
    preExistCondition: InitIdentifierValue;
    screenForNeoplasm: InitIdentifierValue;
    procPerformedWay: string;
    procedureNotes: Array<string>;
    surgeryStatus: SurgeryStatus;
    icdCode: Array<string>;
    cptCode: Array<string>;
}