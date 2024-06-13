import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'GeoCodificador';
  @Input() recargar: number = 0;

  recargarComponente() {
    this.recargar += 1;
  }

  handleDataFinish(event: { recargar: number }) {
    // this.jsonData = event.json;
    // this.recargar = event.recargar;
    this.recargar = event.recargar;
  }

}