import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { JsonObject } from '../seleccionar-datos/seleccionar-datos.component';

@Injectable({
  providedIn: 'root'
})
export class ExportarService {
  private apiUrl = 'http://192.168.40.1:5985/GCSW/api/proyectos';

  constructor(private http: HttpClient) { }

  exportar(nuevoJSON: JsonObject[]) {
    const url = `${this.apiUrl}/importar`;
    return this.http.post(url, nuevoJSON).pipe(
      map(response => {
        // console.log(response);
        return response;
      })
    );
  }
}
