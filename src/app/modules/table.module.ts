import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MatTableModule } from "@angular/material/table";
import { MatCheckboxModule } from '@angular/material/checkbox';
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
import { TabViewModule } from 'primeng/tabview';
import { ChartModule } from 'primeng/chart';
import { OverlayPanelModule } from 'primeng/overlaypanel';

// For dynamic progressbar demo
import { MessageService } from 'primeng/api';
import { TableComponent } from "./table/components/table/table.component";
import { ColumnValuePipe } from './table/pipes/column-value.pipe';
import { CargarArchivoComponent } from "./cargar-archivo/cargar-archivo.component";
import {DialogComponent} from "./dialog/dialog.component"
import {SeleccionarDatosComponent} from "./seleccionar-datos/seleccionar-datos.component";
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule as PrimeNgTableModule } from 'primeng/table';
import { InputSwitchModule } from 'primeng/inputswitch';
// For dynamic progressbar demo
import { ToastModule } from 'primeng/toast';
//service
import { TableroService } from "../services/tablero.service";
import { RecargarComponenteDirective } from "../directives/recargar-componente.directive";
import { GeocodificarComponent } from "./geocodificar/geocodificar.component";
import { MapaInteractivoComponent } from './mapa-interactivo/mapa-interactivo.component';
@NgModule({
    declarations: [
        TableComponent,
        ColumnValuePipe,

        DialogComponent,
        CargarArchivoComponent,
        DialogComponent,
        SeleccionarDatosComponent,
        RecargarComponenteDirective,
        GeocodificarComponent,
        MapaInteractivoComponent
    ],
    imports: [
        PrimeNgTableModule,
        CommonModule,
        MatTableModule,
        MatCheckboxModule,
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
        InputSwitchModule,
        TabViewModule,
        ChartModule,
        OverlayPanelModule
    ],
    exports: [
        TableComponent,
        HttpClientModule
    ],
    providers: [
        MessageService,
        TableroService
    ]
})
export class TableModule { }
