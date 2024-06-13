<div class="card flex justify-content-center">
  <p-button (click)="showDialog()" icon="pi pi-external-link" label="Importar"></p-button>
  <p-dialog header="Crear proyecto" [(visible)]="visible" [modal]="true" [breakpoints]="{ '960px': '75vw' }"
    [style]="{ width: '50vw', maxWidth: '1450px' }" [draggable]="false" [resizable]="true" [maximizable]="true">

    <!-- Componente Cargar Archivo -->
    <ng-container *ngIf="showCargarArchivo">
      <app-cargar-archivo (onData)="handleData($event)"></app-cargar-archivo>
    </ng-container>

    <!-- Componente Seleccionar Datos -->
    <ng-container *ngIf="!showCargarArchivo">
      <app-seleccionar-datos [json]="jsonData" [str]="stringData"></app-seleccionar-datos>
    </ng-container>

  </p-dialog>
</div>