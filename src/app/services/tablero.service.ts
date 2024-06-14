import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TableroService {
  private apiUrl = 'http://192.168.40.1:5985/GCSW/api/proyectos/traerProyecto/1';

  constructor(private http: HttpClient) {}

  getProyecto(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
