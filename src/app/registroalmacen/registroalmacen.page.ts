import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-registroalmacen',
  templateUrl: './registroalmacen.page.html',
  styleUrls: ['./registroalmacen.page.scss'],
  standalone: false
})
export class RegistroalmacenPage implements OnInit {

  inventario: any = {
    nombre: '',
    categoria: '',
    tipo: '',
    cantidad: 1,
    estado: 'Disponible',
    numeroSerie: '',
    codigoBarras: '',
    observaciones: '',
    imagen: '', // URL or Base64 placeholder
    series: ['']
  };

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
         this.inventario.imagen = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  seleccionarImagen() {
    document.getElementById('fileInput')?.click();
  }

  modoEdicion = false;
  desdeAdmin = false;
  catalogoInventario: any[] = [];

  customTrackBy(index: number, obj: any): any {
    return index;
  }

  ajustarSeries() {
    if (!this.inventario.cantidad || this.inventario.cantidad < 1) {
      this.inventario.cantidad = 1;
    }
    const diff = this.inventario.cantidad - (this.inventario.series ? this.inventario.series.length : 0);
    if (!this.inventario.series) this.inventario.series = [];
    
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        this.inventario.series.push('');
      }
    } else if (diff < 0) {
      this.inventario.series.length = this.inventario.cantidad;
    }
  }
  constructor(
    private http: HttpClient,
    private navCtrl: NavController,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/inventario`).subscribe(res => {
      this.catalogoInventario = res;
    });

    const nav = this.router.getCurrentNavigation();
    const estado = nav?.extras?.state as any;

    if (estado?.inventario) {
      this.inventario = estado.inventario;
      this.modoEdicion = true;
    }

    if (estado?.desdeAdmin) {
      this.desdeAdmin = true;
    }
  }

  buscarPorCodigoBarras() {
    if (!this.inventario.codigoBarras || this.modoEdicion) return;
    
    const encontrado = this.catalogoInventario.find(i => i.codigoBarras === this.inventario.codigoBarras && i.tipo === 'Consumible');
    if (encontrado) {
      this.inventario.nombre = encontrado.nombre;
      this.inventario.categoria = encontrado.categoria;
      this.inventario.tipo = encontrado.tipo;
      this.alertCtrl.create({
        header: 'Producto Detectado',
        message: 'Se autocompletó la información. Al guardar se sumará el stock al existente.',
        buttons: ['OK']
      }).then(a => a.present());
    }
  }

  buscarPorNombre() {
    if (!this.inventario.nombre || this.modoEdicion || this.inventario.tipo === 'Consumible') return;

    const nombreBuscado = this.inventario.nombre.trim().toLowerCase();
    const encontrado = this.catalogoInventario.find(i => 
      i.nombre.trim().toLowerCase() === nombreBuscado && 
      (i.tipo === 'Equipo' || i.tipo === 'Herramienta')
    );
    
    if (encontrado) {
      this.inventario.categoria = encontrado.categoria;
      this.inventario.tipo = encontrado.tipo;
    }
  }


  // Pide clave antes de guardar
  async pedirAutorizacion() {

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
            this.validarClave(data.clave);
          }
        }
      ]
    });

    await alert.present();
  }

  validarClave(clave: string) {
    this.http.post<any>(`${environment.apiUrl}/validar-admin`, {
      clave
    }).subscribe({
      next: (res) => {
        if (res.autorizado) {
          this.guardarInventario();
        } else {
          this.claveIncorrecta();
        }
      },
      error: () => {
        this.mostrarAlerta('Error', 'Error de conexión con el servidor');
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

  guardarInventario() {

  if (this.modoEdicion) {

    this.http.put(
      `${environment.apiUrl}/inventario/${this.inventario._id}`,
      this.inventario
    ).subscribe({
      next: () => {
        if (this.desdeAdmin) {
          this.navCtrl.navigateBack('/admin');
        } else {
          this.navCtrl.navigateBack('/almacen');
        }
      },
      error: () => {
        this.mostrarAlerta('Error', 'Error al actualizar el inventario. Verifique su conexión.');
      }
    });

  } else {

    this.http.post(
      `${environment.apiUrl}/inventario`,
      this.inventario
    ).subscribe({
      next: () => {
        if (this.desdeAdmin) {
          this.navCtrl.navigateBack('/admin');
        } else {
          this.navCtrl.navigateBack('/almacen');
        }
      },
      error: () => {
        this.mostrarAlerta('Error', 'Error al registrar en el inventario. Verifique su conexión.');
      }
    });

  }
}


  claveIncorrecta() {
    this.alertCtrl.create({
      header: 'Error',
      message: 'Clave incorrecta',
      buttons: ['OK']
    }).then(a => a.present());
  }

  volver() {
    if (this.desdeAdmin) {
      this.navCtrl.navigateBack('/admin');
    } else {
      this.navCtrl.navigateBack('/almacen');
    }
  }
}
