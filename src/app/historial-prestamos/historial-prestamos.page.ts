import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-historial-prestamos',
  templateUrl: './historial-prestamos.page.html',
  styleUrls: ['./historial-prestamos.page.scss'],
  standalone: false
})
export class HistorialPrestamosPage implements OnInit {

  movimientos: any[] = [];
  usuario: any;

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.cargarHistorial();
  }

  async cargarHistorial() {
    const loading = await this.loadingCtrl.create({ message: 'Cargando...' });
    await loading.present();

    this.http.get<any[]>(`${environment.apiUrl}/movimientos/${this.usuario._id}`)
      .subscribe({
        next: (res) => {
          this.movimientos = res;
          loading.dismiss();
        },
        error: (err) => {
          console.error(err);
          loading.dismiss();
        }
      });
  }

  async devolver(movimiento: any) {
    if (movimiento.estadoDevolucion === 'solicitada') {
      this.pedirCodigoLiberacion(movimiento);
    } else {
      this.solicitarDevolucion(movimiento);
    }
  }

  solicitarDevolucion(mov: any) {
    this.http.post(`${environment.apiUrl}/solicitar-devolucion`, { movimientoId: mov._id })
      .subscribe({
        next: () => {
          this.mostrarAlerta('Solicitud Enviada', 'Acude a almacén para entregar tu equipo. Te darán un PIN para confirmar.');
          this.cargarHistorial(); 
        },
        error: () => {
          this.mostrarAlerta('Error', 'No se pudo solicitar la devolución');
        }
      });
  }

  async pedirCodigoLiberacion(mov: any) {
    const alert = await this.alertCtrl.create({
      header: 'Código de Liberación',
      message: 'Ingrese el PIN provisto por el almacenista',
      inputs: [
        {
          name: 'codigo',
          type: 'text',
          placeholder: 'Código de 6 dígitos'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: (data) => {
            if (data.codigo) {
              this.procesarDevolucion(mov, data.codigo);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  procesarDevolucion(mov: any, codigo: string) {
    const data = {
      usuario: this.usuario.nombre,
      usuarioId: this.usuario._id,
      productos: mov.productos,
      movimientoId: mov._id,
      codigo: codigo
    };

    this.http.post(`${environment.apiUrl}/confirmar-devolucion`, data)
      .subscribe({
        next: () => {
          this.mostrarAlerta('Éxito', 'Herramientas devueltas correctamente');
          this.cargarHistorial(); 
        },
        error: () => {
          this.mostrarAlerta('Error', 'Código inválido o error al procesar');
        }
      });
  }

  async mostrarAlerta(header: string, message: string) {
    const a = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await a.present();
  }

}
