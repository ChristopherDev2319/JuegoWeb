/**
 * Sistema de Armas
 * Gestiona el estado del arma, disparo y recarga
 * 
 * Requirements: 5.1, 6.1, 6.5
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import { Bala } from '../entidades/Bala.js';

/**
 * Estado del arma actual
 * NOTA: Los valores se inicializan a null y se establecen cuando el jugador selecciona un arma
 */
export const arma = {
  tipoActual: null,
  municionActual: 0,
  municionTotal: 0,
  estaRecargando: false,
  puedeDisparar: true,
  ultimoDisparo: 0,
  estaApuntando: false,
  transicionApuntado: 0, // 0 = no apuntando, 1 = completamente apuntando
  retrocesoacumulado: 0, // Retroceso acumulado que afecta precisión
  disparosConsecutivos: 0, // Contador de disparos consecutivos
  inicializado: false // Flag para saber si el arma fue inicializada por el jugador
};

/**
 * Inventario de armas disponibles
 */
export const inventarioArmas = {
  armasDisponibles: [], // Se establece cuando el jugador selecciona un arma
  armaSeleccionada: 0 // Índice del arma actual
};

/**
 * Estado del cuchillo para controlar cadencia de ataque e intercambio con Q
 * Requirements: 2.1, 2.2, 2.3, 4.1, 4.4, 4.5
 * Movido al inicio del archivo para que esté disponible en establecerArmaUnica
 */
const estadoCuchillo = {
  equipado: false,              // true si el cuchillo está equipado actualmente
  armaPrincipalPrevia: null,    // Arma a restaurar al presionar Q
  ultimoAtaque: 0,
  puedeAtacar: true
};

/**
 * Estado del sistema de curación (JuiceBox)
 * Requirements: 1.1, 2.1, 3.1, 4.1
 */
const estadoCuracion = {
  juiceBoxEquipado: false,      // Si el JuiceBox está equipado actualmente
  armaPreviaACuracion: null,    // Arma/cuchillo a restaurar al desequipar JuiceBox
  curacionEnProgreso: false,    // Si hay una curación activa
  tiempoInicioCuracion: 0,      // Timestamp de inicio de curación
  modeloJuiceBox: null,         // Referencia al modelo cargado
  modeloCargado: false          // Si el modelo ya fue cargado
};

/**
 * Establece el inventario con una única arma
 * Requirements: 2.2, 2.3 - El jugador solo puede usar el arma seleccionada
 * Requirements: 1.1, 2.1, 4.3 - Inicializar estado de cuchillo al cargar
 * @param {string} tipoArma - Tipo de arma a establecer como única en el inventario
 * @param {THREE.Object3D} weaponContainer - Contenedor del arma (opcional)
 * @returns {boolean} - true si se estableció exitosamente
 */
export function establecerArmaUnica(tipoArma, weaponContainer = null) {
  if (!CONFIG.armas[tipoArma]) {
    console.warn(`⚠️ Arma no encontrada: ${tipoArma}`);
    return false;
  }
  
  // Limpiar inventario y establecer solo el arma seleccionada
  inventarioArmas.armasDisponibles = [tipoArma];
  inventarioArmas.armaSeleccionada = 0;
  
  // Cambiar al arma seleccionada
  arma.tipoActual = tipoArma;
  const configArma = CONFIG.armas[tipoArma];
  
  // Reiniciar munición con los valores del arma seleccionada
  arma.municionActual = configArma.tamañoCargador;
  arma.municionTotal = configArma.municionTotal;
  arma.estaRecargando = false;
  arma.ultimoDisparo = 0;
  arma.estaApuntando = false;
  arma.transicionApuntado = 0;
  arma.disparosConsecutivos = 0;
  arma.inicializado = true; // Marcar como inicializado
  
  // Inicializar estado del cuchillo - guardar arma principal para intercambio con Q
  // Requirements: 1.1, 2.1, 4.3 - Inicializar estado de cuchillo al cargar
  // Requirements: 2.3 - Recordar arma principal para intercambios posteriores
  estadoCuchillo.equipado = false;
  estadoCuchillo.armaPrincipalPrevia = tipoArma;
  estadoCuchillo.ultimoAtaque = 0;
  estadoCuchillo.puedeAtacar = true;
  
  // Cambiar modelo si se proporciona el contenedor
  if (weaponContainer) {
    cambiarModeloArma(tipoArma, weaponContainer);
  }
  
  console.log(`🔫 Inventario establecido con arma única: ${configArma.nombre} - Munición: ${arma.municionActual}/${arma.municionTotal}`);
  console.log(`🔪 Estado cuchillo inicializado - Arma principal: ${tipoArma}`);
  return true;
}

/**
 * Referencia al modelo del arma para animaciones
 */
let modeloArma = null;
let modelosArmas = {}; // Cache de modelos cargados
let cargandoModelo = false;

/**
 * Sistema de animaciones del cuchillo
 * Requirements: 4.3
 */
let animacionesCuchillo = {
  mixer: null,
  clipAtaque: null,
  accionAtaque: null,
  cargada: false
};

/**
 * Carga la animación de ataque del cuchillo
 * Requirements: 4.3
 * @returns {Promise<void>}
 */
export function cargarAnimacionCuchillo() {
  return new Promise((resolve, reject) => {
    const configCuchillo = CONFIG.armas["KNIFE"];
    if (!configCuchillo || !configCuchillo.animacionAtaque) {
      console.warn("⚠️ No se encontró configuración de animación del cuchillo");
      resolve();
      return;
    }

    if (animacionesCuchillo.cargada) {
      resolve();
      return;
    }

    const gltfLoader = new THREE.GLTFLoader();
    
    console.log(`🎬 Cargando animación de cuchillo: ${configCuchillo.animacionAtaque}`);

    gltfLoader.load(
      configCuchillo.animacionAtaque,
      (gltf) => {
        if (gltf.animations && gltf.animations.length > 0) {
          animacionesCuchillo.clipAtaque = gltf.animations[0];
          animacionesCuchillo.cargada = true;
          console.log(`✅ Animación de cuchillo cargada: ${animacionesCuchillo.clipAtaque.name}`);
        } else {
          console.warn("⚠️ El archivo de animación no contiene animaciones");
        }
        resolve();
      },
      (progress) => {
        if (progress.total > 0) {
          console.log(`📦 Cargando animación: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        }
      },
      (error) => {
        console.error(`❌ Error cargando animación del cuchillo:`, error);
        // No rechazar, solo advertir - la animación fallback funcionará
        resolve();
      }
    );
  });
}

/**
 * Configura el mixer de animación para el modelo del cuchillo
 * @param {THREE.Object3D} modelo - Modelo del cuchillo
 */
function configurarMixerCuchillo(modelo) {
  if (!modelo) return;
  
  animacionesCuchillo.mixer = new THREE.AnimationMixer(modelo);
  
  if (animacionesCuchillo.clipAtaque) {
    animacionesCuchillo.accionAtaque = animacionesCuchillo.mixer.clipAction(animacionesCuchillo.clipAtaque);
    animacionesCuchillo.accionAtaque.setLoop(THREE.LoopOnce);
    animacionesCuchillo.accionAtaque.clampWhenFinished = true;
  }
}

/**
 * Reproduce la animación de ataque del cuchillo
 * Requirements: 4.3
 */
export function reproducirAnimacionAtaqueCuchillo() {
  if (animacionesCuchillo.accionAtaque && animacionesCuchillo.mixer) {
    animacionesCuchillo.accionAtaque.reset();
    animacionesCuchillo.accionAtaque.play();
    console.log("🎬 Reproduciendo animación de ataque del cuchillo");
  }
}

/**
 * Actualiza las animaciones del cuchillo (llamar cada frame)
 * @param {number} deltaTime - Tiempo desde el último frame en segundos
 */
export function actualizarAnimacionesCuchillo(deltaTime) {
  if (animacionesCuchillo.mixer) {
    animacionesCuchillo.mixer.update(deltaTime);
  }
}

/**
 * Carga el modelo del JuiceBox para vista FPS
 * Requirements: 1.4, 6.1
 * @param {THREE.Object3D} weaponContainer - Contenedor del arma FPS
 * @returns {Promise<THREE.Object3D>} - Modelo cargado
 */
export function cargarModeloJuiceBox(weaponContainer) {
  return new Promise((resolve, reject) => {
    const configCuracion = CONFIG.curacion;
    if (!configCuracion || !configCuracion.modelo) {
      reject(new Error('No se encontró configuración del JuiceBox'));
      return;
    }

    // Si ya está cargado, devolverlo
    if (estadoCuracion.modeloCargado && estadoCuracion.modeloJuiceBox) {
      resolve(estadoCuracion.modeloJuiceBox);
      return;
    }

    const gltfLoader = new THREE.GLTFLoader();
    
    console.log(`🧃 Cargando modelo JuiceBox: ${configCuracion.modelo}`);

    gltfLoader.load(
      configCuracion.modelo,
      (gltf) => {
        const juiceBox = gltf.scene;
        
        // Aplicar escala de configuración
        const escala = configCuracion.escala || { x: 0.15, y: 0.15, z: 0.15 };
        juiceBox.scale.set(escala.x, escala.y, escala.z);

        // Aplicar posición FPS
        const posConfig = configCuracion.posicion || { x: 0.25, y: -0.35, z: -0.4 };
        const rotConfig = configCuracion.rotacion || { x: 0, y: Math.PI * 0.3, z: 0.1 };
        
        juiceBox.position.set(posConfig.x, posConfig.y, posConfig.z);
        juiceBox.rotation.set(rotConfig.x, rotConfig.y, rotConfig.z);

        // Sin sombras
        juiceBox.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });

        // Ocultar inicialmente
        juiceBox.visible = false;

        // Guardar referencia
        estadoCuracion.modeloJuiceBox = juiceBox;
        estadoCuracion.modeloCargado = true;
        
        console.log(`✅ Modelo JuiceBox cargado correctamente`);
        resolve(juiceBox);
      },
      (progress) => {
        if (progress.total > 0) {
          console.log(`📦 Cargando JuiceBox: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        }
      },
      (error) => {
        console.error(`❌ Error cargando modelo JuiceBox:`, error);
        reject(error);
      }
    );
  });
}

/**
 * Alterna el equipamiento del JuiceBox con tecla C
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3
 * @param {THREE.Object3D} weaponContainer - Contenedor del arma FPS
 * @returns {Promise<boolean>} - true si se realizó el cambio
 */
export async function alternarJuiceBox(weaponContainer = null) {
  // No permitir cambio durante recarga
  if (arma.estaRecargando) {
    console.log('🧃 No se puede cambiar al JuiceBox durante recarga');
    return false;
  }

  // No permitir cambio durante curación en progreso
  if (estadoCuracion.curacionEnProgreso) {
    console.log('🧃 No se puede cambiar durante curación en progreso');
    return false;
  }

  if (estadoCuracion.juiceBoxEquipado) {
    // Tiene JuiceBox equipado -> restaurar arma/cuchillo anterior
    // Requirements: 1.3
    const itemPrevio = estadoCuracion.armaPreviaACuracion;
    
    if (!itemPrevio) {
      console.warn('⚠️ No hay item previo para restaurar');
      return false;
    }

    // Ocultar JuiceBox
    if (estadoCuracion.modeloJuiceBox) {
      estadoCuracion.modeloJuiceBox.visible = false;
    }

    // Restaurar item previo
    if (itemPrevio === 'KNIFE') {
      // Restaurar cuchillo
      arma.tipoActual = 'KNIFE';
      estadoCuchillo.equipado = true;
      
      if (weaponContainer) {
        await cambiarModeloArma('KNIFE', weaponContainer);
      }
      console.log('🔪 Restaurado cuchillo desde JuiceBox');
    } else {
      // Restaurar arma
      arma.tipoActual = itemPrevio;
      estadoCuchillo.equipado = false;
      
      if (weaponContainer) {
        await cambiarModeloArma(itemPrevio, weaponContainer);
      }
      console.log(`🔫 Restaurado arma ${itemPrevio} desde JuiceBox`);
    }

    estadoCuracion.juiceBoxEquipado = false;
    estadoCuracion.armaPreviaACuracion = null;
    
    return true;
  } else {
    // No tiene JuiceBox equipado -> guardar item actual y equipar JuiceBox
    // Requirements: 1.1, 1.2, 2.1, 2.2, 2.3
    
    // Guardar item actual (arma o cuchillo)
    if (estadoCuchillo.equipado || arma.tipoActual === 'KNIFE') {
      estadoCuracion.armaPreviaACuracion = 'KNIFE';
    } else {
      estadoCuracion.armaPreviaACuracion = arma.tipoActual;
    }

    // Cargar modelo si no está cargado
    if (!estadoCuracion.modeloCargado && weaponContainer) {
      try {
        const juiceBox = await cargarModeloJuiceBox(weaponContainer);
        weaponContainer.add(juiceBox);
      } catch (error) {
        console.error('❌ Error cargando JuiceBox:', error);
        return false;
      }
    }

    // Ocultar arma/cuchillo actual
    if (modeloArma) {
      modeloArma.visible = false;
    }

    // Mostrar JuiceBox
    if (estadoCuracion.modeloJuiceBox) {
      estadoCuracion.modeloJuiceBox.visible = true;
    }

    // Desactivar apuntado si estaba activo
    if (arma.estaApuntando) {
      arma.estaApuntando = false;
      arma.transicionApuntado = 0;
      
      if (camera) {
        camera.fov = fovOriginal;
        camera.updateProjectionMatrix();
      }
    }

    estadoCuracion.juiceBoxEquipado = true;
    estadoCuchillo.equipado = false;
    
    console.log(`🧃 JuiceBox equipado - Item guardado: ${estadoCuracion.armaPreviaACuracion}`);
    return true;
  }
}

/**
 * Verifica si el JuiceBox está equipado
 * Requirements: 4.1
 * @returns {boolean}
 */
export function esJuiceBoxEquipado() {
  return estadoCuracion.juiceBoxEquipado;
}

/**
 * Verifica si hay curación en progreso
 * Requirements: 3.4
 * @returns {boolean}
 */
export function estaCurando() {
  return estadoCuracion.curacionEnProgreso;
}

/**
 * Inicia el proceso de curación al hacer clic
 * Requirements: 3.1
 * @returns {boolean} - true si se inició la curación
 */
export function iniciarCuracion() {
  // Verificar que JuiceBox está equipado
  if (!estadoCuracion.juiceBoxEquipado) {
    console.log('🧃 No se puede curar sin JuiceBox equipado');
    return false;
  }

  // Verificar que no hay curación en progreso
  if (estadoCuracion.curacionEnProgreso) {
    console.log('🧃 Ya hay una curación en progreso');
    return false;
  }

  // Iniciar curación
  estadoCuracion.curacionEnProgreso = true;
  estadoCuracion.tiempoInicioCuracion = performance.now();
  
  console.log('🧃 Curación iniciada - 2 segundos para completar');
  return true;
}

/**
 * Actualiza el estado de curación (llamar cada frame)
 * Requirements: 3.2, 3.5
 * @param {Object} jugador - Referencia al jugador para aplicar curación
 * @returns {Object} - { completada: boolean, vidaCurada: number }
 */
export function actualizarCuracion(jugador = null) {
  if (!estadoCuracion.curacionEnProgreso) {
    return { completada: false, vidaCurada: 0 };
  }

  const ahora = performance.now();
  const tiempoTranscurrido = ahora - estadoCuracion.tiempoInicioCuracion;
  const tiempoCuracion = CONFIG.curacion?.tiempoCuracion || 2000;

  // Verificar si se completó el tiempo de curación
  if (tiempoTranscurrido >= tiempoCuracion) {
    // Curación completada
    estadoCuracion.curacionEnProgreso = false;
    estadoCuracion.tiempoInicioCuracion = 0;

    const vidaCurada = CONFIG.curacion?.vidaCurada || 50;
    
    // Aplicar curación al jugador si se proporciona
    if (jugador) {
      // El objeto jugador usa 'health' y 'maxHealth', no 'vida' y 'vidaMaxima'
      const vidaMaxima = jugador.maxHealth || jugador.vidaMaxima || 200;
      const vidaActual = jugador.health || jugador.vida || jugador.vidaActual || 0;
      const nuevaVida = Math.min(vidaActual + vidaCurada, vidaMaxima);
      const vidaRealCurada = nuevaVida - vidaActual;
      
      // Actualizar vida del jugador (soportar ambas nomenclaturas)
      if (typeof jugador.health !== 'undefined') {
        jugador.health = nuevaVida;
      } else if (typeof jugador.vida !== 'undefined') {
        jugador.vida = nuevaVida;
      } else if (typeof jugador.vidaActual !== 'undefined') {
        jugador.vidaActual = nuevaVida;
      }
      
      console.log(`🧃 Curación completada - Vida restaurada: ${vidaRealCurada} HP (${vidaActual} -> ${nuevaVida})`);
      return { completada: true, vidaCurada: vidaRealCurada };
    }

    console.log(`🧃 Curación completada - ${vidaCurada} HP`);
    return { completada: true, vidaCurada: vidaCurada };
  }

  return { completada: false, vidaCurada: 0 };
}

/**
 * Obtiene el progreso de curación actual (0-1)
 * @returns {number} - Progreso de 0 a 1
 */
export function obtenerProgresoCuracion() {
  if (!estadoCuracion.curacionEnProgreso) {
    return 0;
  }

  const ahora = performance.now();
  const tiempoTranscurrido = ahora - estadoCuracion.tiempoInicioCuracion;
  const tiempoCuracion = CONFIG.curacion?.tiempoCuracion || 2000;

  return Math.min(tiempoTranscurrido / tiempoCuracion, 1);
}

/**
 * Cancela la curación en progreso
 * Requirements: 3.3
 * @returns {boolean} - true si se canceló una curación en progreso, false si no había curación
 */
export function cancelarCuracion() {
  if (!estadoCuracion.curacionEnProgreso) {
    return false;
  }

  estadoCuracion.curacionEnProgreso = false;
  estadoCuracion.tiempoInicioCuracion = 0;
  
  console.log('🧃 Curación cancelada');
  return true;
}

/**
 * Referencias para el sistema de apuntado
 */
let camera = null;
let fovOriginal = 75;
let posicionArmaOriginal = { x: 0, y: 0, z: 0 };
let animacionApuntado = null;

/**
 * Obtiene la configuración del arma actual
 * @returns {Object} - Configuración del arma actual
 */
function obtenerConfigArmaActual() {
  // Si el arma no está inicializada, usar M4A1 como fallback temporal
  const tipoArma = arma.tipoActual || 'M4A1';
  return CONFIG.armas[tipoArma];
}

/**
 * Obtiene la dispersión actual por retroceso acumulado
 * @returns {number} - Dispersión adicional por retroceso
 */
export function obtenerDispersionRetroceso() {
  const configArma = obtenerConfigArmaActual();
  const retroceso = configArma.retroceso || {};
  
  // Calcular dispersión basada en disparos consecutivos
  // Máximo de dispersión después de ~10 disparos
  const maxDispersion = (retroceso.cantidad || 0.05) * 2;
  const dispersionBase = arma.disparosConsecutivos * (retroceso.cantidad || 0.05) * 0.3;
  
  let dispersion = Math.min(dispersionBase, maxDispersion);
  
  // Reducir dispersión si está apuntando
  if (arma.estaApuntando && configArma.apuntado && configArma.apuntado.reduccionRetroceso) {
    dispersion *= configArma.apuntado.reduccionRetroceso;
  }
  
  return dispersion;
}

/**
 * Actualiza el retroceso acumulado (llamar cada frame)
 */
export function actualizarRetroceso() {
  const ahora = performance.now();
  const tiempoSinDisparo = ahora - arma.ultimoDisparo;
  
  // Si no ha disparado en 200ms, empezar a reducir el retroceso
  if (tiempoSinDisparo > 200) {
    // Reducir disparos consecutivos gradualmente
    const reduccion = (tiempoSinDisparo - 200) / 100; // Reduce 1 disparo cada 100ms
    arma.disparosConsecutivos = Math.max(0, arma.disparosConsecutivos - reduccion * 0.1);
  }
}

/**
 * Cambia el arma actual
 * @param {string} tipoArma - Tipo de arma a seleccionar
 * @param {THREE.Object3D} weaponContainer - Contenedor del arma (opcional)
 * @returns {boolean} - true si se cambió exitosamente
 */
export function cambiarArma(tipoArma, weaponContainer = null) {
  if (!CONFIG.armas[tipoArma] || !inventarioArmas.armasDisponibles.includes(tipoArma)) {
    return false;
  }

  // Requirements: 2.4 - Desequipar JuiceBox al cambiar de arma
  if (estadoCuracion.juiceBoxEquipado) {
    // Ocultar JuiceBox
    if (estadoCuracion.modeloJuiceBox) {
      estadoCuracion.modeloJuiceBox.visible = false;
    }
    estadoCuracion.juiceBoxEquipado = false;
    estadoCuracion.armaPreviaACuracion = null;
    
    // Cancelar curación si estaba en progreso
    if (estadoCuracion.curacionEnProgreso) {
      cancelarCuracion();
    }
    
    console.log('🧃 JuiceBox desequipado por cambio de arma');
  }

  arma.tipoActual = tipoArma;
  const configArma = obtenerConfigArmaActual();
  
  // Reiniciar munición al cambiar arma
  arma.municionActual = configArma.tamañoCargador;
  arma.municionTotal = configArma.municionTotal;
  arma.estaRecargando = false;
  arma.ultimoDisparo = 0;
  arma.estaApuntando = false;
  arma.transicionApuntado = 0;
  arma.inicializado = true; // Marcar como inicializado

  // Cambiar modelo si se proporciona el contenedor
  if (weaponContainer) {
    cambiarModeloArma(tipoArma, weaponContainer);
  }

  return true;
}

/**
 * Agrega un arma al inventario
 * @param {string} tipoArma - Tipo de arma a agregar
 * @returns {boolean} - true si se agregó exitosamente
 */
export function agregarArma(tipoArma) {
  if (!CONFIG.armas[tipoArma] || inventarioArmas.armasDisponibles.includes(tipoArma)) {
    return false;
  }

  inventarioArmas.armasDisponibles.push(tipoArma);
  return true;
}

/**
 * Selecciona la siguiente arma en el inventario
 * Requirements: 2.4 - Desequipar JuiceBox al cambiar de arma
 * @param {THREE.Object3D} weaponContainer - Contenedor del arma (opcional)
 */
export function siguienteArma(weaponContainer = null) {
  if (inventarioArmas.armasDisponibles.length <= 1) return;

  // Requirements: 2.4 - Desequipar JuiceBox al cambiar de arma
  if (estadoCuracion.juiceBoxEquipado) {
    if (estadoCuracion.modeloJuiceBox) {
      estadoCuracion.modeloJuiceBox.visible = false;
    }
    estadoCuracion.juiceBoxEquipado = false;
    estadoCuracion.armaPreviaACuracion = null;
    if (estadoCuracion.curacionEnProgreso) {
      cancelarCuracion();
    }
    console.log('🧃 JuiceBox desequipado por cambio de arma');
  }

  inventarioArmas.armaSeleccionada = (inventarioArmas.armaSeleccionada + 1) % inventarioArmas.armasDisponibles.length;
  const nuevaArma = inventarioArmas.armasDisponibles[inventarioArmas.armaSeleccionada];
  cambiarArma(nuevaArma, weaponContainer);
}

/**
 * Selecciona la arma anterior en el inventario
 * Requirements: 2.4 - Desequipar JuiceBox al cambiar de arma
 * @param {THREE.Object3D} weaponContainer - Contenedor del arma (opcional)
 */
export function armaAnterior(weaponContainer = null) {
  if (inventarioArmas.armasDisponibles.length <= 1) return;

  // Requirements: 2.4 - Desequipar JuiceBox al cambiar de arma
  if (estadoCuracion.juiceBoxEquipado) {
    if (estadoCuracion.modeloJuiceBox) {
      estadoCuracion.modeloJuiceBox.visible = false;
    }
    estadoCuracion.juiceBoxEquipado = false;
    estadoCuracion.armaPreviaACuracion = null;
    if (estadoCuracion.curacionEnProgreso) {
      cancelarCuracion();
    }
    console.log('🧃 JuiceBox desequipado por cambio de arma');
  }

  inventarioArmas.armaSeleccionada = inventarioArmas.armaSeleccionada - 1;
  if (inventarioArmas.armaSeleccionada < 0) {
    inventarioArmas.armaSeleccionada = inventarioArmas.armasDisponibles.length - 1;
  }
  const nuevaArma = inventarioArmas.armasDisponibles[inventarioArmas.armaSeleccionada];
  cambiarArma(nuevaArma, weaponContainer);
}

/**
 * Carga un modelo de arma específico
 * Soporta modelos FBX y GLB/GLTF
 * @param {string} tipoArma - Tipo de arma a cargar
 * @param {THREE.Object3D} weaponContainer - Contenedor del arma
 * @returns {Promise<THREE.Object3D>} - Modelo cargado
 */
export function cargarModeloArma(tipoArma, weaponContainer) {
  return new Promise((resolve, reject) => {
    const configArma = CONFIG.armas[tipoArma];
    if (!configArma || !configArma.modelo) {
      reject(new Error(`No se encontró modelo para el arma: ${tipoArma}`));
      return;
    }

    // Si ya está cargado, devolverlo
    if (modelosArmas[tipoArma]) {
      resolve(modelosArmas[tipoArma]);
      return;
    }

    // Si está cargando, esperar
    if (cargandoModelo) {
      setTimeout(() => cargarModeloArma(tipoArma, weaponContainer).then(resolve).catch(reject), 100);
      return;
    }

    cargandoModelo = true;
    
    // Determinar el tipo de loader basado en la extensión del archivo
    const esGLB = configArma.modelo.toLowerCase().endsWith('.glb') || 
                  configArma.modelo.toLowerCase().endsWith('.gltf');

    console.log(`🔫 Cargando modelo: ${configArma.modelo} (${esGLB ? 'GLB/GLTF' : 'FBX'})`);

    if (esGLB) {
      // Usar GLTFLoader para archivos GLB/GLTF
      const gltfLoader = new THREE.GLTFLoader();
      
      gltfLoader.load(
        configArma.modelo,
        (gltf) => {
          const armaCargada = gltf.scene;
          
          // Calcular escala
          const box = new THREE.Box3().setFromObject(armaCargada);
          const size = new THREE.Vector3();
          box.getSize(size);

          // Usar escala de configuración si existe, sino calcular
          if (configArma.escala) {
            armaCargada.scale.set(configArma.escala.x, configArma.escala.y, configArma.escala.z);
          } else {
            const longitudDeseada = 0.8;
            const escala = longitudDeseada / Math.max(size.x, size.y, size.z);
            armaCargada.scale.setScalar(escala);
          }

          // Posicionar el arma usando la configuración específica
          const posConfig = configArma.posicion || { x: 0.3, y: -0.3, z: -0.5 };
          const rotConfig = configArma.rotacion || { x: 0, y: Math.PI, z: 0 };
          
          armaCargada.position.set(posConfig.x, posConfig.y, posConfig.z);
          armaCargada.rotation.set(rotConfig.x, rotConfig.y, rotConfig.z);

          // Sin sombras
          armaCargada.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = false;
            }
          });

          // Guardar en cache
          modelosArmas[tipoArma] = armaCargada.clone();
          
          cargandoModelo = false;
          console.log(`✅ Modelo GLB cargado: ${configArma.nombre}`);
          resolve(armaCargada);
        },
        (progress) => {
          if (progress.total > 0) {
            console.log(`📦 Cargando ${configArma.nombre}: ${Math.round((progress.loaded / progress.total) * 100)}%`);
          }
        },
        (error) => {
          cargandoModelo = false;
          console.error(`❌ Error cargando modelo GLB ${configArma.modelo}:`, error);
          reject(error);
        }
      );
    } else {
      // Usar FBXLoader para archivos FBX
      const fbxLoader = new THREE.FBXLoader();

      fbxLoader.load(
        configArma.modelo,
        (armaCargada) => {
          // Calcular escala
          const box = new THREE.Box3().setFromObject(armaCargada);
          const size = new THREE.Vector3();
          box.getSize(size);

          const longitudDeseada = 0.8;
          const escala = longitudDeseada / Math.max(size.x, size.y, size.z);
          armaCargada.scale.setScalar(escala);

          // Posicionar el arma usando la configuración específica
          const posConfig = configArma.posicion || { x: 0.3, y: -0.3, z: -0.5 };
          const rotConfig = configArma.rotacion || { x: 0, y: Math.PI, z: 0 };
          
          armaCargada.position.set(posConfig.x, posConfig.y, posConfig.z);
          armaCargada.rotation.set(rotConfig.x, rotConfig.y, rotConfig.z);

          // Sin sombras
          armaCargada.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = false;
            }
          });

          // Guardar en cache
          modelosArmas[tipoArma] = armaCargada.clone();
          
          cargandoModelo = false;
          console.log(`✅ Modelo FBX cargado: ${configArma.nombre}`);
          resolve(armaCargada);
        },
        (progress) => {
          console.log(`📦 Cargando ${configArma.nombre}: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        },
        (error) => {
          cargandoModelo = false;
          console.error(`❌ Error cargando modelo FBX ${configArma.modelo}:`, error);
          reject(error);
        }
      );
    }
  });
}

/**
 * Cambia el modelo del arma visualmente
 * @param {string} tipoArma - Tipo de arma a mostrar
 * @param {THREE.Object3D} weaponContainer - Contenedor del arma
 */
export async function cambiarModeloArma(tipoArma, weaponContainer) {
  try {
    // Remover modelo actual
    if (modeloArma) {
      weaponContainer.remove(modeloArma);
    }

    // Cargar nuevo modelo
    const nuevoModelo = await cargarModeloArma(tipoArma, weaponContainer);
    modeloArma = nuevoModelo;
    
    // Agregar al contenedor
    weaponContainer.add(modeloArma);
    
    // Asegurar que el modelo sea visible (puede estar oculto si viene del cache)
    if (modeloArma) {
      modeloArma.visible = true;
    }
    
    // Guardar posición original para apuntado
    if (modeloArma) {
      posicionArmaOriginal = {
        x: modeloArma.position.x,
        y: modeloArma.position.y,
        z: modeloArma.position.z
      };
    }

    // Si es el cuchillo, cargar y configurar animación
    if (tipoArma === "KNIFE") {
      await cargarAnimacionCuchillo();
      configurarMixerCuchillo(modeloArma);
    }

    console.log(`🔄 Modelo cambiado a: ${CONFIG.armas[tipoArma].nombre}`);
  } catch (error) {
    console.error('Error cambiando modelo de arma:', error);
  }
}

/**
 * Establece la referencia de la cámara para el sistema de apuntado
 * @param {THREE.Camera} cameraRef - Referencia a la cámara del jugador
 */
export function establecerCamara(cameraRef) {
  camera = cameraRef;
  if (camera) {
    fovOriginal = camera.fov;
  }
}

/**
 * Inicia o detiene el apuntado
 * Requirements: 5.1, 5.2, 5.4 - Bloquear apuntado cuando el cuchillo está equipado
 * Requirements: 4.1 - Bloquear apuntado cuando JuiceBox está equipado
 * @param {boolean} apuntar - true para apuntar, false para dejar de apuntar
 */
export function alternarApuntado(apuntar = null) {
  // Requirements: 5.1, 5.2, 5.4 - Bloquear apuntado si el cuchillo está equipado
  if (arma.tipoActual === 'KNIFE') {
    return; // No permitir apuntado con cuchillo
  }
  
  // Requirements: 4.1 - Bloquear apuntado si el JuiceBox está equipado
  if (estadoCuracion.juiceBoxEquipado) {
    return; // No permitir apuntado con JuiceBox
  }
  
  // Requirements: 3.4 - Bloquear apuntado durante curación en progreso
  if (estadoCuracion.curacionEnProgreso) {
    return; // No permitir apuntado durante curación
  }
  
  if (apuntar === null) {
    apuntar = !arma.estaApuntando;
  }
  
  arma.estaApuntando = apuntar;
  
  const configArma = obtenerConfigArmaActual();
  const configApuntado = configArma.apuntado;
  
  if (!configApuntado) return;
  
  // Cancelar animación anterior si existe
  if (animacionApuntado) {
    cancelAnimationFrame(animacionApuntado);
  }
  
  // Iniciar animación de transición
  animarTransicionApuntado(apuntar, configApuntado);
}

/**
 * Anima la transición de apuntado
 * @param {boolean} apuntando - Si está apuntando o no
 * @param {Object} configApuntado - Configuración de apuntado del arma
 */
function animarTransicionApuntado(apuntando, configApuntado) {
  const tiempoInicio = performance.now();
  const duracion = (configApuntado.tiempoTransicion || 0.2) * 1000;
  const valorInicial = arma.transicionApuntado;
  const valorFinal = apuntando ? 1 : 0;
  
  function animar() {
    const tiempoTranscurrido = performance.now() - tiempoInicio;
    const progreso = Math.min(tiempoTranscurrido / duracion, 1);
    
    // Interpolación suave (ease-out)
    const factor = 1 - Math.pow(1 - progreso, 3);
    arma.transicionApuntado = valorInicial + (valorFinal - valorInicial) * factor;
    
    // Aplicar efectos del apuntado
    aplicarEfectosApuntado(configApuntado);
    
    if (progreso < 1) {
      animacionApuntado = requestAnimationFrame(animar);
    } else {
      animacionApuntado = null;
    }
  }
  
  animar();
}

/**
 * Aplica los efectos visuales del apuntado
 * @param {Object} configApuntado - Configuración de apuntado del arma
 */
function aplicarEfectosApuntado(configApuntado) {
  if (!camera || !modeloArma) return;
  
  const factor = arma.transicionApuntado;
  
  // Aplicar zoom de la cámara
  const fovApuntado = fovOriginal / (configApuntado.zoom || 1.5);
  camera.fov = fovOriginal + (fovApuntado - fovOriginal) * factor;
  camera.updateProjectionMatrix();
  
  // Mover el arma a la posición de apuntado
  const posApuntado = configApuntado.posicionArma || { x: 0, y: -0.1, z: -0.2 };
  
  modeloArma.position.x = posicionArmaOriginal.x + (posApuntado.x - posicionArmaOriginal.x) * factor;
  modeloArma.position.y = posicionArmaOriginal.y + (posApuntado.y - posicionArmaOriginal.y) * factor;
  modeloArma.position.z = posicionArmaOriginal.z + (posApuntado.z - posicionArmaOriginal.z) * factor;
}

/**
 * Verifica si el arma está apuntando
 * @returns {boolean}
 */
export function estaApuntando() {
  return arma.estaApuntando;
}

/**
 * Obtiene el factor de transición de apuntado (0-1)
 * @returns {number}
 */
export function obtenerFactorApuntado() {
  return arma.transicionApuntado;
}

/**
 * Dispara el arma si es posible
 * @param {THREE.Camera} camera - Cámara del jugador
 * @param {Array} enemigos - Array de enemigos
 * @param {Array} balas - Array de balas activas
 * @param {THREE.Scene} scene - Escena de Three.js
 * @param {Function} onImpacto - Callback cuando una bala impacta
 * @returns {boolean} - true si se disparó exitosamente
 */
export function disparar(camera, enemigos, balas, scene, onImpacto = null) {
  const ahora = performance.now();
  const configArma = obtenerConfigArmaActual();
  const tiempoEntreDisparos = (60 / configArma.cadenciaDisparo) * 1000;

  if (
    !arma.puedeDisparar ||
    arma.estaRecargando ||
    arma.municionActual <= 0 ||
    ahora - arma.ultimoDisparo < tiempoEntreDisparos
  ) {
    return false;
  }

  arma.ultimoDisparo = ahora;
  arma.municionActual--;

  // Calcular posición inicial de la bala
  const posicionBala = camera.position.clone();
  const offsetAdelante = new THREE.Vector3(0, 0, -1);
  offsetAdelante.applyQuaternion(camera.quaternion);
  posicionBala.add(offsetAdelante);

  // Para escopetas, disparar múltiples proyectiles
  const numProyectiles = configArma.proyectiles || 1;
  let dispersion = configArma.dispersion || 0;
  
  // Reducir dispersión si está apuntando (para escopetas)
  if (arma.estaApuntando && configArma.apuntado && configArma.apuntado.reduccionDispersion) {
    dispersion *= configArma.apuntado.reduccionDispersion;
  }

  for (let i = 0; i < numProyectiles; i++) {
    // Calcular dirección de la bala con dispersión
    const direccion = new THREE.Vector3(0, 0, -1);
    direccion.applyQuaternion(camera.quaternion);
    
    // Aplicar dispersión si es necesario
    if (dispersion > 0) {
      direccion.x += (Math.random() - 0.5) * dispersion;
      direccion.y += (Math.random() - 0.5) * dispersion;
    }
    
    direccion.normalize();

    // Crear la bala con la configuración del arma actual
    const bala = new Bala(scene, posicionBala.clone(), direccion, onImpacto, {
      velocidad: configArma.velocidadBala,
      daño: configArma.daño
    });
    balas.push(bala);
  }

  // Animar retroceso
  animarRetroceso();

  // SONIDO DIRECTO - MÉTODO SIMPLE QUE FUNCIONA (REVERTIDO)
  if (configArma.sonidoDisparo) {
    try {
      const audio = new Audio(configArma.sonidoDisparo);
      audio.volume = 0.4;
      audio.play().catch(e => console.log('Audio error:', e));
      console.log(`🔫 SONIDO: ${configArma.sonidoDisparo}`);
    } catch (e) {
      console.log('Error creando audio:', e);
    }
  }

  return true;
}

/**
 * Inicia la recarga del arma
 * @param {Function} onRecargaCompleta - Callback cuando termina la recarga
 * @returns {boolean} - true si se inició la recarga
 */
export function recargar(onRecargaCompleta = null) {
  const configArma = obtenerConfigArmaActual();
  
  if (
    arma.estaRecargando ||
    arma.municionActual === configArma.tamañoCargador ||
    arma.municionTotal <= 0
  ) {
    return false;
  }

  arma.estaRecargando = true;

  setTimeout(() => {
    const municionNecesaria = configArma.tamañoCargador - arma.municionActual;
    const municionARecargar = Math.min(municionNecesaria, arma.municionTotal);

    arma.municionActual += municionARecargar;
    arma.municionTotal -= municionARecargar;
    arma.estaRecargando = false;

    if (onRecargaCompleta) {
      onRecargaCompleta();
    }
  }, configArma.tiempoRecarga * 1000);

  return true;
}

/**
 * Anima el retroceso del arma al disparar
 */
export function animarRetroceso() {
  if (!modeloArma) return;

  const configArma = obtenerConfigArmaActual();
  let retroceso = configArma.retroceso.cantidad || 0.08;
  let subirArma = (configArma.retroceso.arriba || 0.02) * 0.3; // Reducido al 30%
  const retrocesoCamara = configArma.retroceso.camara || 0.015; // Retroceso de cámara
  
  // Incrementar disparos consecutivos para afectar precisión
  arma.disparosConsecutivos = Math.min(arma.disparosConsecutivos + 1, 15);
  
  // Reducir retroceso si está apuntando
  if (arma.estaApuntando && configArma.apuntado && configArma.apuntado.reduccionRetroceso) {
    const reduccion = configArma.apuntado.reduccionRetroceso;
    retroceso *= reduccion;
    subirArma *= reduccion;
  }

  // Guardar posición actual (que puede estar en apuntado)
  const posicionActualZ = modeloArma.position.z;
  const posicionActualY = modeloArma.position.y;

  // Aplicar retroceso con límite para evitar que atraviese la cámara
  const limiteMaxZ = -0.1;
  const nuevaPosZ = posicionActualZ + retroceso;
  modeloArma.position.z = Math.min(nuevaPosZ, limiteMaxZ);
  modeloArma.position.y += subirArma;

  // Aplicar retroceso a la cámara (subir la vista)
  if (camera) {
    const retrocesoCamaraFinal = arma.estaApuntando ? retrocesoCamara * 0.5 : retrocesoCamara;
    camera.rotation.x += retrocesoCamaraFinal;
  }

  // Restaurar posición después de la duración
  const duracion = configArma.retroceso.duracion || 80;
  setTimeout(() => {
    if (modeloArma) {
      modeloArma.position.z = posicionActualZ;
      modeloArma.position.y = posicionActualY;
    }
  }, duracion);
}

/**
 * Obtiene el estado actual del arma
 * Requirements: 4.3, 4.4, 4.5 - Incluir info de cuchillo para UI
 * Requirements: 3.1 - Incluir info de JuiceBox para UI
 * @returns {Object} - Estado del arma
 */
export function obtenerEstado() {
  const configArma = obtenerConfigArmaActual();
  return {
    tipoActual: arma.tipoActual || 'M4A1',
    nombre: configArma?.nombre || 'Sin arma',
    municionActual: arma.municionActual,
    municionTotal: arma.municionTotal,
    estaRecargando: arma.estaRecargando,
    puedeDisparar: arma.puedeDisparar,
    armasDisponibles: inventarioArmas.armasDisponibles,
    estaApuntando: arma.estaApuntando,
    factorApuntado: arma.transicionApuntado,
    tieneApuntado: !!configArma?.apuntado,
    inicializado: arma.inicializado,
    // Info del cuchillo para UI de slots
    esCuchillo: estadoCuchillo.equipado,
    armaPrincipalPrevia: estadoCuchillo.armaPrincipalPrevia,
    // Info del JuiceBox para UI
    esJuiceBox: estadoCuracion.juiceBoxEquipado,
    curacionEnProgreso: estadoCuracion.curacionEnProgreso,
    progresoCuracion: obtenerProgresoCuracion()
  };
}

/**
 * Verifica si el arma puede disparar
 * @returns {boolean}
 */
export function puedeDisparar() {
  const ahora = performance.now();
  const configArma = obtenerConfigArmaActual();
  const tiempoEntreDisparos = (60 / configArma.cadenciaDisparo) * 1000;

  return (
    arma.puedeDisparar &&
    !arma.estaRecargando &&
    arma.municionActual > 0 &&
    ahora - arma.ultimoDisparo >= tiempoEntreDisparos
  );
}

/**
 * Reinicia el estado del arma a valores iniciales
 */
export function reiniciarArma() {
  const configArma = obtenerConfigArmaActual();
  arma.municionActual = configArma.tamañoCargador;
  arma.municionTotal = configArma.municionTotal;
  arma.estaRecargando = false;
  arma.puedeDisparar = true;
  arma.ultimoDisparo = 0;
}

/**
 * Update weapon state from server (Requirement 6.5)
 * IMPORTANTE: Solo actualiza si el arma del servidor coincide con la local
 * para evitar sobrescribir valores cuando el servidor aún no procesó el cambio de arma
 * @param {Object} serverState - Player state from server containing ammo info
 */
export function actualizarDesdeServidor(serverState) {
  if (!serverState) return;
  
  // Si el arma no está inicializada localmente, no actualizar desde el servidor
  if (!arma.inicializado) {
    console.log('🔫 [actualizarDesdeServidor] Arma no inicializada, ignorando estado del servidor');
    return;
  }
  
  // Verificar si el arma del servidor coincide con la local
  const armaServidor = serverState.currentWeapon;
  if (armaServidor && armaServidor !== arma.tipoActual) {
    // El servidor tiene un arma diferente, no actualizar munición
    // Esto puede pasar si el servidor aún no procesó el weaponChange
    console.log(`🔫 [actualizarDesdeServidor] Arma diferente: servidor=${armaServidor}, local=${arma.tipoActual} - Ignorando`);
    return;
  }
  
  // Update ammo from server (authoritative) solo si el arma coincide
  if (typeof serverState.ammo === 'number') {
    arma.municionActual = serverState.ammo;
  }
  
  // Update total ammo if provided
  if (typeof serverState.totalAmmo === 'number') {
    arma.municionTotal = serverState.totalAmmo;
  }
  
  // Update reload state from server
  if (typeof serverState.isReloading === 'boolean') {
    arma.estaRecargando = serverState.isReloading;
  }
}

/**
 * Ataca con el cuchillo (arma cuerpo a cuerpo)
 * Requirements: 2.1, 2.2, 4.1, 4.5
 * 
 * @param {THREE.Camera} camera - Cámara del jugador para obtener posición y dirección
 * @param {Array} enemigos - Array de enemigos/jugadores en la escena
 * @param {THREE.Scene} scene - Escena de Three.js
 * @param {Function} onImpacto - Callback cuando el cuchillo impacta un enemigo
 * @returns {Object} - { impacto: boolean, enemigosGolpeados: Array }
 */
export function atacarConCuchillo(camera, enemigos, scene, onImpacto = null) {
  // Requirements: 2.1 - Validar array de enemigos al inicio
  // Convertir null/undefined a array vacío para evitar crashes
  if (!enemigos || !Array.isArray(enemigos)) {
    enemigos = [];
  }

  const configCuchillo = CONFIG.armas["KNIFE"];
  if (!configCuchillo) {
    console.warn("⚠️ Configuración del cuchillo no encontrada");
    return { impacto: false, enemigosGolpeados: [] };
  }

  const ahora = performance.now();
  const cadenciaAtaque = configCuchillo.cadenciaAtaque || 350;

  // Verificar si puede atacar (cadencia)
  if (ahora - estadoCuchillo.ultimoAtaque < cadenciaAtaque) {
    // No mostrar log para evitar spam
    return { impacto: false, enemigosGolpeados: [] };
  }

  estadoCuchillo.ultimoAtaque = ahora;
  
  console.log(`🔪 ATAQUE EJECUTADO - modeloArma: ${modeloArma ? 'existe' : 'NULL'}, arma.tipoActual: ${arma.tipoActual}`);

  // SIEMPRE animar el ataque, haya o no enemigos
  if (modeloArma && arma.tipoActual === "KNIFE") {
    console.log('🔪 Ejecutando animación FPS');
    animarAtaqueCuchillo();
  } else {
    console.log(`🔪 NO se ejecuta animación - modeloArma: ${!!modeloArma}, tipoActual: ${arma.tipoActual}`);
  }

  // Obtener posición y dirección del jugador
  const posicionJugador = camera.position.clone();
  const direccionMirada = new THREE.Vector3(0, 0, -1);
  direccionMirada.applyQuaternion(camera.quaternion);
  direccionMirada.normalize();

  const rangoAtaque = configCuchillo.rangoAtaque || 3;
  const daño = configCuchillo.daño || 50;

  const enemigosGolpeados = [];

  console.log(`🔪 Buscando enemigos - Disponibles: ${enemigos.length}, Rango: ${rangoAtaque}`);

  // Detectar enemigos en rango
  // Requirements: 2.1, 2.2 - Agregar try-catch alrededor del procesamiento de cada enemigo
  for (const enemigo of enemigos) {
    // Requirements: 2.2 - Saltar enemigos null/undefined sin crashear
    if (!enemigo) continue;
    
    try {
      // Obtener posición del enemigo (soportar diferentes estructuras)
      // Requirements: 2.2 - Validar posición de enemigos
      let posicionEnemigo = null;
      
      try {
        if (enemigo.mesh && enemigo.mesh.position) {
          posicionEnemigo = enemigo.mesh.position.clone();
        } else if (enemigo.obtenerPosicion) {
          posicionEnemigo = enemigo.obtenerPosicion();
        } else if (enemigo.position) {
          posicionEnemigo = new THREE.Vector3(enemigo.position.x, enemigo.position.y, enemigo.position.z);
        } else if (enemigo.group && enemigo.group.position) {
          posicionEnemigo = enemigo.group.position.clone();
        }
      } catch (errorPosicion) {
        console.warn('🔪 Error obteniendo posición de enemigo:', errorPosicion);
        continue; // Saltar este enemigo y continuar con los demás
      }
      
      // Requirements: 2.2 - Verificar que posicionEnemigo no sea null antes de usar
      if (!posicionEnemigo) {
        console.log('🔪 Enemigo sin posición válida, saltando');
        continue;
      }

      // Verificar si el enemigo está vivo
      const estaVivo = enemigo.estaVivo ? enemigo.estaVivo() : 
                       (enemigo.datos ? enemigo.datos.estaVivo : 
                       (enemigo.isAlive !== undefined ? enemigo.isAlive() : true));
      
      if (!estaVivo) continue;

      // Calcular distancia al enemigo
      const distancia = posicionJugador.distanceTo(posicionEnemigo);

      console.log(`🔪 Enemigo a distancia: ${distancia.toFixed(2)} (rango: ${rangoAtaque})`);

      // Verificar si está en rango
      if (distancia <= rangoAtaque) {
        // Verificar que el enemigo está aproximadamente frente al jugador
        const direccionAlEnemigo = posicionEnemigo.clone().sub(posicionJugador).normalize();
        const angulo = direccionMirada.dot(direccionAlEnemigo);

        console.log(`🔪 Ángulo con enemigo: ${angulo.toFixed(2)} (necesita > -0.3)`);

        // Aceptar enemigos en un cono amplio (casi 180 grados)
        if (angulo > -0.3) {
          // Aplicar daño al enemigo
          let dañoAplicado = false;
          
          if (typeof enemigo.recibirDaño === 'function') {
            enemigo.recibirDaño(daño);
            dañoAplicado = true;
          } else if (enemigo.datos && enemigo.datos.vidaActual !== undefined) {
            enemigo.datos.vidaActual -= daño;
            dañoAplicado = true;
          } else if (enemigo.vida !== undefined) {
            enemigo.vida -= daño;
            dañoAplicado = true;
          }

          if (dañoAplicado) {
            enemigosGolpeados.push({
              enemigo: enemigo,
              distancia: distancia,
              daño: daño
            });

            // Callback de impacto
            if (onImpacto) {
              onImpacto({
                tipo: 'melee',
                enemigo: enemigo,
                daño: daño,
                posicion: posicionEnemigo
              });
            }

            console.log(`🔪 ¡IMPACTO! Cuchillo golpeó enemigo a ${distancia.toFixed(2)} unidades - Daño: ${daño}`);
          }
        }
      }
    } catch (errorEnemigo) {
      // Requirements: 2.1, 2.2 - Manejar errores sin crashear, continuar con otros enemigos
      console.warn('🔪 Error procesando enemigo, continuando con los demás:', errorEnemigo);
      continue;
    }
  }

  return {
    impacto: enemigosGolpeados.length > 0,
    enemigosGolpeados: enemigosGolpeados
  };
}

/**
 * Anima el ataque del cuchillo
 * Requirements: 4.3
 * Usa la animación cargada si está disponible, sino usa animación fallback mejorada
 */
function animarAtaqueCuchillo() {
  if (!modeloArma) {
    console.log('🔪 No hay modelo de arma para animar');
    return;
  }

  console.log('🔪 Iniciando animación de ataque FPS');

  // Intentar usar la animación cargada primero
  if (animacionesCuchillo.accionAtaque && animacionesCuchillo.mixer) {
    reproducirAnimacionAtaqueCuchillo();
    return;
  }

  // Animación fallback mejorada - movimiento de slash horizontal
  // Guardar posición y rotación original
  const posOriginal = {
    x: modeloArma.position.x,
    y: modeloArma.position.y,
    z: modeloArma.position.z
  };
  const rotOriginal = {
    x: modeloArma.rotation.x,
    y: modeloArma.rotation.y,
    z: modeloArma.rotation.z
  };

  // Parámetros de animación más dramáticos
  const duracionPreparacion = 40;   // ms - preparar el golpe
  const duracionAtaque = 80;        // ms - slash rápido
  const duracionRetorno = 180;      // ms - volver a posición

  // Fase 1: Preparación - mover a la derecha y rotar
  modeloArma.position.x += 0.15;
  modeloArma.position.z += 0.1;
  modeloArma.rotation.z -= 0.4;
  modeloArma.rotation.y -= 0.3;

  // Fase 2: Ataque - slash hacia la izquierda y adelante
  setTimeout(() => {
    if (!modeloArma) return;
    modeloArma.position.x = posOriginal.x - 0.25;  // Mover a la izquierda
    modeloArma.position.z = posOriginal.z - 0.35;  // Empujar hacia adelante
    modeloArma.position.y = posOriginal.y - 0.1;   // Bajar un poco
    modeloArma.rotation.z = rotOriginal.z + 0.6;   // Rotar en el slash
    modeloArma.rotation.x = rotOriginal.x + 0.3;   // Inclinar hacia abajo
  }, duracionPreparacion);

  // Fase 3: Retorno suave a posición original
  setTimeout(() => {
    if (!modeloArma) return;
    
    const pasos = 12;
    const intervalo = duracionRetorno / pasos;
    let paso = 0;
    
    // Posición después del ataque
    const posAtaque = {
      x: posOriginal.x - 0.25,
      y: posOriginal.y - 0.1,
      z: posOriginal.z - 0.35
    };
    const rotAtaque = {
      x: rotOriginal.x + 0.3,
      y: rotOriginal.y,
      z: rotOriginal.z + 0.6
    };
    
    const animarRetorno = setInterval(() => {
      paso++;
      const progreso = paso / pasos;
      const easeOut = 1 - Math.pow(1 - progreso, 3); // Ease out cubic
      
      if (modeloArma) {
        modeloArma.position.x = posAtaque.x + (posOriginal.x - posAtaque.x) * easeOut;
        modeloArma.position.y = posAtaque.y + (posOriginal.y - posAtaque.y) * easeOut;
        modeloArma.position.z = posAtaque.z + (posOriginal.z - posAtaque.z) * easeOut;
        modeloArma.rotation.x = rotAtaque.x + (rotOriginal.x - rotAtaque.x) * easeOut;
        modeloArma.rotation.y = rotAtaque.y + (rotOriginal.y - rotAtaque.y) * easeOut;
        modeloArma.rotation.z = rotAtaque.z + (rotOriginal.z - rotAtaque.z) * easeOut;
      }
      
      if (paso >= pasos) {
        clearInterval(animarRetorno);
        // Asegurar posición final exacta
        if (modeloArma) {
          modeloArma.position.set(posOriginal.x, posOriginal.y, posOriginal.z);
          modeloArma.rotation.set(rotOriginal.x, rotOriginal.y, rotOriginal.z);
        }
      }
    }, intervalo);
  }, duracionPreparacion + duracionAtaque);
  
  console.log('🔪 Animación de ataque FPS ejecutada');
}

/**
 * Verifica si el cuchillo puede atacar (no requiere munición)
 * Requirements: 4.4
 * @returns {boolean} - Siempre true para el cuchillo (no requiere munición)
 */
export function cuchilloPuedeAtacar() {
  const configCuchillo = CONFIG.armas["KNIFE"];
  if (!configCuchillo) return false;

  const ahora = performance.now();
  const cadenciaAtaque = configCuchillo.cadenciaAtaque || 500;

  return ahora - estadoCuchillo.ultimoAtaque >= cadenciaAtaque;
}

/**
 * Verifica si el arma actual es el cuchillo
 * @returns {boolean}
 */
export function esCuchillo() {
  return arma.tipoActual === "KNIFE";
}

/**
 * Verifica si el cuchillo está equipado actualmente
 * Requirements: 2.1, 2.2
 * @returns {boolean}
 */
export function esCuchilloEquipado() {
  // Verificar tanto el estado del cuchillo como el tipo de arma actual
  const equipado = estadoCuchillo.equipado || arma.tipoActual === 'KNIFE';
  console.log(`🔪 esCuchilloEquipado: ${equipado} (estado: ${estadoCuchillo.equipado}, arma: ${arma.tipoActual})`);
  return equipado;
}

/**
 * Obtiene el arma principal previa guardada
 * Requirements: 2.3
 * @returns {string|null} - Tipo de arma principal o null si no hay
 */
export function obtenerArmaPrincipalPrevia() {
  return estadoCuchillo.armaPrincipalPrevia;
}

/**
 * Alterna entre el cuchillo y el arma principal con la tecla Q
 * Requirements: 2.1, 2.2, 5.3
 * Requirements: 2.4 - Desequipar JuiceBox al cambiar a cuchillo
 * 
 * Si tiene arma principal equipada: guarda el arma y equipa el cuchillo
 * Si tiene cuchillo equipado: restaura el arma principal guardada
 * 
 * @param {THREE.Object3D} weaponContainer - Contenedor del arma para cambiar el modelo
 * @returns {boolean} - true si se realizó el cambio exitosamente
 */
export async function alternarCuchillo(weaponContainer = null) {
  // No permitir cambio durante recarga
  if (arma.estaRecargando) {
    console.log('🔪 No se puede cambiar al cuchillo durante recarga');
    return false;
  }

  // Requirements: 2.4 - Desequipar JuiceBox al cambiar a cuchillo
  if (estadoCuracion.juiceBoxEquipado) {
    if (estadoCuracion.modeloJuiceBox) {
      estadoCuracion.modeloJuiceBox.visible = false;
    }
    estadoCuracion.juiceBoxEquipado = false;
    estadoCuracion.armaPreviaACuracion = null;
    if (estadoCuracion.curacionEnProgreso) {
      cancelarCuracion();
    }
    console.log('🧃 JuiceBox desequipado por cambio a cuchillo');
  }

  if (estadoCuchillo.equipado) {
    // Tiene cuchillo equipado -> restaurar arma principal
    const armaPrincipal = estadoCuchillo.armaPrincipalPrevia;
    
    if (!armaPrincipal || !CONFIG.armas[armaPrincipal]) {
      console.warn('⚠️ No hay arma principal previa para restaurar');
      return false;
    }

    // Restaurar arma principal
    arma.tipoActual = armaPrincipal;
    const configArma = CONFIG.armas[armaPrincipal];
    
    // Restaurar munición del arma principal (mantener valores actuales si existen)
    if (arma.municionActual === 0 && arma.municionTotal === 0) {
      arma.municionActual = configArma.tamañoCargador;
      arma.municionTotal = configArma.municionTotal;
    }
    
    arma.estaRecargando = false;
    estadoCuchillo.equipado = false;
    
    // Requirements: 5.3 - Al cambiar de cuchillo a arma principal, el apuntado funciona normalmente
    // El estado de apuntado se mantiene en false, permitiendo que el jugador apunte cuando quiera

    // Cambiar modelo si se proporciona el contenedor
    if (weaponContainer) {
      await cambiarModeloArma(armaPrincipal, weaponContainer);
    }

    console.log(`🔫 Restaurado arma principal: ${configArma.nombre} - Apuntado disponible`);
    return true;
  } else {
    // Tiene arma principal equipada -> guardar y equipar cuchillo
    const armaActual = arma.tipoActual;
    
    // No guardar si ya es el cuchillo
    if (armaActual === 'KNIFE') {
      return false;
    }

    // Guardar arma principal actual
    estadoCuchillo.armaPrincipalPrevia = armaActual;
    
    // Equipar cuchillo
    arma.tipoActual = 'KNIFE';
    estadoCuchillo.equipado = true;
    
    // Requirements: 5.1, 5.4 - Desactivar apuntado al equipar cuchillo
    // Si estaba apuntando, desactivar y restaurar FOV
    if (arma.estaApuntando) {
      arma.estaApuntando = false;
      arma.transicionApuntado = 0;
      
      // Restaurar FOV de la cámara si existe
      if (camera) {
        camera.fov = fovOriginal;
        camera.updateProjectionMatrix();
      }
      
      console.log('🔪 Apuntado desactivado al equipar cuchillo');
    }
    
    // El cuchillo no tiene munición
    // No modificamos municionActual/municionTotal para preservar los valores del arma principal

    // Cambiar modelo si se proporciona el contenedor
    if (weaponContainer) {
      await cambiarModeloArma('KNIFE', weaponContainer);
    }

    console.log(`🔪 Cuchillo equipado - Arma guardada: ${armaActual}`);
    return true;
  }
}
