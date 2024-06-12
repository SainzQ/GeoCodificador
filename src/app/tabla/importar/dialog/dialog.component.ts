import { Component } from '@angular/core';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent {
  visible: boolean = false;
  showCargarArchivo: boolean = true;
  jsonData: any;
  recargar: number | undefined;
  stringData: string | undefined;


  showDialog() {
    this.visible = true;
  }

  handleData(event: { json: any, str: string }) {
    this.jsonData = event.json;
    this.stringData = event.str;
    this.showCargarArchivo = false;
  }

  handleDataFinish(event: { recargar: number }) {
    this.recargar = event.recargar;
  }
}
