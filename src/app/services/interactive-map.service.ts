import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class InteractiveMapService {
  private url: string = 'http://192.168.40.1:5985/GCWS/api/interactivo/traerDirecciones';

  constructor(private _http: HttpClient) { }

  getAddress(id_proyecto: number) {
    let body = {
      'id_proyecto': id_proyecto
    }

    return this._http.post(this.url, body);
  }
}
