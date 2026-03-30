import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(route: any): boolean {

  const rolUsuario = this.auth.getRol();
  const rolesPermitidos: string[] = route.data?.['roles'];

  console.log('ROL USUARIO:', rolUsuario);
  console.log('ROLES PERMITIDOS:', rolesPermitidos);

  if (!this.auth.isAuthenticated()) {
    this.router.navigate(['/login']);
    return false;
  }

  if (!rolesPermitidos || !rolesPermitidos.includes(rolUsuario)) {
    this.router.navigate(['/login']);
    return false;
  }

  return true;
}


}
