import { FormGroup } from '@angular/forms';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TableConfig } from '../../models/table-config.model';
import { TableAction } from '../../models/table-action.model';
import { TABLE_ACTION } from '../../enums/table-action.enum';
import { ColumnValuePipe } from '../../pipes/column-value.pipe';
import { TableColumn } from '../../models/table-column.model';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableroService } from 'src/app/services/tablero.service';
import { GeocodificarComponent } from 'src/app/modules/geocodificar/geocodificar.component';
import { DialogComponent } from '../../../dialog/dialog.component';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';


@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  providers: [ConfirmationService, MessageService]
})
export class TableComponent implements OnInit, AfterViewInit {
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  originalData: any[] = [];
  tableDisplayColumns: string[] = ['id_proyecto', 'id_usuario', 'nombre', 'numero_registros', 'resultado_proceso', 'fecha_creacion', 'fecha_geocodificacion', 'estatus_geocodificacion'];
  tableColumns: TableColumn[] = [];
  selection = new SelectionModel<any>(true, []);
  tableConfig: TableConfig | undefined;
  currentFilterValue: string = '';
  isEditMode = false;
  currentRowIndex: number | undefined;
  formGroup: FormGroup = new FormGroup({});
  value: number = 0;
  visibleImportar: boolean = false;
  visibleGeocodificar: boolean = false;
  first: number = 0;
  rows: number = 5;
  filteredData: any[] = [];
  exportClickCount = 0;
  isDialogVisible: boolean = false;
  selectedRowIndex: number = -1;
  selectedProject: any;
  workbook: XLSX.WorkBook | null = null;



  constructor(private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private tableroService: TableroService,
    private router: Router) { }

  @ViewChild(MatSort) sort!: MatSort;
  @Input() set data(data: any[]) {
    this.originalData = data;
    this.filteredData = data;
    this.updatePagedData();
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }
  @Input() set columns(columns: TableColumn[]) {
    this.tableColumns = columns;
    this.tableDisplayColumns = this.tableColumns.map((col) => col.def);
  }
  @Input() set config(config: TableConfig) {
    this.setConfig(config);
  }
  @Input() createNewFormGroup!: (item: any) => FormGroup;
  @Input() isLoading = false;

  @Output() select: EventEmitter<any> = new EventEmitter();
  @Output() action: EventEmitter<TableAction> = new EventEmitter();

  @ViewChild('geocodificarComponent') geocodificarComponent!: GeocodificarComponent;
  @ViewChild('dialogComponent') dialogComponent!: DialogComponent;





  private getColumnValue: ColumnValuePipe = new ColumnValuePipe();

  ngOnInit(): void {
    // this.getProyecto();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (data, sortHeaderId) => {
      return this.getValue(data, sortHeaderId);
    };
  }

  onSelect(row: any, index: number) {
    if (this.selectedRowIndex === index) {
      this.selectedRowIndex = -1;
      this.selection.clear();
      this.selectedProject = null;
    } else {
      this.selectedRowIndex = index;
      this.selection.clear();
      this.selection.select(row);
      this.selectedProject = row;
    }
    this.select.emit(this.selection.selected);
  }



  setConfig(config: TableConfig) {
    this.tableConfig = config;
    if (this.tableConfig.isSelectable) {
      this.tableDisplayColumns.unshift('select');
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      // this.onSelect();
      return;
    }
    this.selection.select(...this.dataSource.data);
    // this.onSelect();
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  onCancel() {
    this.isEditMode = false;
    this.currentRowIndex = undefined;
  }

  onDelete(row: any) {
    this.action.emit({ action: TABLE_ACTION.DELETE, row });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.currentFilterValue = filterValue.trim().toLowerCase();
    this.filteredData = this.originalData.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(this.currentFilterValue)
      )
    );
    this.first = 0;
    this.updatePagedData();
  }

  updatePagedData() {
    const start = this.first;
    const end = this.first + this.rows;
    this.dataSource.data = this.filteredData.slice(start, end);
  }

  getValue(row: any, columName: string): string | number {
    const column = this.tableColumns.find((col) => col.dataKey === columName) as TableColumn;
    if (column) {
      const value = this.getColumnValue.transform(row, column);
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
    }
    return '';
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.updatePagedData();
  }

  showDialogImportar() {
    this.visibleImportar = true;
  }

  showDialogGeocodificar() {
    if (this.selection.selected.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Por favor, seleccione un proyecto' });
      return;
    }
    // console.log(this.selection.selected[0]);
    this.visibleGeocodificar = true;
  }

  onEliminar(event: Event) {
    if (this.selection.selected.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Por favor, seleccione un proyecto' });
      return;
    }

    const selectedProject = this.selection.selected[0];
    const proyectoId = selectedProject.id_proyecto;

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Estas seguro que quieres eliminar el registro? Esta acción será irreversible.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si',
      rejectLabel: 'No',
      accept: () => {
        this.tableroService.eliminarProyecto(proyectoId).subscribe(
          response => {
            setTimeout(() => {
            this.reloadData();
          }, 2000);
            // this.selection.clear();
            // this.selectedRowIndex = -1;
            // this.selectedProject = null;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proyecto eliminado correctamente' });
            // setTimeout(() => {
            //   window.location.reload();
            // }, 2000);
          },
          error => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el proyecto' });
          }
        );
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelado', detail: 'No se ha eliminado el proyecto' });
      }
    });
  }

  reloadData() {
    this.tableroService.getProyectos().subscribe(
      (data: any) => {
        this.setData(data);
        this.updatePagedData();
        this.resetSelection();
      },
      error => {
        console.error('Error al cargar los proyectos:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los proyectos' });
        this.setData([]);
        this.updatePagedData();
      }
    );
  }

  setData(data: any) {
    if (Array.isArray(data)) {
      this.originalData = data;
      this.filteredData = data;
    } else if (data && typeof data === 'object') {
      const dataArray = Object.values(data).find(value => Array.isArray(value));
      this.originalData = Array.isArray(dataArray) ? dataArray : [];
      this.filteredData = Array.isArray(dataArray) ? dataArray : [];
    } else {
      console.error('Formato de datos inesperado:', data);
      this.originalData = [];
      this.filteredData = [];
    }
  }

  resetSelection() {
    this.selection.clear();
    this.selectedRowIndex = -1;
    this.selectedProject = null;
  }

  onExportar(event: Event) {
    if (this.selection.selected.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Por favor, seleccione un proyecto' });
      return;
    }

    const selectedProject = this.selection.selected[0];
    const proyectoId = selectedProject.id_proyecto;

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Está seguro de exportar el proyecto?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si',
      rejectLabel: 'No',
      accept: () => {
        this.tableroService.exportarProyecto(proyectoId).subscribe(
          response => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proyecto exportado correctamente' });
            this.createExcelFile(response, selectedProject);
          },
          error => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo exportar el proyecto' });
            console.error(error);
          }
        );
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelado', detail: 'No se exportó el proyecto' });
      }
    });
  }

  createExcelFile(data: any, projectInfo: any) {
    const workbook = XLSX.utils.book_new();

    const renameKeys = (obj: any, keyMap: { [key: string]: string }) => {
      return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key;
        acc[newKey] = obj[key];
        return acc;
      }, {} as any);
    };

    const formatDateTime = (isoString: string): string => {
      const date = new Date(isoString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(',', '');
    };

    const keyMap = {
      id_req: "ID Registro",
      nombre: "Nombre",
      calle: "Calle",
      numero_exterior: "Número Exterior",
      numero_interior: "Número Interior",
      colonia: "Colonia",
      codigo_postal: "Código Postal",
      municipio: "Municipio",
      estado: "Estado",
      region: "Región",
      telefono: "Teléfono",
      correo: "Correo",
      referencias_dom: "Referencias",
      comentarios_dom: "Comentarios",
      coordx: "Longitud",
      coordy: "Latitud",
      nse: "NSE",
      ageb: "AGEB",
      esquina1: "Esquina 1",
      esquina2: "Esquina 2",
      scoring: "Scoring",
      georesultado: "Resultado Geocodificación",
      id_proyecto: "ID Proyecto",
      cuadrante: "Cuadrante",
      id_proceso: "Numero del Proceso",
    };

    const combinedData = data.direcciones_entrada.map((entrada: any, index: number) => {
      const salida = data.direcciones_salida[index] || {};
      const entradaRenamed = renameKeys(entrada, keyMap);
      const salidaRenamed = renameKeys(salida, keyMap);

      return {
        ...Object.keys(entradaRenamed).reduce((acc, key) => {
          acc[`${key} (Entrada)`] = entradaRenamed[key];
          return acc;
        }, {} as any),
        ...Object.keys(salidaRenamed).reduce((acc, key) => {
          if (!['ID Registro', 'Nombre', 'Teléfono', 'Correo'].includes(key)) {
            acc[`${key} (Salida)`] = salidaRenamed[key];
          }
          return acc;
        }, {} as any)
      };
    });

    const wsCombined = XLSX.utils.json_to_sheet(combinedData);
    XLSX.utils.book_append_sheet(workbook, wsCombined, 'Direcciones');

    // if (data.direcciones_ne && data.direcciones_ne.length > 0) {
    const wsNE = XLSX.utils.json_to_sheet(data.direcciones_ne.map((item: any) => renameKeys(item, keyMap)));
    XLSX.utils.book_append_sheet(workbook, wsNE, 'Direcciones No Encontradas');
    // }

    const projectData = data.proyecto.map((item: any) => {
      const renamedItem = renameKeys(item, {
        id_proyecto: "ID Proyecto",
        nombre: "Nombre del Proyecto",
        fecha_creacion: "Fecha de Creación",
        inicio_geocodificacion: "Inicio de Geocodificación",
        fecha_geocodificacion: "Fin de Geocodificación",
        resultado_proceso: "Resultado del Proceso",
        numero_registros: "Número de Registros",
        estatus_geocodificacion: "Estatus de Geocodificación",
        id_usuario: "ID Usuario",
        tiempo_geocodificacion: "Tiempo de Geocodificación"
      });

      renamedItem["Fecha de Creación"] = formatDateTime(item.fecha_creacion);
      renamedItem["Inicio de Geocodificación"] = formatDateTime(item.inicio_geocodificacion);
      renamedItem["Fin de Geocodificación"] = formatDateTime(item.fecha_geocodificacion);

      return renamedItem;
    });

    const wsInfo = XLSX.utils.json_to_sheet(projectData);
    XLSX.utils.book_append_sheet(workbook, wsInfo, 'Información del Proyecto');

    XLSX.writeFile(workbook, `${projectInfo.nombre}-resultados.xlsx`);
  }

  navegarARuta(){
    if (this.selection.selected.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Por favor, seleccione un proyecto' });
      return;
    }
    this.router.navigate(['gci'], {
      state: { proyecto: this.selectedProject }
    });

  }
}
