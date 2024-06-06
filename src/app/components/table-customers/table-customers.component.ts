import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-table-customers',
    providers: [MessageService],

    templateUrl: './table-customers.component.html',
    styleUrls: ['./table-customers.component.css'],
})
export class TableCustomersComponent implements OnInit{
    dataSource: any = [];
    tableDisplayColumns:  string[] = ['id', 'nombreproyecto', 'usuario', 'nregistros', 'rgeocodificacion', 'fechacrea', 'fechageo', 'estatus'];
    @Input() set data(data: any){
        this.dataSource = data;
    }

    value: number = 0;

    constructor(private messageService: MessageService) {}

    ngOnInit() {
        let interval = setInterval(() => {
            this.value = this.value + Math.floor(Math.random() * 10) + 1;
            if (this.value >= 100) {
                this.value = 100;
                this.messageService.add({ severity: 'info', summary: 'Success', detail: 'Process Completed' });
                clearInterval(interval);
            }
        }, 2000);
    }

     }
// listProyectos: Proyecto[]=[];
//     constructor (private _proyectoService: ProyectoServide){}
//     ngOnInit():void{
// this.obtenerProyectos();
//     }
//     obtenerProyectos(){
//         this._proyectoService.getProyectos().suscribe( data=>{
// this.listProyectos = data;
//         })
//     }
 
