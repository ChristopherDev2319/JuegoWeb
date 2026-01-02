/**
 * Módulo de UI del lobby
 * Requirements: 1.1, 1.2, 1.3, 2.3, 3.1, 3.2, 3.3, 4.1, 4.3, 4.5, 5.1, 5.3, 5.4, 5.5, 6.4, 7.1, 7.2, 7.4
 */

import { validarNombre, validarPassword, generarNombreAleatorio } from './validaciones.js';
import { 
  lobbyState, 
  establecerNombre, 
  obtenerNombre, 
  guardarConfiguracion, 
  cargarConfiguracion,
  obtenerEstadisticas,
  actualizarConfiguracion
} from './lobbyState.js';

// Referencias a elementos del DOM
let elementos = {};

// Callbacks para eventos del lobby
let callbacks = {};

// Pantalla actual
let pantallaActual = 'inicial';

/**
 * Inicializa el sistema de lobby UI
 * @param {Object} cbs - Callbacks para eventos del lobby
 * @param {Function} cbs.onModoLocal - Callback cuando se selecciona modo local
 * @param {Function} cbs.onMatchmaking - Callback cuando se inicia matchmaking
 * @param {Function} cbs.onCrearPartida - Callback cuando se crea partida privada
 * @param {Function} cbs.onUnirsePartida - Callback cuando se une a partida privada
 * @param {Function} cbs.onCancelarMatchmaking - Callback cuando se cancela matchmaking
 * @param {Function} cbs.onSalirSala - Callback cuando se sale de una sala
 * @param {Function} cbs.onIniciarPartida - Callback cuando se inicia la partida
 */
export function inicializarLobbyUI(cbs = {}) {
  callbacks = cbs;
  
  // Cargar configuración guardada
  cargarConfiguracion();
  
  // Cachear referencias a elementos del DOM
  cachearElementos();
  
  // Configurar eventos de botones
  configurarEventos();
  
  // Cargar datos iniciales
  cargarDatosIniciales();
  
  // Mostrar pantalla inicial
  mostrarPantalla('inicial');
}


/**
 * Cachea referencias a elementos del DOM para mejor rendimiento
 */
function cachearElementos() {
  elementos = {
    // Pantallas
    lobbyScreen: document.getElementById('lobby-screen'),
    pantallaInicial: document.getElementById('lobby-inicial'),
    pantallaOnline: document.getElementById('lobby-online'),
    pantallaPrivada: document.getElementById('lobby-privada'),
    pantallaCrear: document.getElementById('lobby-crear'),
    pantallaUnirse: document.getElementById('lobby-unirse'),
    pantallaMatchmaking: document.getElementById('lobby-matchmaking'),
    pantallaEsperando: document.getElementById('lobby-esperando'),
    pantallaConfig: document.getElementById('lobby-config'),
    
    // Inputs
    inputNombre: document.getElementById('nombre-jugador'),
    inputCrearPassword: document.getElementById('crear-password'),
    inputUnirseCodigo: document.getElementById('unirse-codigo'),
    inputUnirsePassword: document.getElementById('unirse-password'),
    
    // Errores
    errorNombre: document.getElementById('nombre-error'),
    errorCrearPassword: document.getElementById('crear-password-error'),
    errorCrear: document.getElementById('crear-error'),
    errorUnirse: document.getElementById('unirse-error'),
    
    // Estadísticas (nuevo layout vertical)
    statsKills: document.getElementById('lobby-kills'),
    statsMuertes: document.getElementById('lobby-muertes'),
    statsKD: document.getElementById('lobby-kd'),
    statsPartidas: document.getElementById('lobby-partidas'),
    statsVictorias: document.getElementById('lobby-victorias'),
    
    // Matchmaking
    matchmakingEstado: document.getElementById('matchmaking-estado'),
    
    // Sala esperando
    salaCodigo: document.getElementById('sala-codigo'),
    salaJugadoresCount: document.getElementById('sala-jugadores-count'),
    salaJugadoresLista: document.getElementById('sala-jugadores-lista'),
    
    // Configuración
    configSensibilidad: document.getElementById('lobby-sensibilidad'),
    configSensibilidadValor: document.getElementById('lobby-sensibilidad-valor'),
    configVolumen: document.getElementById('lobby-volumen'),
    configVolumenValor: document.getElementById('lobby-volumen-valor'),
    configMostrarFPS: document.getElementById('lobby-mostrar-fps'),
    configCrosshairDinamico: document.getElementById('lobby-crosshair-dinamico'),
    
    // Botones
    btnNombreAleatorio: document.getElementById('btn-nombre-aleatorio'),
    btnModoLocal: document.getElementById('btn-modo-local'),
    btnModoOnline: document.getElementById('btn-modo-online'),
    btnConfigLobby: document.getElementById('btn-config-lobby'),
    btnVolverInicial: document.getElementById('btn-volver-inicial'),
    btnPartidaPublica: document.getElementById('btn-partida-publica'),
    btnPartidaPrivada: document.getElementById('btn-partida-privada'),
    btnVolverOnline: document.getElementById('btn-volver-online'),
    btnCrearPartida: document.getElementById('btn-crear-partida'),
    btnUnirsePartida: document.getElementById('btn-unirse-partida'),
    btnVolverPrivadaCrear: document.getElementById('btn-volver-privada-crear'),
    btnConfirmarCrear: document.getElementById('btn-confirmar-crear'),
    btnVolverPrivadaUnirse: document.getElementById('btn-volver-privada-unirse'),
    btnConfirmarUnirse: document.getElementById('btn-confirmar-unirse'),
    btnCancelarMatchmaking: document.getElementById('btn-cancelar-matchmaking'),
    btnSalirSala: document.getElementById('btn-salir-sala'),
    btnCopiarCodigo: document.getElementById('btn-copiar-codigo'),
    btnIniciarPartida: document.getElementById('btn-iniciar-partida'),
    btnVolverConfig: document.getElementById('btn-volver-config'),
    btnGuardarConfig: document.getElementById('btn-guardar-config'),
    
    // Elementos adicionales del nuevo layout
    onlineCount: document.querySelector('.online-count')
  };
}


/**
 * Configura todos los eventos de botones y elementos interactivos
 */
function configurarEventos() {
  // === Pantalla Inicial ===
  
  // Input de nombre - validación en tiempo real
  if (elementos.inputNombre) {
    elementos.inputNombre.addEventListener('input', (e) => {
      const nombre = e.target.value;
      if (nombre.length > 0) {
        const resultado = validarNombre(nombre);
        if (!resultado.valido) {
          mostrarErrorEnElemento(elementos.errorNombre, resultado.error);
        } else {
          limpiarErrorEnElemento(elementos.errorNombre);
          establecerNombre(nombre);
        }
      } else {
        limpiarErrorEnElemento(elementos.errorNombre);
      }
    });
    
    // Guardar nombre al perder foco
    elementos.inputNombre.addEventListener('blur', () => {
      const nombre = elementos.inputNombre.value.trim();
      if (nombre && validarNombre(nombre).valido) {
        establecerNombre(nombre);
        guardarConfiguracion();
      }
    });
  }
  
  // Botón nombre aleatorio
  if (elementos.btnNombreAleatorio) {
    elementos.btnNombreAleatorio.addEventListener('click', () => {
      const nombreAleatorio = generarNombreAleatorio();
      elementos.inputNombre.value = nombreAleatorio;
      establecerNombre(nombreAleatorio);
      limpiarErrorEnElemento(elementos.errorNombre);
      guardarConfiguracion();
    });
  }
  
  // Botón modo local
  if (elementos.btnModoLocal) {
    elementos.btnModoLocal.addEventListener('click', () => {
      if (validarYGuardarNombre()) {
        if (callbacks.onModoLocal) {
          callbacks.onModoLocal(obtenerNombre());
        }
      }
    });
  }
  
  // Botón modo online
  if (elementos.btnModoOnline) {
    elementos.btnModoOnline.addEventListener('click', () => {
      if (validarYGuardarNombre()) {
        mostrarPantalla('online');
      }
    });
  }
  
  // Botón configuración
  if (elementos.btnConfigLobby) {
    elementos.btnConfigLobby.addEventListener('click', () => {
      cargarConfiguracionEnUI();
      mostrarPantalla('config');
    });
  }
  
  // === Pantalla Online ===
  
  // Botón volver a inicial
  if (elementos.btnVolverInicial) {
    elementos.btnVolverInicial.addEventListener('click', () => {
      mostrarPantalla('inicial');
    });
  }
  
  // Botón partida pública (matchmaking)
  if (elementos.btnPartidaPublica) {
    elementos.btnPartidaPublica.addEventListener('click', () => {
      mostrarPantalla('matchmaking');
      if (callbacks.onMatchmaking) {
        callbacks.onMatchmaking(obtenerNombre());
      }
    });
  }
  
  // Botón partida privada
  if (elementos.btnPartidaPrivada) {
    elementos.btnPartidaPrivada.addEventListener('click', () => {
      mostrarPantalla('privada');
    });
  }
  
  // === Pantalla Privada ===
  
  // Botón volver a online
  if (elementos.btnVolverOnline) {
    elementos.btnVolverOnline.addEventListener('click', () => {
      mostrarPantalla('online');
    });
  }
  
  // Botón crear partida
  if (elementos.btnCrearPartida) {
    elementos.btnCrearPartida.addEventListener('click', () => {
      limpiarErrorEnElemento(elementos.errorCrearPassword);
      limpiarErrorEnElemento(elementos.errorCrear);
      if (elementos.inputCrearPassword) {
        elementos.inputCrearPassword.value = '';
      }
      mostrarPantalla('crear');
    });
  }
  
  // Botón unirse a partida
  if (elementos.btnUnirsePartida) {
    elementos.btnUnirsePartida.addEventListener('click', () => {
      limpiarErrorEnElemento(elementos.errorUnirse);
      if (elementos.inputUnirseCodigo) elementos.inputUnirseCodigo.value = '';
      if (elementos.inputUnirsePassword) elementos.inputUnirsePassword.value = '';
      mostrarPantalla('unirse');
    });
  }
  
  configurarEventosCrearUnirse();
  configurarEventosMatchmakingYSala();
  configurarEventosConfiguracion();
}


/**
 * Configura eventos para pantallas de crear y unirse a partida
 */
function configurarEventosCrearUnirse() {
  // === Pantalla Crear Partida ===
  
  // Botón volver a privada desde crear
  if (elementos.btnVolverPrivadaCrear) {
    elementos.btnVolverPrivadaCrear.addEventListener('click', () => {
      mostrarPantalla('privada');
    });
  }
  
  // Validación de contraseña en tiempo real
  if (elementos.inputCrearPassword) {
    elementos.inputCrearPassword.addEventListener('input', (e) => {
      const password = e.target.value;
      if (password.length > 0) {
        const resultado = validarPassword(password);
        if (!resultado.valido) {
          mostrarErrorEnElemento(elementos.errorCrearPassword, resultado.error);
        } else {
          limpiarErrorEnElemento(elementos.errorCrearPassword);
        }
      } else {
        limpiarErrorEnElemento(elementos.errorCrearPassword);
      }
    });
  }
  
  // Botón confirmar crear partida
  if (elementos.btnConfirmarCrear) {
    elementos.btnConfirmarCrear.addEventListener('click', () => {
      const password = elementos.inputCrearPassword?.value || '';
      const resultado = validarPassword(password);
      
      if (!resultado.valido) {
        mostrarErrorEnElemento(elementos.errorCrearPassword, resultado.error);
        return;
      }
      
      limpiarErrorEnElemento(elementos.errorCrearPassword);
      limpiarErrorEnElemento(elementos.errorCrear);
      
      if (callbacks.onCrearPartida) {
        callbacks.onCrearPartida(obtenerNombre(), password);
      }
    });
  }
  
  // === Pantalla Unirse a Partida ===
  
  // Botón volver a privada desde unirse
  if (elementos.btnVolverPrivadaUnirse) {
    elementos.btnVolverPrivadaUnirse.addEventListener('click', () => {
      mostrarPantalla('privada');
    });
  }
  
  // Convertir código a mayúsculas automáticamente
  if (elementos.inputUnirseCodigo) {
    elementos.inputUnirseCodigo.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }
  
  // Botón confirmar unirse
  if (elementos.btnConfirmarUnirse) {
    elementos.btnConfirmarUnirse.addEventListener('click', () => {
      const codigo = elementos.inputUnirseCodigo?.value?.trim() || '';
      const password = elementos.inputUnirsePassword?.value || '';
      
      // Validar código
      if (codigo.length !== 6) {
        mostrarErrorEnElemento(elementos.errorUnirse, 'El código debe tener 6 caracteres');
        return;
      }
      
      // Validar contraseña
      const resultadoPassword = validarPassword(password);
      if (!resultadoPassword.valido) {
        mostrarErrorEnElemento(elementos.errorUnirse, resultadoPassword.error);
        return;
      }
      
      limpiarErrorEnElemento(elementos.errorUnirse);
      
      if (callbacks.onUnirsePartida) {
        callbacks.onUnirsePartida(obtenerNombre(), codigo, password);
      }
    });
  }
}

/**
 * Configura eventos para matchmaking y sala de espera
 */
function configurarEventosMatchmakingYSala() {
  // === Pantalla Matchmaking ===
  
  // Botón cancelar matchmaking
  if (elementos.btnCancelarMatchmaking) {
    elementos.btnCancelarMatchmaking.addEventListener('click', () => {
      if (callbacks.onCancelarMatchmaking) {
        callbacks.onCancelarMatchmaking();
      }
      mostrarPantalla('online');
    });
  }
  
  // === Pantalla Sala Esperando ===
  
  // Botón salir de sala
  if (elementos.btnSalirSala) {
    elementos.btnSalirSala.addEventListener('click', () => {
      if (callbacks.onSalirSala) {
        callbacks.onSalirSala();
      }
      mostrarPantalla('privada');
    });
  }
  
  // Botón copiar código
  if (elementos.btnCopiarCodigo) {
    elementos.btnCopiarCodigo.addEventListener('click', () => {
      const codigo = elementos.salaCodigo?.textContent || '';
      if (codigo && codigo !== '------') {
        navigator.clipboard.writeText(codigo).then(() => {
          // Feedback visual con clase CSS
          elementos.btnCopiarCodigo.classList.add('copied');
          const btnOriginal = elementos.btnCopiarCodigo.textContent;
          elementos.btnCopiarCodigo.textContent = '✓';
          setTimeout(() => {
            elementos.btnCopiarCodigo.textContent = btnOriginal;
            elementos.btnCopiarCodigo.classList.remove('copied');
          }, 1500);
        }).catch(() => {
          // Fallback si clipboard no está disponible
          console.warn('No se pudo copiar al portapapeles');
        });
      }
    });
  }
  
  // Botón iniciar partida
  if (elementos.btnIniciarPartida) {
    elementos.btnIniciarPartida.addEventListener('click', () => {
      if (callbacks.onIniciarPartida) {
        callbacks.onIniciarPartida();
      }
    });
  }
}


/**
 * Configura eventos para el panel de configuración
 * Requirements: 7.2, 7.3, 7.4
 */
function configurarEventosConfiguracion() {
  // Botón volver desde configuración
  // Requirements: 7.4 - Volver a la pantalla principal del lobby
  if (elementos.btnVolverConfig) {
    elementos.btnVolverConfig.addEventListener('click', () => {
      mostrarPantalla('inicial');
    });
  }
  
  // Slider de sensibilidad
  // Requirements: 7.2, 7.3 - Mostrar opciones de sensibilidad y guardar cambios
  if (elementos.configSensibilidad) {
    elementos.configSensibilidad.addEventListener('input', (e) => {
      const valor = parseFloat(e.target.value);
      if (elementos.configSensibilidadValor) {
        elementos.configSensibilidadValor.textContent = valor.toFixed(3);
      }
      // Guardar inmediatamente al modificar (Requirement 7.3)
      actualizarConfiguracion('sensibilidad', valor);
    });
  }
  
  // Slider de volumen
  // Requirements: 7.2, 7.3 - Mostrar opciones de volumen y guardar cambios
  if (elementos.configVolumen) {
    elementos.configVolumen.addEventListener('input', (e) => {
      const valor = parseFloat(e.target.value);
      if (elementos.configVolumenValor) {
        elementos.configVolumenValor.textContent = `${Math.round(valor * 100)}%`;
      }
      // Guardar inmediatamente al modificar (Requirement 7.3)
      actualizarConfiguracion('volumen', valor);
    });
  }
  
  // Checkbox de mostrar FPS
  // Requirements: 7.2, 7.3
  if (elementos.configMostrarFPS) {
    elementos.configMostrarFPS.addEventListener('change', (e) => {
      actualizarConfiguracion('mostrarFPS', e.target.checked);
    });
  }
  
  // Checkbox de crosshair dinámico
  // Requirements: 7.2, 7.3
  if (elementos.configCrosshairDinamico) {
    elementos.configCrosshairDinamico.addEventListener('change', (e) => {
      actualizarConfiguracion('crosshairDinamico', e.target.checked);
    });
  }
  
  // Botón guardar configuración
  if (elementos.btnGuardarConfig) {
    elementos.btnGuardarConfig.addEventListener('click', () => {
      guardarConfiguracionDesdeUI();
      mostrarPantalla('inicial');
    });
  }
}

/**
 * Carga los datos iniciales en la UI
 */
function cargarDatosIniciales() {
  // Cargar nombre guardado
  const nombreGuardado = lobbyState.nombreJugador;
  if (nombreGuardado && elementos.inputNombre) {
    elementos.inputNombre.value = nombreGuardado;
  }
  
  // Cargar estadísticas
  actualizarEstadisticasUI();
  
  // Cargar configuración en sliders
  cargarConfiguracionEnUI();
}

/**
 * Actualiza las estadísticas mostradas en la UI
 */
function actualizarEstadisticasUI() {
  const stats = obtenerEstadisticas();
  
  if (elementos.statsKills) {
    elementos.statsKills.textContent = stats.kills;
  }
  if (elementos.statsMuertes) {
    elementos.statsMuertes.textContent = stats.muertes;
  }
  if (elementos.statsKD) {
    elementos.statsKD.textContent = stats.kd;
  }
  // Nuevos elementos de estadísticas
  if (elementos.statsPartidas) {
    elementos.statsPartidas.textContent = stats.partidas || 0;
  }
  if (elementos.statsVictorias) {
    elementos.statsVictorias.textContent = stats.victorias || 0;
  }
}

/**
 * Carga la configuración actual en los elementos de UI
 */
function cargarConfiguracionEnUI() {
  const config = lobbyState.configuracion;
  
  if (elementos.configSensibilidad) {
    elementos.configSensibilidad.value = config.sensibilidad;
    if (elementos.configSensibilidadValor) {
      elementos.configSensibilidadValor.textContent = config.sensibilidad.toFixed(3);
    }
  }
  
  if (elementos.configVolumen) {
    elementos.configVolumen.value = config.volumen;
    if (elementos.configVolumenValor) {
      elementos.configVolumenValor.textContent = `${Math.round(config.volumen * 100)}%`;
    }
  }
  
  if (elementos.configMostrarFPS) {
    elementos.configMostrarFPS.checked = config.mostrarFPS;
  }
  
  if (elementos.configCrosshairDinamico) {
    elementos.configCrosshairDinamico.checked = config.crosshairDinamico;
  }
}

/**
 * Guarda la configuración desde los elementos de UI
 */
function guardarConfiguracionDesdeUI() {
  if (elementos.configSensibilidad) {
    actualizarConfiguracion('sensibilidad', parseFloat(elementos.configSensibilidad.value));
  }
  
  if (elementos.configVolumen) {
    actualizarConfiguracion('volumen', parseFloat(elementos.configVolumen.value));
  }
  
  if (elementos.configMostrarFPS) {
    actualizarConfiguracion('mostrarFPS', elementos.configMostrarFPS.checked);
  }
  
  if (elementos.configCrosshairDinamico) {
    actualizarConfiguracion('crosshairDinamico', elementos.configCrosshairDinamico.checked);
  }
  
  guardarConfiguracion();
}


/**
 * Valida el nombre actual y lo guarda si es válido
 * @returns {boolean} - true si el nombre es válido
 */
function validarYGuardarNombre() {
  let nombre = elementos.inputNombre?.value?.trim() || '';
  
  // Si no hay nombre, generar uno aleatorio
  if (!nombre) {
    nombre = generarNombreAleatorio();
    if (elementos.inputNombre) {
      elementos.inputNombre.value = nombre;
    }
  }
  
  const resultado = validarNombre(nombre);
  if (!resultado.valido) {
    mostrarErrorEnElemento(elementos.errorNombre, resultado.error);
    return false;
  }
  
  establecerNombre(nombre);
  guardarConfiguracion();
  limpiarErrorEnElemento(elementos.errorNombre);
  return true;
}

/**
 * Muestra un mensaje de error en un elemento específico
 * @param {HTMLElement} elemento - Elemento donde mostrar el error
 * @param {string} mensaje - Mensaje de error
 */
function mostrarErrorEnElemento(elemento, mensaje) {
  if (elemento) {
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
  }
}

/**
 * Limpia el error de un elemento específico
 * @param {HTMLElement} elemento - Elemento a limpiar
 */
function limpiarErrorEnElemento(elemento) {
  if (elemento) {
    elemento.textContent = '';
  }
}

// ==================== FUNCIONES PÚBLICAS ====================

/**
 * Muestra una pantalla específica del lobby con transición suave
 * @param {string} pantalla - Nombre de la pantalla ('inicial', 'online', 'privada', 'crear', 'unirse', 'matchmaking', 'esperando', 'config')
 */
export function mostrarPantalla(pantalla) {
  const mapaPantallas = {
    'inicial': elementos.pantallaInicial,
    'online': elementos.pantallaOnline,
    'privada': elementos.pantallaPrivada,
    'crear': elementos.pantallaCrear,
    'unirse': elementos.pantallaUnirse,
    'matchmaking': elementos.pantallaMatchmaking,
    'esperando': elementos.pantallaEsperando,
    'config': elementos.pantallaConfig
  };
  
  const pantallaAnterior = mapaPantallas[pantallaActual];
  const pantallaNueva = mapaPantallas[pantalla];
  
  // Si es la misma pantalla, no hacer nada
  if (pantallaActual === pantalla) return;
  
  // Agregar clase de salida a la pantalla anterior
  // Requirements: 6.1, 6.2 - Transiciones fade/slide con duración 300ms
  if (pantallaAnterior) {
    pantallaAnterior.classList.add('exiting');
    
    // Después de la animación de salida, ocultar y mostrar la nueva
    setTimeout(() => {
      pantallaAnterior.classList.remove('active', 'exiting');
      
      // Mostrar la nueva pantalla
      if (pantallaNueva) {
        pantallaNueva.classList.add('active');
        pantallaActual = pantalla;
      }
    }, 300); // Duración de la animación de salida (Requirements: 6.1, 6.2)
  } else {
    // Si no hay pantalla anterior, mostrar directamente
    if (pantallaNueva) {
      pantallaNueva.classList.add('active');
      pantallaActual = pantalla;
    }
  }
}

/**
 * Actualiza el nombre del jugador mostrado en la UI
 * @param {string} nombre - Nombre del jugador
 */
export function actualizarNombreJugador(nombre) {
  if (elementos.inputNombre) {
    elementos.inputNombre.value = nombre;
  }
  establecerNombre(nombre);
}

/**
 * Muestra un mensaje de error en la pantalla actual
 * @param {string} mensaje - Mensaje de error
 */
export function mostrarError(mensaje) {
  // Determinar qué elemento de error usar según la pantalla actual
  let elementoError = null;
  
  switch (pantallaActual) {
    case 'inicial':
      elementoError = elementos.errorNombre;
      break;
    case 'crear':
      elementoError = elementos.errorCrear;
      break;
    case 'unirse':
      elementoError = elementos.errorUnirse;
      break;
    default:
      // Crear un elemento de error temporal si no hay uno específico
      console.error('Error del lobby:', mensaje);
      return;
  }
  
  mostrarErrorEnElemento(elementoError, mensaje);
}

/**
 * Muestra indicador de carga con mensaje
 * @param {string} mensaje - Mensaje a mostrar
 */
export function mostrarCargando(mensaje) {
  if (elementos.matchmakingEstado) {
    elementos.matchmakingEstado.textContent = mensaje;
  }
  mostrarPantalla('matchmaking');
}

/**
 * Oculta el lobby con transición suave y permite iniciar el juego
 */
export function ocultarLobby() {
  if (elementos.lobbyScreen) {
    elementos.lobbyScreen.classList.add('hidden');
    // Después de la transición, ocultar completamente
    setTimeout(() => {
      elementos.lobbyScreen.classList.add('hidden-immediate');
    }, 400); // Duración de la transición de opacidad
  }
}

/**
 * Muestra el lobby con transición suave
 */
export function mostrarLobby() {
  if (elementos.lobbyScreen) {
    elementos.lobbyScreen.classList.remove('hidden-immediate');
    // Pequeño delay para que el display se aplique antes de la transición
    requestAnimationFrame(() => {
      elementos.lobbyScreen.classList.remove('hidden');
    });
  }
  mostrarPantalla('inicial');
  actualizarEstadisticasUI();
}


/**
 * Actualiza el estado del matchmaking
 * @param {string} estado - Estado a mostrar
 */
export function actualizarEstadoMatchmaking(estado) {
  if (elementos.matchmakingEstado) {
    elementos.matchmakingEstado.textContent = estado;
  }
}

/**
 * Muestra la pantalla de sala creada con el código
 * @param {string} codigo - Código de la sala
 */
export function mostrarSalaCreada(codigo) {
  if (elementos.salaCodigo) {
    elementos.salaCodigo.textContent = codigo;
  }
  if (elementos.salaJugadoresCount) {
    elementos.salaJugadoresCount.textContent = '1';
  }
  if (elementos.salaJugadoresLista) {
    elementos.salaJugadoresLista.innerHTML = '';
    agregarJugadorALista(obtenerNombre(), true);
  }
  mostrarPantalla('esperando');
}

/**
 * Actualiza la lista de jugadores en la sala
 * @param {Array<{nombre: string, esHost: boolean}>} jugadores - Lista de jugadores
 */
export function actualizarListaJugadores(jugadores) {
  if (elementos.salaJugadoresLista) {
    elementos.salaJugadoresLista.innerHTML = '';
    jugadores.forEach(jugador => {
      agregarJugadorALista(jugador.nombre, jugador.esHost);
    });
  }
  if (elementos.salaJugadoresCount) {
    elementos.salaJugadoresCount.textContent = jugadores.length.toString();
  }
}

/**
 * Agrega un jugador a la lista visual
 * @param {string} nombre - Nombre del jugador
 * @param {boolean} esHost - Si es el host de la sala
 */
function agregarJugadorALista(nombre, esHost = false) {
  if (!elementos.salaJugadoresLista) return;
  
  const item = document.createElement('div');
  item.className = `jugador-item${esHost ? ' host' : ''}`;
  item.innerHTML = `
    <span class="jugador-icono">${esHost ? '👑' : '👤'}</span>
    <span>${nombre}</span>
  `;
  elementos.salaJugadoresLista.appendChild(item);
}

/**
 * Muestra error en la pantalla de crear partida
 * @param {string} mensaje - Mensaje de error
 */
export function mostrarErrorCrear(mensaje) {
  mostrarErrorEnElemento(elementos.errorCrear, mensaje);
}

/**
 * Muestra error en la pantalla de unirse a partida
 * @param {string} mensaje - Mensaje de error
 */
export function mostrarErrorUnirse(mensaje) {
  mostrarErrorEnElemento(elementos.errorUnirse, mensaje);
}

/**
 * Limpia todos los errores visibles
 */
export function limpiarErrores() {
  limpiarErrorEnElemento(elementos.errorNombre);
  limpiarErrorEnElemento(elementos.errorCrearPassword);
  limpiarErrorEnElemento(elementos.errorCrear);
  limpiarErrorEnElemento(elementos.errorUnirse);
}

/**
 * Obtiene la pantalla actual
 * @returns {string} - Nombre de la pantalla actual
 */
export function obtenerPantallaActual() {
  return pantallaActual;
}

/**
 * Actualiza las estadísticas en la UI (para llamar después de una partida)
 */
export function refrescarEstadisticas() {
  actualizarEstadisticasUI();
}

/**
 * Obtiene la configuración actual del lobby
 * @returns {Object} - Configuración actual
 */
export function obtenerConfiguracionActual() {
  return { ...lobbyState.configuracion };
}
