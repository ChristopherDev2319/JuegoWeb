/**
 * Clase CuboPractica
 * Cubo enemigo que se mueve de izquierda a derecha para practicar puntería
 */
import { CONFIG } from '../config.js';

export class CuboPractica {
  constructor(scene, x, y, z) {
    this.scene = scene;
    
    // Crear mesh del cubo
    const geometria = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ffff });
    this.mesh = new THREE.Mesh(geometria, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);
    
    // Configuración de movimiento
    this.posicionInicialX = x;
    this.posicionInicialY = y;
    this.posicionInicialZ = z;
    this.rangoMovimiento = 8;
    this.velocidad = 2;
    this.tiempoOffset = Math.random() * Math.PI * 2; // Offset aleatorio para que no todos se muevan sincronizados
    
    // Datos del enemigo (compatibilidad con sistema de balas)
    this.datos = {
      vidaMaxima: CONFIG.enemigo.vidaMaxima,
      vidaActual: CONFIG.enemigo.vidaMaxima,
      estaVivo: true,
      tiempoRespawn: CONFIG.enemigo.tiempoRespawn,
      tiempoMuerte: 0
    };
    
    // Crear barra de vida
    this.crearBarraVida();
  }
  
  crearBarraVida() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    this.canvasBarraVida = canvas;
    this.ctxBarraVida = canvas.getContext('2d');
    
    this.texturaBarraVida = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.SpriteMaterial({
      map: this.texturaBarraVida,
      transparent: true
    });
    
    this.spriteBarraVida = new THREE.Sprite(material);
    this.spriteBarraVida.scale.set(2.5, 0.4, 1);
    this.spriteBarraVida.position.set(0, 1.5, 0);
    this.mesh.add(this.spriteBarraVida);
    
    this.actualizarBarraVida();
  }
  
  actualizarBarraVida() {
    const ctx = this.ctxBarraVida;
    const canvas = this.canvasBarraVida;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!this.datos.estaVivo) return;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    const porcentaje = this.datos.vidaActual / this.datos.vidaMaxima;
    const ancho = (canvas.width - 60) * porcentaje;
    
    ctx.fillStyle = porcentaje > 0.5 ? '#00ffff' : porcentaje > 0.25 ? '#ffaa00' : '#ff0000';
    ctx.fillRect(30, 30, ancho, canvas.height - 60);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(this.datos.vidaActual)}`, canvas.width / 2, canvas.height / 2);
    
    this.texturaBarraVida.needsUpdate = true;
  }
  
  recibirDaño(cantidad) {
    if (!this.datos.estaVivo) return;
    
    this.datos.vidaActual -= cantidad;
    
    if (this.datos.vidaActual <= 0) {
      this.datos.vidaActual = 0;
      this.datos.estaVivo = false;
      this.datos.tiempoMuerte = performance.now();
      this.morir();
    }
    
    this.actualizarBarraVida();
  }
  
  morir() {
    this.mesh.material.color.setHex(0x333333);
    this.spriteBarraVida.visible = false;
  }
  
  reaparecer() {
    // Restaurar posición inicial
    this.mesh.position.set(
      this.posicionInicialX,
      this.posicionInicialY,
      this.posicionInicialZ
    );
    
    // Restaurar rotación
    this.mesh.rotation.set(0, 0, 0);
    
    this.mesh.material.color.setHex(0x00ffff);
    this.datos.vidaActual = this.datos.vidaMaxima;
    this.datos.estaVivo = true;
    this.spriteBarraVida.visible = true;
    this.actualizarBarraVida();
  }
  
  actualizar() {
    // Movimiento de izquierda a derecha (solo en eje X)
    if (this.datos.estaVivo) {
      const tiempo = performance.now() / 1000;
      // Calcular nueva posición X basada en la posición inicial
      const nuevoX = this.posicionInicialX + Math.sin((tiempo + this.tiempoOffset) * this.velocidad) * this.rangoMovimiento;
      
      // IMPORTANTE: Solo actualizar X, mantener Y y Z constantes
      this.mesh.position.x = nuevoX;
      this.mesh.position.y = this.posicionInicialY;
      this.mesh.position.z = this.posicionInicialZ;
      
      // Asegurar que la rotación siempre sea 0
      this.mesh.rotation.set(0, 0, 0);
    }
    
    // Verificar respawn
    if (!this.datos.estaVivo) {
      const ahora = performance.now();
      if (ahora - this.datos.tiempoMuerte >= this.datos.tiempoRespawn) {
        this.reaparecer();
      }
    }
  }
}