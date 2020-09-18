import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MicComponent } from './mic/mic.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [MicComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule
  ],
  exports: [MicComponent]
})
export class CoreModule { }
