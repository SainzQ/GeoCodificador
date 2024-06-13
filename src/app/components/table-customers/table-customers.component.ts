import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TableroService } from 'src/app/services/tablero.service';

@Component({
    selector: 'app-table-customers',
    providers: [MessageService],

    templateUrl: './table-customers.component.html',
    styleUrls: ['./table-customers.component.css'],
})
export class TableCustomersComponent implements OnInit {
    dataSource: any;
    tableDisplayColumns: string[] = ['id_usuario','nombre',  'numero_registros', 'resultado_proceso', 'fecha_creacion', 'fecha_geocodificacion', 'estatus_geocodificacion'];
    @Input() set data(data: any) {
        this.dataSource = data;
    }

    value: number = 0;

    constructor(private tableroService: TableroService) { }
    ngAfterVierInit(): void {
        throw new Error('Method not implement.');
    }
    ngOnInit(): void {
        this.getProyecto();
      }
      
      getProyecto(): void {
        this.tableroService.getProyecto()
          .subscribe(
            response => {
              this.dataSource = response.response; // Assign the array of projects
            },
            error => {
              console.log('Error al obtener proyecto', error);
            }
          );
      }
      
    }      