import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly ROL_KEY = 'rol';

  login(rol: string) {
  localStorage.setItem('rol', rol.trim());
  localStorage.setItem('isLogged', 'true');
}

getRol(): string {
  return (localStorage.getItem('rol') || '').trim();
}

isAuthenticated(): boolean {
  return localStorage.getItem('isLogged') === 'true';
}

logout() {
  localStorage.clear();
}

}
