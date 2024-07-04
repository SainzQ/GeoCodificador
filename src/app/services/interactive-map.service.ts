import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DireccionActualizacion } from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class InteractiveMapService {
  private url: string = 'http://192.168.40.1:5985/GCWS/api/interactivo/';

  constructor(private _http: HttpClient) { }

  getAddress(id_proyecto: number) {
    let body = {
      'id_proyecto': id_proyecto
    }

    return this._http.post(this.url + 'traerDirecciones', body);
  }

  actualizarDireccion(data: DireccionActualizacion): Observable<any> {
    return this._http.put(this.url + 'actualizarDireccion', data);
  }
}
