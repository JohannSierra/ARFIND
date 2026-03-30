import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Admin } from '../services/admin';
import { AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone:false
})
export class AdminPage implements OnInit {

  usuarios: any[] = [];
  vista: string = 'usuarios';
  inventario: any[] = [];
  inventarioFiltrado: any[] = [];
  terminoBusqueda: string = '';
  movimientosPendientes: any[] = [];
  private pollingInterval: any;

  constructor(
    private admin: Admin, 
    private alertCtrl: AlertController,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {

  const nav = this.router.getCurrentNavigation();
  const estado = nav?.extras?.state as any;

  if (estado?.vista === 'almacen') {
    this.vista = 'almacen';
  }
}

ionViewWillEnter() {
  this.cargarTodo();
  // Polling cada 10 segundos
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
  this.cargarUsuarios();
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



  cargarUsuarios() {
    this.admin.obtenerUsuarios().subscribe(res => {
      this.usuarios = res;
    });
  }
cargarInventario() {
  this.http.get<any[]>(`${environment.apiUrl}/inventario`)
    .subscribe(res => {
      this.inventario = res;
      this.filtrarInventario();
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
editarProducto(producto: any) {
  this.router.navigate(['/registroalmacen'], {
    state: {
      inventario: producto,
      desdeAdmin: true
    }
  });
}

agregarProducto() {
  this.router.navigate(['/registroalmacen'], {
    state: {
      desdeAdmin: true
    }
  });
}

eliminarProducto(id: string) {

  this.http.delete(`${environment.apiUrl}/inventario/${id}`)
    .subscribe(() => {
      this.cargarInventario();
    });

}


  // ✏️ Editar usuario reutilizando formulario
  editar(usuario: any) {
    this.router.navigate(['/registro'], {
      state: { usuario }
    });
  }

  // 🔐 Pedir clave antes de eliminar
  async pedirAutorizacionEliminar(id: string) {

    const alert = await this.alertCtrl.create({
      header: 'Autorización requerida',
      message: 'Ingrese clave de Administrador',
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
  this.http.post<any>(`${environment.apiUrl}/validar-admin`, {
    clave
  }).subscribe({
    next: (res) => {
      if (res.autorizado) {
        this.admin.eliminarUsuario(id).subscribe(() => {
          this.cargarUsuarios();
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

  cerrarSesion() {
    this.router.navigate(['/login']);
  }
}
