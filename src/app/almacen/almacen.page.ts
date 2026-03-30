import { Component, OnInit } from '@angular/core';
import { AlmacenService } from '../services/almacen.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-almacen',
  templateUrl: './almacen.page.html',
  styleUrls: ['./almacen.page.scss'],
  standalone: false
})
export class AlmacenPage implements OnInit {

  inventario: any[] = [];
  inventarioFiltrado: any[] = [];
  terminoBusqueda: string = '';
  movimientosPendientes: any[] = [];
  vista: string = 'inventario';
  private pollingInterval: any;

  constructor(
    private almacenService: AlmacenService,
    private router: Router,
    private alertCtrl: AlertController,
    private http: HttpClient
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.cargarTodo();
    this.pollingInterval = setInterval(() => {
      this.cargarTodo();
    }, 10000);
  }

  ionViewWillLeave() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  cargarTodo() {
    this.cargarInventario();
    this.cargarMovimientosPendientes();
  }

  cargarMovimientosPendientes() {
    this.http.get<any[]>(`${environment.apiUrl}/movimientos-pendientes`)
      .subscribe({
        next: (res) => {
          this.movimientosPendientes = res.map(m => {
            const fecha = new Date(m.createdAt).getTime();
            const ahora = new Date().getTime();
            const transcurrido = ahora - fecha;
            const limite24h = 24 * 60 * 60 * 1000;
            
            return {
              ...m,
              tiempoTranscurrido: Math.round(transcurrido / (60 * 60 * 1000)),
              vencido: transcurrido >= limite24h,
              porVencer: transcurrido >= (21 * 60 * 60 * 1000) && transcurrido < limite24h
            };
          });
        }
      });
  }

  cargarInventario() {
    this.almacenService.obtenerInventario().subscribe({
      next: (res: any[]) => {
        this.inventario = res;
        this.filtrarInventario();
      },
      error: (err: any) => {
        console.error('Error al cargar inventario', err);
      }
    });
  }

  filtrarInventario() {
    if (!this.terminoBusqueda) {
      this.inventarioFiltrado = this.inventario;
      return;
    }
    const busqueda = this.terminoBusqueda.toLowerCase().trim();
    this.inventarioFiltrado = this.inventario.filter(item => 
      (item.nombre?.toLowerCase().includes(busqueda)) ||
      (item.numeroSerie?.toLowerCase().includes(busqueda)) ||
      (item.codigoBarras?.toLowerCase().includes(busqueda))
    );
  }

  async eliminar(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Autorización requerida',
      message: 'Ingrese clave de Administrador o Almacenista',
      inputs: [
        {
          name: 'clave',
          type: 'password',
          placeholder: 'Clave'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Autorizar',
          handler: (data) => {
            this.validarYEliminar(id, data.clave);
          }
        }
      ]
    });

    await alert.present();
  }

  validarYEliminar(id: string, clave: string) {
    this.almacenService.validarAdmin(clave).subscribe({
      next: (res: any) => {
        if (res.autorizado) {
          this.almacenService.eliminarInventario(id).subscribe({
            next: () => {
              this.cargarInventario();
            },
            error: (err: any) => {
              console.error('Error al eliminar', err);
            }
          });
        } else {
          this.claveIncorrecta();
        }
      },
      error: () => {
        this.mostrarAlerta('Error', 'Error de conexión');
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

  editar(item: any) {
    this.router.navigate(['/registroalmacen'], {
      state: { inventario: item }
    });
  }

  cerrarSesion() {
    this.router.navigate(['/login']);
  }
}
