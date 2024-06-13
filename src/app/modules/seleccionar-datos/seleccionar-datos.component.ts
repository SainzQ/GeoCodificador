import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfirmationService, MessageService, SelectItemGroup } from 'primeng/api';
import { ExportarService } from '../../services/exportar.service';

export interface JsonObject {
  [key: string]: any;
}

@Component({
  selector: 'app-seleccionar-datos',
  templateUrl: './seleccionar-datos.component.html',
  providers: [MessageService, ConfirmationService],
  styleUrls: ['./seleccionar-datos.css']
})
export class SeleccionarDatosComponent {
  @Input() json: JsonObject[] = [];
  @Input() str: string | undefined;
  @Output() onFinish = new EventEmitter<{ recargar: number }>();

  datos: SelectItemGroup[];
  datosSeleccionados: { [header: string]: string } = {};
  columnas: { field: string; header: string }[] = [];

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private exportarService: ExportarService
  ) {
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

  ngOnInit() {
    if (this.json && this.json.length > 0) {
      const primeraFila = this.json[0];
      this.columnas = Object.keys(primeraFila).map(clave => ({
        field: clave,
        header: clave.toUpperCase()
      }));
    }
  }

  crearNuevoJSON(): any {
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

    const datosAEnviar = {
      nombre_proyecto: this.str,
      id_usuario: 1,
      direcciones: nuevoJSON
    };

    return datosAEnviar;
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
        const nuevoJSON = this.crearNuevoJSON();
        // console.log(nuevoJSON);

        this.exportarService.exportar(nuevoJSON).subscribe(
          response => {
            console.log('Respuesta del servidor:', response);
            this.onFinish.emit({ recargar: 1 });
            this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Proyecto guardado exitosamente' });
          },
          error => {
            console.error('Error al exportar:', error);
            this.messageService.add({ severity: 'Error', summary: 'Error', detail: 'Problemas para guardar el Proyecto, intentalo de nuevo mas tarde' });
          }
        );
      },
      reject: () => {
        // ...
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
}