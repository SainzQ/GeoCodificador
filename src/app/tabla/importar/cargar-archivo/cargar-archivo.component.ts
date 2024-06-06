import { Component, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { FileUploadEvent } from 'primeng/fileupload';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-cargar-archivo',
  templateUrl: './cargar-archivo.component.html',
  providers: [MessageService],
  styleUrls: ['./cargar-archivo.component.css']
})

export class CargarArchivoComponent {

  workbook: XLSX.WorkBook | null = null;
  nombreProyecto: string | undefined;
  uploadedFiles: File[] = [];
  botonSubirDeshabilitado = true;
  dropdownDeshabilitado = true;
  hojasExcel: string[] = [];
  hojaSeleccionada: string | undefined;
  datosExcel: any[] = [];

  @ViewChild('nombreProyectoInput') nombreProyectoInput!: NgModel;
  @ViewChild('dropdownHoja') dropdownHoja!: NgModel; //Suscribirse al componente hijo

  constructor(private messageService: MessageService) { }

  validarNombreProyecto() {
    const nombreProyecto = this.nombreProyecto?.trim(); //Quita espacios al inicio y al final
    const expresionRegular = /^[a-zA-Z0-9\s]+$/; // regex para permitir solo letras, números y espacios

    this.botonSubirDeshabilitado = !nombreProyecto || !expresionRegular.test(nombreProyecto);
  }


  onUpload(event: FileUploadEvent) {
    const nombreProyecto = this.nombreProyectoInput.value?.trim();
    const expresionRegular = /^[a-zA-Z0-9\s]+$/;

    if (!nombreProyecto || !expresionRegular.test(nombreProyecto)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Nombre de proyecto inválido',
        detail: 'Por favor, ingrese un nombre de proyecto válido antes de cargar archivos.'
      });
      this.nombreProyectoInput.control?.markAsDirty();
      this.nombreProyectoInput.control?.markAsTouched();
      return;
    }

    // console.log(this.nombreProyecto);
    console.log(this.nombreProyectoInput.value);

    for (let file of event.files) {
      this.uploadedFiles.push(file);
      this.leerExcel(file);
    }
    this.dropdownDeshabilitado = false;
    this.messageService.add({ severity: 'info', summary: 'Archivo cargado!', detail: '' });
  }

  leerExcel(file: File) {
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const data = new Uint8Array(fileReader.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      this.workbook = workbook;
      const sheet_name_list = workbook.SheetNames;
      this.hojasExcel = sheet_name_list;
      console.log(this.hojasExcel);
    };

    fileReader.readAsArrayBuffer(file);
  }

  obtenerDatosHojaEnJSON() {
    if (this.workbook && this.hojaSeleccionada) {
      const worksheet = this.workbook.Sheets[this.hojaSeleccionada];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      this.datosExcel = jsonData;
      console.log(this.datosExcel);

    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error al obtener datos de hoja',
        detail: 'Por favor, seleccione una hoja de Excel antes de obtener los datos o intente recargar la pagina.'
      });
      this.dropdownHoja.control?.markAsDirty();
    }
  }

}
