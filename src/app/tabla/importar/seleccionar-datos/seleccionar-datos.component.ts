import { Component, Input } from '@angular/core';
import { ConfirmationService, MessageService, SelectItemGroup } from 'primeng/api';

interface JsonObject {
  [key: string]: any;
}

@Component({
  selector: 'app-seleccionar-datos',
  templateUrl: './seleccionar-datos.component.html',
  providers: [MessageService, ConfirmationService],
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
          const valor = fila[clave] ?? '';
          nuevaFila[claveSeleccionada] = valor.toString();
        }
      }

      for (const clave of Object.keys(this.datosSeleccionados)) {
        const claveSeleccionada = this.datosSeleccionados[clave];
        if (!nuevaFila.hasOwnProperty(claveSeleccionada)) {
          nuevaFila[claveSeleccionada] = '';
        }
      }

      nuevoJSON.push(nuevaFila);
    }

    return nuevoJSON;
  }

  GuardarProyecto(event: Event) {
    const opcionesObligatorias = this.datos.find(grupo => grupo.value === 'OB')?.items || [];
    const opcionesObligatoriasSeleccionadas = Object.values(this.datosSeleccionados).filter(valor => opcionesObligatorias.some(item => item.value === valor));

    if (opcionesObligatoriasSeleccionadas.length !== opcionesObligatorias.length) {
      console.log('Error al guardar');
      this.messageService.add({
        severity: 'error',
        summary: 'Error al Guardar',
        detail: 'Por favor, seleccione todas las opciones marcadas como "Obligatorias" para continuar.'
      });
      return;
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Seguro que deseas continuar?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si',
      rejectLabel: 'No',
      accept: () => {
        this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'You have accepted' });
        const nuevoJSON = this.crearNuevoJSON();
        console.log(nuevoJSON);
      },
      reject: () => {

      }

    });



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

  constructor(private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.datos = [
      {
        label: 'Obligatorios',
        value: 'OB',
        items: [
          { label: 'ID Domicilio', value: 'id_req' },
          { label: 'Calle', value: 'calle' },
          { label: 'Municipio', value: 'municipio' },
        ]
      },
      {
        label: 'Opcionales',
        value: 'OP',
        items: [
          { label: 'Nombre', value: 'nombre' },
          { label: 'Colonia', value: 'colonia' },
          { label: 'Region', value: 'region' },
          { label: 'Estado', value: 'estado' },
          { label: 'Codigo Postal', value: 'codigo_postal' },
          { label: 'Comentarios del Domicilio', value: 'comentarios_dom' },
          { label: 'Referencias del Domicilio', value: 'referencias_dom' },
          { label: 'Número Exterior', value: 'numero_exterior' },
          { label: 'Telefono', value: 'telefono' }
        ]
      }
    ];
  }
}
