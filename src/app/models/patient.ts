import { Gender, ScreeningType, SurgeryStatus } from './enums';

export interface Patient {
    id: number;
    firstName: string;
    lastName: string;
    gender: Gender;
    insuranceName: string;
    policyNo: string;
    surgeryDate: string;
    surgeryType: string;
    status: SurgeryStatus;
    isBilled: boolean;
}