import { FormControl, FormGroup } from '@angular/forms';
import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { TableConfig } from '../../models/table-config.model';
import { TableAction } from '../../models/table-action.model';
import { TABLE_ACTION } from '../../enums/table-action.enum';
import { ColumnValuePipe } from '../../pipes/column-value.pipe';
import { TableColumn } from '../../models/table-column.model';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';

@Component({
    selector: 'app-table',

    templateUrl: './table.component.html',
    styleUrls: ['./table.component.css'],
    providers: [ConfirmationService, MessageService]

})
export class TableComponent implements OnInit, AfterViewInit {
    dataSource: MatTableDataSource<any> = new MatTableDataSource();
    tableDisplayColumns: string[] = [];
    tableColumns: TableColumn[] = [];
    selection = new SelectionModel<any>(true, []);
    tableConfig: TableConfig | undefined;
    currentFilterValue: string = '';
    isEditMode = false;
    currentRowIndex: number | undefined;
    formGroup: FormGroup = new FormGroup({});
    value: number = 0;
    visible: boolean = false;
    showDialog() {
        this.visible = true;
      }

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) matSort!: MatSort;

    @Input() set data(data: any[]) {
        console.log('Setting data', data);//Debug
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.matSort;
    }
    @Input() set columns(columns: TableColumn[]) {
        console.log('Setting columns', columns);
        this.tableColumns = columns;
        this.tableDisplayColumns = this.tableColumns.map((col) => col.def);
    }
    @Input() set config(config: TableConfig) {
        this.setConfig(config);
    }
    @Input() createNewFormGroup!: (item: any) => FormGroup;
    @Input() isLoading = false;//spinner

    @Output() select: EventEmitter<any> = new EventEmitter();
    @Output() action: EventEmitter<TableAction> = new EventEmitter();

    private getColumnValue: ColumnValuePipe = new ColumnValuePipe();


    constructor(private confirmationService: ConfirmationService, private messageService: MessageService) { }

    ngOnInit(): void {
        let interval = setInterval(() => {
            this.value = this.value + Math.floor(Math.random() * 10) + 1;
            if (this.value >= 100) {
                this.value = 100;
                this.messageService.add({ severity: 'info', summary: 'Success', detail: 'Process Completed' });
                clearInterval(interval);
            }
        }, 2000);
    }

    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.matSort;
        // this.dataSource.sort = this.matSort;
        this.dataSource.sortingDataAccessor = (data, sortHeaderId) => {
            return this.getValue(data, sortHeaderId);
        };
    }

    onSelect() {
        this.select.emit(this.selection.selected);
    }

    setConfig(config: TableConfig) {
        this.tableConfig = config;
        if (this.tableConfig.isSelectable) {
            this.tableDisplayColumns.unshift('select');
        }
        if (this.tableConfig.showActions) {
            this.tableDisplayColumns.push('actions')
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
            this.onSelect();
            return;
        }
        this.selection.select(...this.dataSource.data);
        this.onSelect();
    }
    checkboxLabel(row?: any): string {
        if (!row) {
            return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
    }
    onEdit(row: any, index: number) {
        this.isEditMode = true;
        this.currentRowIndex = index;
        this.formGroup = this.createNewFormGroup(row);
        this.action.emit({ action: TABLE_ACTION.EDIT, row });
    }

    onCancel() {
        this.isEditMode = false;
        this.currentRowIndex = undefined;
    }

    onSave() {
        const newRow = this.formGroup.value;
        console.log('NewRow', newRow);
        this.action.emit({ action: TABLE_ACTION.SAVE, row: newRow });
        this.isEditMode = false;
        this.currentRowIndex = undefined;

    }
    onDelete(row: any) {
        this.action.emit({ action: TABLE_ACTION.DELETE, row });
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
        this.currentFilterValue = filterValue;
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

    
    eliminar(event: Event) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: '¿Estas seguro que quieres eliminar el registro?, Esta acción sera irreversible',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.messageService.add({ severity: 'success', summary: 'Aceptado', detail: 'Proyecto eliminado correctamente' });
            },
            reject: () => {
                this.messageService.add({ severity: 'error', summary: 'Cancelado', detail: 'No se a eliminado el proyecto' });
            }
        });
    
        // this.confirmationService.confirm({
        //     message: '¿Está seguro que desea eliminar el registro? Esta acción será irreversible.',
        //     acceptLabel: 'Sí',
        //     rejectLabel: 'No',
        //     accept: () => {
        //         this.messageService.add({
        //             severity: 'success',
        //             summary: 'Eliminado',
        //             detail: 'Proyecto eliminado correctamente',
        //             icon: 'pi pi-check'
        //         });
        //     },
        //     reject: (type: ConfirmEventType) => {
        //         switch (type) {
        //             case ConfirmEventType.REJECT:
        //                 this.messageService.add({
        //                     severity: 'info',
        //                     summary: 'Rechazado',
        //                     detail: 'Has rechazado la eliminación',
        //                     icon: 'pi pi-times'
        //                 });
        //                 break;
        //             case ConfirmEventType.CANCEL:
        //                 this.messageService.add({
        //                     severity: 'warn',
        //                     summary: 'Cancelado',
        //                     detail: 'La eliminación ha sido cancelada',
        //                     icon: 'pi pi-exclamation-triangle'
        //                 });
        //                 break;
        //         }
        //     }
        // });
    }
}      