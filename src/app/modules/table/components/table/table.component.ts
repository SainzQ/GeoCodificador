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


  constructor(private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private tableroService: TableroService) { }

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
      accept: () => {
        this.tableroService.eliminarProyecto(proyectoId).subscribe(
          response => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proyecto eliminado correctamente' });
            setTimeout(() => {
              window.location.reload();
            }, 2000);
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

}
