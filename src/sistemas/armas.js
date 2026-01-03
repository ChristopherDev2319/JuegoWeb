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
 */
export const arma = {
  tipoActual: CONFIG.armaActual,
  municionActual: CONFIG.armas[CONFIG.armaActual].tamañoCargador,
  municionTotal: CONFIG.armas[CONFIG.armaActual].municionTotal,
  estaRecargando: false,
  puedeDisparar: true,
  ultimoDisparo: 0,
  estaApuntando: false,
  transicionApuntado: 0, // 0 = no apuntando, 1 = completamente apuntando
  retrocesoacumulado: 0, // Retroceso acumulado que afecta precisión
  disparosConsecutivos: 0 // Contador de disparos consecutivos
};

/**
 * Inventario de armas disponibles
 */
export const inventarioArmas = {
  armasDisponibles: [CONFIG.armaActual], // Empezamos solo con el arma por defecto
  armaSeleccionada: 0 // Índice del arma actual
};

/**
 * Establece el inventario con una única arma
 * Requirements: 2.2 - El jugador solo puede usar el arma seleccionada
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
  
  // Reiniciar munición
  arma.municionActual = configArma.tamañoCargador;
  arma.municionTotal = configArma.municionTotal;
  arma.estaRecargando = false;
  arma.ultimoDisparo = 0;
  arma.estaApuntando = false;
  arma.transicionApuntado = 0;
  arma.disparosConsecutivos = 0;
  
  // Cambiar modelo si se proporciona el contenedor
  if (weaponContainer) {
    cambiarModeloArma(tipoArma, weaponContainer);
  }
  
  console.log(`🔫 Inventario establecido con arma única: ${configArma.nombre}`);
  return true;
}

/**
 * Referencia al modelo del arma para animaciones
 */
let modeloArma = null;
let modelosArmas = {}; // Cache de modelos cargados
let cargandoModelo = false;

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
  return CONFIG.armas[arma.tipoActual];
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

  arma.tipoActual = tipoArma;
  const configArma = obtenerConfigArmaActual();
  
  // Reiniciar munición al cambiar arma
  arma.municionActual = configArma.tamañoCargador;
  arma.municionTotal = configArma.municionTotal;
  arma.estaRecargando = false;
  arma.ultimoDisparo = 0;
  arma.estaApuntando = false;
  arma.transicionApuntado = 0;

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
 * @param {THREE.Object3D} weaponContainer - Contenedor del arma (opcional)
 */
export function siguienteArma(weaponContainer = null) {
  if (inventarioArmas.armasDisponibles.length <= 1) return;

  inventarioArmas.armaSeleccionada = (inventarioArmas.armaSeleccionada + 1) % inventarioArmas.armasDisponibles.length;
  const nuevaArma = inventarioArmas.armasDisponibles[inventarioArmas.armaSeleccionada];
  cambiarArma(nuevaArma, weaponContainer);
}

/**
 * Selecciona la arma anterior en el inventario
 * @param {THREE.Object3D} weaponContainer - Contenedor del arma (opcional)
 */
export function armaAnterior(weaponContainer = null) {
  if (inventarioArmas.armasDisponibles.length <= 1) return;

  inventarioArmas.armaSeleccionada = inventarioArmas.armaSeleccionada - 1;
  if (inventarioArmas.armaSeleccionada < 0) {
    inventarioArmas.armaSeleccionada = inventarioArmas.armasDisponibles.length - 1;
  }
  const nuevaArma = inventarioArmas.armasDisponibles[inventarioArmas.armaSeleccionada];
  cambiarArma(nuevaArma, weaponContainer);
}

/**
 * Carga un modelo de arma específico
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
    const fbxLoader = new THREE.FBXLoader();

    console.log(`🔫 Cargando modelo: ${configArma.modelo}`);

    fbxLoader.load(
      configArma.modelo,
      (armaCaregada) => {
        // Calcular escala
        const box = new THREE.Box3().setFromObject(armaCaregada);
        const size = new THREE.Vector3();
        box.getSize(size);

        const longitudDeseada = 0.8;
        const escala = longitudDeseada / Math.max(size.x, size.y, size.z);
        armaCaregada.scale.setScalar(escala);

        // Posicionar el arma usando la configuración específica
        const posConfig = configArma.posicion || { x: 0.3, y: -0.3, z: -0.5 };
        const rotConfig = configArma.rotacion || { x: 0, y: Math.PI, z: 0 };
        
        armaCaregada.position.set(posConfig.x, posConfig.y, posConfig.z);
        armaCaregada.rotation.set(rotConfig.x, rotConfig.y, rotConfig.z);

        // Sin sombras
        armaCaregada.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });

        // Guardar en cache
        modelosArmas[tipoArma] = armaCaregada.clone();
        
        cargandoModelo = false;
        console.log(`✅ Modelo cargado: ${configArma.nombre}`);
        resolve(armaCaregada);
      },
      (progress) => {
        console.log(`📦 Cargando ${configArma.nombre}: ${Math.round((progress.loaded / progress.total) * 100)}%`);
      },
      (error) => {
        cargandoModelo = false;
        console.error(`❌ Error cargando modelo ${configArma.modelo}:`, error);
        reject(error);
      }
    );
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
    
    // Guardar posición original para apuntado
    if (modeloArma) {
      posicionArmaOriginal = {
        x: modeloArma.position.x,
        y: modeloArma.position.y,
        z: modeloArma.position.z
      };
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
 * @param {boolean} apuntar - true para apuntar, false para dejar de apuntar
 */
export function alternarApuntado(apuntar = null) {
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
 * @returns {Object} - Estado del arma
 */
export function obtenerEstado() {
  const configArma = obtenerConfigArmaActual();
  return {
    tipoActual: arma.tipoActual,
    nombre: configArma.nombre,
    municionActual: arma.municionActual,
    municionTotal: arma.municionTotal,
    estaRecargando: arma.estaRecargando,
    puedeDisparar: arma.puedeDisparar,
    armasDisponibles: inventarioArmas.armasDisponibles,
    estaApuntando: arma.estaApuntando,
    factorApuntado: arma.transicionApuntado,
    tieneApuntado: !!configArma.apuntado
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
 * @param {Object} serverState - Player state from server containing ammo info
 */
export function actualizarDesdeServidor(serverState) {
  if (!serverState) return;
  
  // Update ammo from server (authoritative)
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
