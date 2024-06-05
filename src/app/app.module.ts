import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { AppComponent } from './app.component';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { HttpClientModule } from '@angular/common/http';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';

import { DialogComponent } from './tabla/importar/dialog/dialog.component';
import { CargarArchivoComponent } from './tabla/importar/cargar-archivo/cargar-archivo.component';

@NgModule({
  declarations: [
    AppComponent,
    DialogComponent,
    CargarArchivoComponent,
    DialogComponent
  ],
  imports: [
    BrowserModule,
    CardModule,
    TableModule,
    ButtonModule,
    FileUploadModule,
    ToastModule,
    HttpClientModule,
    ButtonModule,
    BadgeModule,
    ProgressBarModule,
    DialogModule,
    BrowserAnimationsModule,
    InputTextModule,
    FormsModule,
    DropdownModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
