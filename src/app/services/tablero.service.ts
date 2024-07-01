import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JsonObject } from '../modules/seleccionar-datos/seleccionar-datos.component';

@Injectable({
  providedIn: 'root'
})
export class TableroService {
  private apiUrl = 'http://192.168.40.1:5985/GCSW/api/proyectos/traerProyecto/6';

  constructor(private http: HttpClient) {}

  getProyecto(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  exportarProyecto(id_proyecto: number): Observable<any> {
    const url = `http://192.168.40.1:5985/GCSW/api/proyectos/traerDirecciones/`;
    return this.http.post<any>(url, {id_proyecto});
  }

  geocodificarProyecto(nuevoJSON: JsonObject): Observable<any> {
    const url = 'http://192.168.40.1:5985/GCSW/api/proyectos/geocodificar';
    return this.http.post<any>(url,  nuevoJSON );
  }

  eliminarProyecto(id_proyecto: number): Observable<any> {
    const url = `http://192.168.40.1:5985/GCSW/api/proyectos/eliminar/`;
    return this.http.put<any>(url, {id_proyecto});
  }



}

