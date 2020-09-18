import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { ConsoleComponent } from './console/console.component';
import { ToolbarModule, TopBarModule } from '../shared';

const consoleRoutes: Routes = [
  {
    path: '', component: ConsoleComponent, children: [
      { path: '', redirectTo: 'patients', pathMatch: 'full' },
      { path: 'patients', loadChildren: () => import('../patients/patients.module').then(m => m.PatientsModule) }
    ]
  }
];

@NgModule({
  declarations: [ConsoleComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(consoleRoutes),
    ToolbarModule,
    TopBarModule
  ]
})
export class ConsoleModule { }
