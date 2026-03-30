import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false
})
export class RegistroPage implements OnInit {

  nombre: string = '';
  codigo: string = '';
  puesto: string = '';
  puestos: string[] = ['Administrador', 'Cajero', 'Cocinero', 'Mantenimiento', 'Limpieza', 'Almacenista'];
  adminCode: string = '';
  modoEdicion = false;
  usuarioId: string = '';

  constructor(private alertCtrl: AlertController, private router: Router, private http: HttpClient) { }

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const estado = nav?.extras?.state as { usuario: any };

    if (estado?.usuario) {
      this.modoEdicion = true;
      this.usuarioId = estado.usuario._id;
      this.nombre = estado.usuario.nombre;
      this.puesto = estado.usuario.puesto;
    }
  }


  registrar() {

    if (!this.nombre || !this.puesto) {
      this.mostrarAlerta('Campos Incompletos', 'Por favor, completa todos los campos requeridos.');
      return;
    }

    const data = {
      nombre: this.nombre.trim(),
      puesto: this.puesto.trim()
    };

    if (this.modoEdicion) {

      this.http.put(`${environment.apiUrl}/usuario/${this.usuarioId}`, data)
        .subscribe({
          next: () => {
            this.router.navigate(['/admin']);
          },
          error: () => {
            this.mostrarAlerta('Error', 'Error al actualizar el perfil del empleado');
          }
        });

    } else {

      this.http.post<any>(`${environment.apiUrl}/registrar`, data)
        .subscribe({
          next: async (res) => {

            const alert = await this.alertCtrl.create({
              header: 'Empleado registrado',
              message: `Código generado: ${res.codigo}\nEntrégalo al empleado.`,
              buttons: ['OK'],
              cssClass: 'alert-html' // opcional para estilos
            });

            await alert.present();

            this.router.navigate(['/admin']);
          },
          error: () => {
            this.mostrarAlerta('Error', 'Error al registrar el empleado');
          }
        });
    }
  }



  async pedirClaveAdmin() {
    const alert = await this.alertCtrl.create({
      header: 'Clave de Administrador',
      inputs: [
        {
          name: 'clave',
          type: 'password',
          placeholder: 'Ingrese clave'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Autorizar',
          handler: (data) => {
            this.validarAdmin(data.clave);
          }
        }
      ]
    });

    await alert.present();
  }
  validarAdmin(clave: string) {
    this.http.post<any>(`${environment.apiUrl}/validar-admin`, {
      clave: clave
    }).subscribe({
      next: (res) => {
        if (res.autorizado) {
          this.registrar();
        } else {
          this.claveIncorrecta();
        }
      },
      error: () => {
        this.mostrarAlerta('Error de Conexión', 'No se pudo conectar con el servidor.');
      }
    });
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }


  claveIncorrecta() {
    this.alertCtrl.create({
      header: 'Error',
      message: 'Clave incorrecta',
      buttons: ['OK']
    }).then(a => a.present());
  }
}