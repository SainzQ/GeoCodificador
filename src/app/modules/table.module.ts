import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MatTableModule } from "@angular/material/table";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { HttpClientModule } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';

// For dynamic progressbar demo
import { MessageService } from 'primeng/api';
import { TableComponent } from "./table/components/table/table.component";
import { ColumnValuePipe } from './table/pipes/column-value.pipe';
import { CargarArchivoComponent } from "./cargar-archivo/cargar-archivo.component";
import { ProgressBarModule } from 'primeng/progressbar';
// For dynamic progressbar demo
import { ToastModule } from 'primeng/toast';

@NgModule({
    declarations: [
        TableComponent, 
        ColumnValuePipe,
        CargarArchivoComponent
    ],
    imports: [
        CommonModule,
        MatTableModule,
        MatCheckboxModule,
        MatPaginatorModule,
        MatInputModule,
        MatSortModule,
        MatRadioModule,
        MatDatepickerModule,
        MatSelectModule,
        MatNativeDateModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        PaginatorModule,
        ProgressBarModule,
        ToastModule,
        ConfirmDialogModule,
        ConfirmPopupModule,
        HttpClientModule,
        DialogModule,
        ProgressSpinnerModule,
        FileUploadModule,
        PaginatorModule
    ],
    exports: [
        TableComponent,
        HttpClientModule
    ],
    providers: [
        MessageService,
    ]
})
export class TableModule { }
