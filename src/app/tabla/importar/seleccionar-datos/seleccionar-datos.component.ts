import { Component } from '@angular/core';
import { SelectItemGroup } from 'primeng/api';


@Component({
  selector: 'app-seleccionar-datos',
  templateUrl: './seleccionar-datos.component.html',
  styleUrls: ['./seleccionar-datos.component.css']
})
export class SeleccionarDatosComponent {
  datos: SelectItemGroup[];

  datosSeleccionados: string | undefined;

  constructor() {
    this.datos = [
      {
        label: 'Obligatorios',
        value: 'OB',
        items: [
          { label: 'Calle', value: 'calle' },
          { label: 'Número Exterior', value: 'numeroExt' },
          { label: 'Colonia', value: 'colonia' },
          { label: 'Municipio', value: 'municipio' },
          { label: 'Estado', value: 'estado' }
        ]
      },
      {
        label: 'Opcionales',
        value: 'OP',
        items: [
          { label: 'Codigo Postal', value: 'cp' },
          { label: 'Region', value: 'region' },
          { label: 'Comentarios del Domicilio', value: 'comentarios' }
        ]
      }
    ];
  }
}
