import { Component, Input,  OnChanges, SimpleChanges } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { JsonObject } from '../seleccionar-datos/seleccionar-datos.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableroService } from 'src/app/services/tablero.service';


@Component({
  selector: 'app-geocodificar',
  templateUrl: './geocodificar.component.html',
  styleUrls: ['./geocodificar.component.css']
})
export class GeocodificarComponent implements OnChanges {
  selection = new SelectionModel<any>(true, []);
  sleccionNse: boolean = false;
  sleccionAgeb: boolean = false;
  sleccionEsquinas: boolean = false;

  @Input() selectedProject: any;



  constructor(private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private tableroService: TableroService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedProject'] && this.selectedProject) {
      // console.log(this.selectedProject);
    }
  }

  handleData(event: { selection: any }) {
    this.selection = event.selection;
  }


  onGeocodificar(event: Event) {

    const proyectoId = this.selectedProject.id_proyecto;
    const estatusGeocodificacion = this.selectedProject.estatus_geocodificacion;
    // console.log(this.selectedProject);
    // console.log(proyectoId);
    // console.log(estatusGeocodificacion);

    if (estatusGeocodificacion === 'PG') {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'El proyecto ya está en proceso de geocodificación' });
      return;
    } else if (estatusGeocodificacion === 'GC') {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'El proyecto ya ha sido geocodificado' });
      return;
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Está seguro de geocodificar el proyecto?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const datosAEnviar: JsonObject = {
          id_proyecto: proyectoId,
          nse: this.sleccionNse,
          ageb: this.sleccionAgeb,
          esquinas: this.sleccionEsquinas
        };
        console.log(datosAEnviar);
        this.tableroService.geocodificarProyecto(datosAEnviar).subscribe(
          response => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proyecto geocodificado correctamente' });
            setTimeout(() => {
              window.location.reload();
            }, 2000);
            // console.log(response);

          },
          error => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo geocodificar el proyecto, intentelo de nuevo mas tarde' });
            // console.log(error);

          }
        );
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelado', detail: 'No se geocodificó el proyecto' });
      }
    });
  }



}
