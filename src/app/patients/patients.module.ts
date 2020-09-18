import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import {MatDialogModule} from '@angular/material/dialog';
import {MatRadioModule} from '@angular/material/radio';

import { StoreModule } from '@ngrx/store';

import { PatientsComponent } from './patients/patients.component';
import { PatientsService } from './patients.service';
import { DetailsComponent } from './details/details.component';
import { WrapperComponent } from './wrapper/wrapper.component';
import { DialogComponent } from './dialog/dialog.component';

import { PatientsReducer } from './store';
 
const patientsRoutes: Routes = [
    { 
        path: '', component: WrapperComponent, children: [
            { path: '', redirectTo: 'list', pathMatch: 'full' },
            { path: 'list', component: PatientsComponent },
            { path: 'details', component: DetailsComponent }
        ] 
    },
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(patientsRoutes),
        StoreModule.forFeature('patientsState', PatientsReducer),
        MatButtonModule,
        MatFormFieldModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        MatPaginatorModule,
        MatRadioModule,
        MatTabsModule,
        MatDialogModule
    ],
    declarations: [PatientsComponent, DetailsComponent, WrapperComponent, DialogComponent],
    providers: [ PatientsService ]
})
export class PatientsModule {}