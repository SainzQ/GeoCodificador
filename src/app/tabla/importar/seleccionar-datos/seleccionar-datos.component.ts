import { Component, Input } from '@angular/core';
import { SelectItemGroup } from 'primeng/api';

interface JsonObject {
  [key: string]: any;
}

@Component({
  selector: 'app-seleccionar-datos',
  templateUrl: './seleccionar-datos.component.html',
  styleUrls: ['./seleccionar-datos.component.css']
})

export class SeleccionarDatosComponent {
  @Input() json: JsonObject[] = [];
  @Input() str: string | undefined;

  datos: SelectItemGroup[];
  datosSeleccionados: { [header: string]: string } = {};
  columnas: { field: string; header: string }[] = [];

  ngOnInit() {
    if (this.json && this.json.length > 0) {
      const primeraFila = this.json[0];
      this.columnas = Object.keys(primeraFila).map(clave => ({
        field: clave,
        header: clave.toUpperCase()
      }));
    }
  }


  crearNuevoJSON(): JsonObject[] {
    const nuevoJSON: JsonObject[] = [];

    for (const fila of this.json) {
      const nuevaFila: JsonObject = {};

      for (const clave of Object.keys(fila)) {
        const claveSeleccionada = this.datosSeleccionados[clave.toUpperCase()];
        if (claveSeleccionada) {
          nuevaFila[claveSeleccionada] = fila[clave];
        }
      }

      nuevoJSON.push(nuevaFila);
    }

    return nuevoJSON;
  }

  GuardarProyecto() {
    const nuevoJSON = this.crearNuevoJSON();
    console.log(nuevoJSON);
  }

  manejarCambioDropdown(header: string, valor: string) {
    if (valor) {
      const valoresSeleccionados = Object.values(this.datosSeleccionados);
      if (valoresSeleccionados.includes(valor)) {
        for (const key in this.datosSeleccionados) {
          if (this.datosSeleccionados[key] === valor) {
            this.datosSeleccionados[key] = '';
          }
        }
        this.datosSeleccionados[header] = valor;
      } else {
        this.datosSeleccionados[header] = valor;
      }
    } else {
      this.datosSeleccionados[header] = '';
    }
  }

  constructor() {
    this.datos = [
      {
        label: 'Obligatorios',
        value: 'OB',
        items: [
          { label: 'Calle', value: 'calle' },
          { label: 'Colonia', value: 'colonia' },
          { label: 'Municipio', value: 'municipio' },
          { label: 'Estado', value: 'estado' },
          { label: 'Codigo Postal', value: 'codigo_postal' }
        ]
      },
      {
        label: 'Opcionales',
        value: 'OP',
        items: [
          { label: 'Region', value: 'region' },
          { label: 'Comentarios del Domicilio', value: 'comentarios_dom' },
          { label: 'ID Domicilio', value: 'id_req' },
          { label: 'Número Exterior', value: 'numero_exterior' }

        ]
      }
    ];
  }
}
