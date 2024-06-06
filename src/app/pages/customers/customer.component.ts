import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { timer } from 'rxjs';

import { Customer } from 'src/app/models/customer.model';

import { TABLE_ACTION } from 'src/app/modules/table/enums/table-action.enum';
import { TableAction } from 'src/app/modules/table/models/table-action.model';
import { TableColumn } from 'src/app/modules/table/models/table-column.model';
import { TableConfig } from 'src/app/modules/table/models/table-config.model';

const CUSTOMERS_DATA_MOCK = [
        {
            id: 1,
            nombreproyecto: 'Mapa de Zonas Escolares',
            usuario: 'usuario1',
            nregistros: 200,
            rgeocodificacion: '90%',
            fechacrea: new Date(2023, 4, 20),
            fechageo: new Date(2023, 4, 25),
            estatus: 'Completo'
        },
        {
            id: 2,
            nombreproyecto: 'Centros de Salud',
            usuario: 'usuario2',
            nregistros: 150,
            rgeocodificacion: '85%',
            fechacrea: new Date(2023, 5, 10),
            fechageo: new Date(2023, 5, 15),
            estatus: 'Completo'
        },
        {
            id: 3,
            nombreproyecto: 'Red de Transporte',
            usuario: 'usuario3',
            nregistros: 300,
            rgeocodificacion: '70%',
            fechacrea: new Date(2023, 6, 5),
            fechageo: new Date(2023, 6, 12),
            estatus: 'En Proceso'
        },
        {
            id: 4,
            nombreproyecto: 'Áreas Verdes',
            usuario: 'usuario4',
            nregistros: 100,
            rgeocodificacion: '95%',
            fechacrea: new Date(2023, 3, 22),
            fechageo: new Date(2023, 3, 29),
            estatus: 'Completo'
        },
        {
            id: 5,
            nombreproyecto: 'Monitoreo de Calidad del Aire',
            usuario: 'usuario5',
            nregistros: 250,
            rgeocodificacion: '80%',
            fechacrea: new Date(2023, 7, 1),
            fechageo: new Date(2023, 7, 8),
            estatus: 'En Proceso'
        },
        {
            id: 6,
            nombreproyecto: 'Inventario de Alumbrado Público',
            usuario: 'usuario6',
            nregistros: 120,
            rgeocodificacion: '92%',
            fechacrea: new Date(2023, 2, 10),
            fechageo: new Date(2023, 2, 17),
            estatus: 'Completo'
        },
        {
            id: 7,
            nombreproyecto: 'Red de Agua Potable',
            usuario: 'usuario7',
            nregistros: 180,
            rgeocodificacion: '88%',
            fechacrea: new Date(2023, 1, 18),
            fechageo: new Date(2023, 1, 25),
            estatus: 'Completo'
        },
        {
            id: 8,
            nombreproyecto: 'Puntos de Reciclaje',
            usuario: 'usuario8',
            nregistros: 75,
            rgeocodificacion: '78%',
            fechacrea: new Date(2023, 9, 5),
            fechageo: new Date(2023, 9, 12),
            estatus: 'En Proceso'
        },
        {
            id: 9,
            nombreproyecto: 'Estaciones de Servicio',
            usuario: 'usuario9',
            nregistros: 90,
            rgeocodificacion: '93%',
            fechacrea: new Date(2023, 8, 20),
            fechageo: new Date(2023, 8, 27),
            estatus: 'Completo'
        },
        {
            id: 10,
            nombreproyecto: 'Rutas de Recolección de Basura',
            usuario: 'usuario10',
            nregistros: 130,
            rgeocodificacion: '82%',
            fechacrea: new Date(2023, 11, 1),
            fechageo: new Date(2023, 11, 8),
            estatus: 'En Proceso'
        }
    ];
    



@Component({
    selector: 'app-customer',
      templateUrl: './customer.component.html',
    styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit{ 
    customersList: Array<Customer> = [];
    tableColumns: TableColumn[] = [];
    tableConfig: TableConfig = {
      isSelectable: true,
      isPaginable: true,
      showActions: true,
      showFilter: true,
    };  
    isLoadingTable: boolean = true;

    constructor (){}

    ngOnInit(): void {
        this.setTableColumns();
        setTimeout(() => {
          this.customersList = CUSTOMERS_DATA_MOCK;
          this.isLoadingTable = false
        }, 5000)
      }

      setTableColumns() {
        this.tableColumns = [
          { label: 'ID', def: 'id', dataKey: 'id' },
          { label: 'Nombre del Proyecto', def: 'nombreproyecto', dataKey: 'nombreproyecto' },
          { label: 'Usuario', def: 'usuario', dataKey: 'usuario' },
          { label: 'N. de Registros', def: 'nregistros', dataKey: 'nregistros' },
          {
            label: 'Resultado de Geocodificación',
            def: 'rgeocodificacion',
            dataKey: 'rgeocodificacion'
          },
          {
            label: 'Fecha de Creación',
            def: 'fechacrea',
            dataKey: 'fechacrea',
            dataType: 'date',
            formatt: 'dd MMM yyyy',
            controlType: 'date'
          },
          {
            label: 'Fecha de Geocodificación',
            def: 'fechageo',
            dataKey: 'fechageo',
            dataType: 'date',
            formatt: 'dd MMM yyyy',
            controlType: 'date'
          },
          {
            label: 'Estatus de Geocodificación',
            def: 'estatus',
            dataKey: 'estatus',
            controlType: 'select',
            data: [
              'Completo',
              'En Proceso',
              'Pendiente'
            ]
          }
        ];
      }
    
      onSelect(data: any) {
        console.log(data)
      }
      onTableAction(tableAction: TableAction) {
        switch (tableAction.action) {
          case TABLE_ACTION.EDIT:
            this.onEdit(tableAction.row)
            break;
          case TABLE_ACTION.DELETE:
            this.onDelete(tableAction.row)
            break;
          case TABLE_ACTION.SAVE:
            this.onSave(tableAction.row)
            break;
    
          default:
            break;
        }
      }
      onSave(newRow: Customer) {
        this.isLoadingTable = true
        timer(3000).subscribe(()=> {
          this.isLoadingTable = false;
          this.customersList = this.customersList.map(currentCustomer => currentCustomer. id === newRow.id ? newRow : currentCustomer)
        });
      }
    
      onEdit(customer: Customer) {
        console.log('Edit', customer)
      }
      onDelete(customer: Customer) {
        console.log('Delete', customer)
    
      }
      onCreateNewFormGroup(row: any): FormGroup {
        return new FormGroup({
          id: new FormControl(row.id),
          nombreproyecto: new FormControl(row.nombreproyecto),
          usuario: new FormControl(row.usuario),
          nregistros: new FormControl(row.nregistros),
          rgeocodificacion: new FormControl(row.rgeocodificacion),
          fechacrea: new FormControl(row.fechacrea),
          fechageo: new FormControl(row.fechageo),
          estatus: new FormControl(row.estatus)
        });
      }
      
}
