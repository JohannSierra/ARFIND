import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Admin {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerUsuarios() {
    return this.http.get<any[]>(`${this.api}/usuarios`);
  }

  eliminarUsuario(id: string) {
  return this.http.delete(`${this.api}/usuario/${id}`);
}


  actualizarUsuario(id: string, data: any) {
    return this.http.put(`${this.api}/usuarios/${id}`, data);
  }
}
