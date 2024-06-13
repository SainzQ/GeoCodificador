import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { timer } from 'rxjs';

import { Customer } from 'src/app/models/customer.model';

import { TABLE_ACTION } from 'src/app/modules/table/enums/table-action.enum';
import { TableAction } from 'src/app/modules/table/models/table-action.model';
import { TableColumn } from 'src/app/modules/table/models/table-column.model';
import { TableConfig } from 'src/app/modules/table/models/table-config.model';

const CUSTOMERS_DATA_MOCK: Customer[] = [
  {
    id_usuario: 1,
    nombre: 'Mapa de Zonas Escolares',
    resultado_proceso: 'Completo',
    numero_registros: 200,
    fecha_creacion: new Date(2023, 4, 20),
    fecha_geocodificacion: new Date(2023, 4, 25),
    estatus_geocodificacion: 'Completo'
  },
  {
    id_usuario: 2,
    nombre: 'Centros de Salud',
    resultado_proceso: 'Completo',
    numero_registros: 150,
    fecha_creacion: new Date(2023, 5, 10),
    fecha_geocodificacion: new Date(2023, 5, 15),
    estatus_geocodificacion: 'Completo'
  },
  {
    id_usuario: 3,
    nombre: 'Red de Transporte',
    resultado_proceso: 'En Proceso',
    numero_registros: 300,
    fecha_creacion: new Date(2023, 6, 5),
    fecha_geocodificacion: new Date(2023, 6, 12),
    estatus_geocodificacion: 'En Proceso'
  },
  // Resto de los datos...
];

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit {
  customersList: Customer[] = [];
  tableColumns: TableColumn[] = [];
  tableConfig: TableConfig = {
    isSelectable: true,
    isPaginable: true,
    showActions: true,
    showFilter: true,
  };
  isLoadingTable: boolean = true;

  constructor() {}

  ngOnInit(): void {
    this.setTableColumns();
    // Simulación de carga de datos
    setTimeout(() => {
      console.log('Setting customersList:', CUSTOMERS_DATA_MOCK); // Agrega este log para verificar los datos
      this.customersList = CUSTOMERS_DATA_MOCK;
      this.isLoadingTable = false;
    }, 5000); // Tiempo de espera simulado de 5 segundos
  }

  setTableColumns() {
    this.tableColumns = [
      { label: 'ID Usuario', def: 'id_usuario', dataKey: 'id_usuario' },
      { label: 'Nombre del Proyecto', def: 'nombre', dataKey: 'nombre' },
      { label: 'Resultado del Proceso', def: 'resultado_proceso', dataKey: 'resultado_proceso' },
      { label: 'Número de Registros', def: 'numero_registros', dataKey: 'numero_registros' },
      { label: 'Fecha de Creación', def: 'fecha_creacion', dataKey: 'fecha_creacion', dataType: 'date', formatt: 'dd MMM yyyy' },
      { label: 'Fecha de Geocodificación', def: 'fecha_geocodificacion', dataKey: 'fecha_geocodificacion', dataType: 'date', formatt: 'dd MMM yyyy' },
      { label: 'Estatus de Geocodificación', def: 'estatus_geocodificacion', dataKey: 'estatus_geocodificacion' },
    ];
  }

  onSelect(data: any) {
    console.log(data);
  }

  onTableAction(tableAction: TableAction) {
    switch (tableAction.action) {
    
      case TABLE_ACTION.DELETE:
        this.onDelete(tableAction.row);
        break;
      
      default:
        break;
    }
  }

  onSave(newRow: Customer) {
    this.isLoadingTable = true;
    // Simulación de guardado de datos con temporizador
    timer(3000).subscribe(() => {
      this.isLoadingTable = false;
      this.customersList = this.customersList.map((currentCustomer) =>
        currentCustomer.id_usuario === newRow.id_usuario ? newRow : currentCustomer
      );
    });
  }

  // onEdit(customer: Customer) {
  //   console.log('Edit', customer);
  // }

  onDelete(customer: Customer) {
    console.log('Delete', customer);
    // Aquí iría la lógica para eliminar un cliente
  }

  // Método para crear un nuevo FormGroup basado en los datos de una fila
  onCreateNewFormGroup(row: Customer): FormGroup {
    return new FormGroup({
      id_usuario: new FormControl(row.id_usuario),
      nombre: new FormControl(row.nombre),
      resultado_proceso: new FormControl(row.resultado_proceso),
      numero_registros: new FormControl(row.numero_registros),
      fecha_creacion: new FormControl(row.fecha_creacion),
      fecha_geocodificacion: new FormControl(row.fecha_geocodificacion),
      estatus_geocodificacion: new FormControl(row.estatus_geocodificacion),
    });
  }
}