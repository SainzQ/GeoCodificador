import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { timer } from 'rxjs';

import { Customer } from 'src/app/models/customer.model';

import { TABLE_ACTION } from 'src/app/modules/table/enums/table-action.enum';
import { TableAction } from 'src/app/modules/table/models/table-action.model';
import { TableColumn } from 'src/app/modules/table/models/table-column.model';
import { TableConfig } from 'src/app/modules/table/models/table-config.model';
import { TableroService } from 'src/app/services/tablero.service';

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
    showFilter: true
  };
  isLoadingTable: boolean = true;

  constructor(private tableroService: TableroService) { }

  ngOnInit(): void {
    this.setTableColumns();
    this.loadCustomers();
  }

  setTableColumns() {
    this.tableColumns = [
      { label: 'ID Usuario', def: 'id_usuario', dataKey: 'id_usuario' },
      { label: 'Nombre del Proyecto', def: 'nombre', dataKey: 'nombre' },
      { label: 'Resultado del Proceso', def: 'resultado_proceso', dataKey: 'resultado_proceso' },
      { label: 'Número de Registros', def: 'numero_registros', dataKey: 'numero_registros' },
      { label: 'Fecha de Creación', def: 'fecha_creacion', dataKey: 'fecha_creacion', dataType: 'date', formatt: 'dd MMM yyyy' },
      { label: 'Fecha de Geocodificación', def: 'fecha_geocodificacion', dataKey: 'fecha_geocodificacion', dataType: 'date', formatt: 'dd MMM yyyy' },
      { label: 'Estatus de Geocodificación', def: 'estatus_geocodificacion', dataKey: 'estatus_geocodificacion' }
    ];
  }
  loadCustomers() {
    this.isLoadingTable = true;
    this.tableroService.getProyecto().subscribe(
      response => {
        this.customersList = response.response.map((project: any) => ({
          ...project,
          estatus_geocodificacion: project.estatus_geocodificacion === 'NG' ? 'En Proceso' :
                                    project.estatus_geocodificacion === 'GC' ? 'Finalizado' : project.estatus_geocodificacion,
          statusClass: project.estatus_geocodificacion === 'GC' ? 'green' : ''
        }));
        this.isLoadingTable = false;
      },
      error => {
        console.log('Error al obtener proyectos', error);
        this.isLoadingTable = false;
      }
    );
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
    timer(10000).subscribe(() => {
      this.isLoadingTable = false;
      this.customersList = this.customersList.map((currentCustomer) =>
        currentCustomer.id_usuario === newRow.id_usuario ? newRow : currentCustomer
      );
    });
  }

  onDelete(customer: Customer) {
    console.log('Delete', customer);
    // Aquí iría la lógica para eliminar un cliente
  }

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