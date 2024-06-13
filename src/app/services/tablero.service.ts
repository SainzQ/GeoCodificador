import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TableroService {
  private apiUrl = 'http://localhost:8081/api/proyectos/traerProyecto/2';

  constructor(private http: HttpClient) {}

  getProyecto(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
