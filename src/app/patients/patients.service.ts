import { Injectable } from '@angular/core';

import { Patient } from '../models';
import { Gender, ScreeningType, SurgeryStatus } from '../models/enums';

@Injectable()
export class PatientsService {
    private data: Array<Patient> = [
        {
            id: 1,
            firstName: "Wilson",
            lastName: "",
            gender: Gender.Male,
            insuranceName: "Medicare Insurance",
            policyNo: "DD343434",
            surgeryDate: "21/08/2020",
            surgeryType: "Colonoscopy",
            status: SurgeryStatus.Pending,
            isBilled: false
        },
        {
            id: 2,
            firstName: "Jack",
            lastName: "David",
            gender: Gender.Male,
            insuranceName: "Cigna Health Insurance",
            policyNo: "DD343434",
            surgeryDate: "23/08/2020",
            surgeryType: "Colonoscopy",
            status: SurgeryStatus.Pending,
            isBilled: false
        },
        {
            id: 3,
            firstName: "Mary",
            lastName: "Williams",
            gender: Gender.Female,
            insuranceName: "Medicare Insurance",
            policyNo: "DD343434",
            surgeryDate: "23/08/2020",
            surgeryType: "Colonoscopy",
            status: SurgeryStatus.Pending,
            isBilled: false
        },
        {
            id: 4,
            firstName: "David",
            lastName: "Smith",
            gender: Gender.Male,
            insuranceName: "Medicare Insurance",
            policyNo: "DD343434",
            surgeryDate: "23/08/2020",
            surgeryType: "Colonoscopy",
            status: SurgeryStatus.Pending,
            isBilled: false
        },
        {
            id: 5,
            firstName: "Sam",
            lastName: "Mendes",
            gender: Gender.Male,
            insuranceName: "Medicare Insurance",
            policyNo: "DD343434",
            surgeryDate: "23/08/2020",
            surgeryType: "Colonoscopy",
            status: SurgeryStatus.Pending,
            isBilled: false
        },
        {
            id: 6,
            firstName: "June",
            lastName: "Manroe",
            gender: Gender.Female,
            insuranceName: "Medicare Insurance",
            policyNo: "DD343434",
            surgeryDate: "23/08/2020",
            surgeryType: "Colonoscopy",
            status: SurgeryStatus.Pending,
            isBilled: false
        },
        {
            id: 7,
            firstName: "Eliza",
            lastName: "Jacob",
            gender: Gender.Female,
            insuranceName: "Medicare Insurance",
            policyNo: "DD343434",
            surgeryDate: "23/08/2020",
            surgeryType: "Colonoscopy",
            status: SurgeryStatus.Pending,
            isBilled: false
        },
        {
            id: 8,
            firstName: "George",
            lastName: "Mendes",
            gender: Gender.Female,
            insuranceName: "Medicare Insurance",
            policyNo: "DD343434",
            surgeryDate: "23/08/2020",
            surgeryType: "Colonoscopy",
            status: SurgeryStatus.Pending,
            isBilled: false
        }
    ];

    get Data(): Array<Patient> {
        return this.data;
    }
}