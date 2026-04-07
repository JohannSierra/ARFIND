import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { AlertController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {

  codigo = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthService,
    private alertCtrl: AlertController,
  ) { }

  private rutasPorRol: Record<string, string> = {
    Administrador: '/admin',
    Cajero: '/home',
    Cocinero: '/home',
    Mantenimiento: '/home',
    Limpieza: '/home',
    Almacenista: '/almacen'
  };

  async iniciarSesion() {
    const codigoLimpio = this.codigo.trim();

    if (!/^\d{6}$/.test(codigoLimpio)) {
      await this.mostrarAlerta('Error', 'Código inválido');
      return;
    }

    this.http.post<any>(`${environment.apiUrl}/login`, {
      codigo: codigoLimpio
    }).subscribe({
      next: async (res) => {
        console.log('LOGIN OK:', res);

        // GUARDA TODO EL USUARIO
        localStorage.setItem('usuario', JSON.stringify(res));

        this.auth.login(res.puesto);

        const ruta = this.rutasPorRol[res.puesto];

        if (!ruta) {
          await this.mostrarAlerta('Error', 'Rol no autorizado');
          return;
        }
        this.router.navigate([ruta]);
      }

      ,
      error: async () => {
        await this.mostrarAlerta('Error', 'Código incorrecto');
      }
    });
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }


}
