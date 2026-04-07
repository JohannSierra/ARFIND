import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlmacenService } from '../services/almacen.service';
import { HttpClient } from '@angular/common/http';
import { AlertController, ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
inventario: any[] = [];
inventarioFiltrado: any[] = [];

filtro: string = 'Todos';

  solicitudes: any[] = [];
  usuario: any;
  private pollingInterval: any;

  constructor(
    private router: Router,
    private almacen: AlmacenService,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.cargarInventario();
  }

  ionViewWillEnter() {
    this.refreshData();
    this.pollingInterval = setInterval(() => {
      this.refreshData();
    }, 10000);
  }

  ionViewWillLeave() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  refreshData() {
    this.cargarInventario();
    this.verificarAlertas();
  }

async verificarAlertas() {
  this.http.get<any[]>(`${environment.apiUrl}/movimientos/${this.usuario._id}`)
    .subscribe({
      next: async (movs) => {
        const ahora = new Date().getTime();
        const limite24h = 24 * 60 * 60 * 1000;
        const limite21h = 21 * 60 * 60 * 1000;

        for (let m of movs) {
          const fechaPréstamo = new Date(m.createdAt).getTime();
          const transcurrido = ahora - fechaPréstamo;

          if (transcurrido >= limite21h && transcurrido < limite24h) {
            const horasRestantes = Math.round((limite24h - transcurrido) / (60 * 60 * 1000));
            this.mostrarToastAlerta(`AVISO: Devolución pendiente en aprox. ${horasRestantes} horas.`);
            break; 
          } else if (transcurrido >= limite24h) {
            this.mostrarToastAlerta(`ALERTA: PRÉSTAMO VENCIDO. Favor de devolver herramientas.`);
            break;
          }
        }
      }
    });
}

async mostrarToastAlerta(msg: string) {
  const toast = await this.toastCtrl.create({
    message: msg,
    duration: 5000,
    position: 'top',
    color: 'warning',
    buttons: [{ text: 'OK', role: 'cancel' }]
  });
  await toast.present();
}


obtenerCantidadSolicitada(id: string): number {
  const existe = this.solicitudes.find(s => s._id === id);
  return existe ? existe.cantidad : 0;
}


cargarInventario() {
  this.almacen.obtenerInventario().subscribe({
    next: (res) => {
      this.inventario = res;
      this.filtrar();
    },
    error: () => {
      this.mostrarAlerta('Error', 'Error al cargar inventario');
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

filtrar() {
  let list = this.filtro === 'Todos' 
    ? this.inventario.filter(item => item.estado !== 'Baja') 
    : this.inventario.filter(item => item.categoria === this.filtro && item.estado !== 'Baja');

  const agrupado = new Map<string, any>();
  for (let item of list) {
    if (item.tipo === 'Consumible') {
      agrupado.set(item._id, { ...item });
    } else {
      if (!agrupado.has(item.nombre)) {
        agrupado.set(item.nombre, { 
          ...item, 
          cantidad: item.estado === 'Disponible' ? 1 : 0 
        });
      } else {
        const exist = agrupado.get(item.nombre);
        if (item.estado === 'Disponible') {
          exist.cantidad += 1;
        }
      }
    }
  }

  this.inventarioFiltrado = Array.from(agrupado.values()).map(g => {
    if (g.tipo !== 'Consumible') {
      g.estado = g.cantidad > 0 ? 'Disponible' : 'Agotado';
    }
    return g;
  });
}

agregarRapido(item: any) {
  const solicitadoActual = this.obtenerCantidadSolicitada(item._id);
  const maxAllow = (item.tipo === 'Herramienta' || item.tipo === 'Equipo') ? Math.min(4, item.cantidad) : item.cantidad;

  if (solicitadoActual + 1 > maxAllow) {
    this.mostrarAlerta('Límite Alcanzado', 'Has alcanzado el límite permitido (Max 4 por herramienta) o superado el stock disponible.');
    return;
  }

  this.agregarSolicitud({
    ...item,
    solicitado: 1
  });
}

async agregarCantidad(item: any) {
  const maxAllow = (item.tipo === 'Herramienta' || item.tipo === 'Equipo') ? Math.min(4, item.cantidad) : item.cantidad;

  const alert = await this.alertCtrl.create({
    header: 'Cantidad',
    inputs: [
      {
        name: 'cantidad',
        type: 'number',
        placeholder: `Ingrese cantidad (Max ${maxAllow})`
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Agregar',
        handler: (data) => {
          const cantidad = Number(data.cantidad);
          if (!cantidad || cantidad <= 0) return;

          const solicitadoActual = this.obtenerCantidadSolicitada(item._id);
          if (solicitadoActual + cantidad > maxAllow) {
            this.mostrarToastAlerta(`No puedes agregar más de ${maxAllow} unidades.`);
            return false; // Prevent closing the alert if they exceed the limit
          }

          this.agregarSolicitud({
            ...item,
            solicitado: cantidad
          });
          return true;
        }
      }
    ]
  });

  await alert.present();
}

  agregarSolicitud(item: any) {
    if (!item.solicitado || item.solicitado <= 0) {
      this.mostrarAlerta('Cantidad Inválida', 'Por favor, ingrese una cantidad mayor a 0');
      return;
    }

    const maxAllow = (item.tipo === 'Herramienta' || item.tipo === 'Equipo') ? Math.min(4, item.cantidad) : item.cantidad;

    if (item.solicitado > maxAllow) {
      this.mostrarAlerta('Stock Insuficiente', 'No hay suficiente stock o se supera el límite de 4 unidades por herramienta.');
      return;
    }

    const existe = this.solicitudes.find(s => s._id === item._id);

    if (existe) {
      existe.cantidad += item.solicitado;
    } else {
      this.solicitudes.push({
        _id: item._id,
        nombre: item.nombre,
        tipo: item.tipo, 
        cantidad: item.solicitado,
        imagen: item.imagen // Add image to cart
      });
    }

    item.solicitado = 0;
  }

  eliminarSolicitud(s: any) {
    this.solicitudes = this.solicitudes.filter(x => x !== s);
  }

enviarSolicitud() {

  if (this.solicitudes.length === 0) return;

  const data = {
    usuario: this.usuario.nombre,
    usuarioId: this.usuario._id,
    productos: this.solicitudes,
    tipo: 'salida',
    fecha: new Date()
  };

  this.http.post(`${environment.apiUrl}/movimientos`, data)
    .subscribe({
      next: (res: any) => {
        let msj = 'Acude a almacén y toma lo siguiente:\n\n';
        if (res.asignados) {
          res.asignados.forEach((a: any) => {
             if (a.numeroSerie) {
               msj += `· ${a.nombre} (Serie: ${a.numeroSerie})\n`;
             } else {
               msj += `· ${a.nombre} (x${a.cantidad})\n`;
             }
          });
        }
        this.mostrarAlerta('Solicitud Aprobada', msj);
        this.solicitudes = [];
        this.cargarInventario();
      },
      error: (err) => {
        console.error(err);
        this.mostrarAlerta('Error', err.error?.error || 'Error al procesar la solicitud');
      }
    });
}


  cerrarSesion() {
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}
