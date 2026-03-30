import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlmacenService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // 📦 Obtener inventario
  obtenerInventario(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/inventario`);
  }

  // ➕ Agregar producto al inventario
  agregarInventario(data: any): Observable<any> {
    return this.http.post(`${this.api}/inventario`, data);
  }

  // ❌ Eliminar producto
  eliminarInventario(id: string): Observable<any> {
    return this.http.delete(`${this.api}/inventario/${id}`);
  }

  // 🔐 Validar clave de admin o almacenista
  validarAdmin(clave: string): Observable<any> {
    return this.http.post(`${this.api}/validar-admin`, { clave });
  }
}
