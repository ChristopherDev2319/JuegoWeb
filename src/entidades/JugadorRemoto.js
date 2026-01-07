/**
 * Remote Player Module
 * Renders and manages remote players in the multiplayer game
 * 
 * Requirements: 3.1, 3.2, 3.4
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import { AnimadorPersonaje, cargarAnimacion } from '../sistemas/animaciones.js';

// Configuración del modelo del personaje
const CHARACTER_CONFIG = {
  modelPath: 'public/modelos/animaciones/idle_tps.glb', // Modelo con armas integradas
  scale: 7.0,
  rotationOffset: Math.PI,
  heightOffset: 0,
  weaponPosition: {
    x: 0.5,
    y: 1.5,
    z: -0.3
  }
};

// Mapeo de tipos de arma a nombres en el modelo de animación
const WEAPON_MODEL_NAMES = {
  'M4A1': 'weapon_m4a6',
  'AK47': 'weapon_ak',
  'PISTOLA': 'weapon_1911',
  'SNIPER': 'weapon_awp',
  'ESCOPETA': 'weapon_pump',
  'MP5': 'weapon_mp5'
};

// Configuración del cuchillo TPS
// Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3
const KNIFE_TPS_CONFIG = {
  modelPath: 'public/modelos/valorants_knife_low_poly.glb',
  scale: 0.08,  // Escala apropiada para TPS
  // Offset de posición relativo al hueso de la mano
  positionOffset: { x: 0.02, y: 0.01, z: 0.03 },
  // Rotación para que el cuchillo se vea natural en la mano
  rotationOffset: { x: Math.PI * 0.5, y: 0, z: Math.PI * 0.25 },
  // Nombres posibles del hueso de la mano derecha
  handBoneNames: ['hand_r', 'Hand_R', 'RightHand', 'mixamorigRightHand', 'hand.R'],
  // Configuración de animación de ataque
  // Requirements: 3.1, 3.2
  animacionAtaque: {
    ruta: 'public/modelos/animaciones/knife_attack_tps.glb',
    duracion: 0.5,  // Duración aproximada de la animación en segundos
    cooldown: 500   // Cooldown en milisegundos (debe coincidir con CONFIG.armas.KNIFE.cadenciaAtaque)
  }
};

// Configuración del mesh Straw (manos vacías) para animaciones walk, idle, healt
// Este mesh se muestra cuando el arma está oculta (tecla C)
const STRAW_MESH_CONFIG = {
  meshName: 'Straw_lambert1_0',
  // Nombres alternativos por si el mesh tiene otro nombre
  alternativeNames: ['Straw', 'straw', 'STRAW', 'Straw_lambert1']
};

// Configuración del JuiceBox TPS para sistema de curación
// Requirements: 5.1, 6.1, 6.2
const JUICEBOX_TPS_CONFIG = {
  modelPath: 'public/modelos/stylized_juicebox.glb',
  scale: 0.15,  // Escala apropiada para TPS
  // Offset de posición relativo al hueso de la mano
  positionOffset: { x: 0.02, y: 0.01, z: 0.03 },
  // Rotación para que el JuiceBox se vea natural en la mano
  rotationOffset: { x: 0, y: Math.PI * 0.5, z: 0 },
  // Nombres posibles del hueso de la mano derecha (reutiliza los del cuchillo)
  handBoneNames: ['hand_r', 'Hand_R', 'RightHand', 'mixamorigRightHand', 'hand.R'],
  // Configuración de animación de curación
  // Requirements: 5.2
  animacionCuracion: {
    ruta: 'public/modelos/animaciones/healt_tps.glb',
    duracion: 2.0  // Duración de la curación en segundos (debe coincidir con CONFIG.curacion.tiempoCuracion)
  }
};

// Hitbox del servidor - DEBE COINCIDIR con server/bulletSystem.js
const SERVER_HITBOX = {
  width: 1.4,    // Debe coincidir con CHARACTER_HITBOX.width en el servidor
  height: 2.0,   // Debe coincidir con CHARACTER_HITBOX.height en el servidor
  depth: 1.2,    // Debe coincidir con CHARACTER_HITBOX.depth en el servidor
  centerYOffset: -0.7  // Offset desde los ojos al centro del cuerpo
};

const DEBUG_HELPERS = false;

export class RemotePlayer {
  constructor(scene, state) {
    this.scene = scene;
    this.id = state.id;
    
    this.group = new THREE.Group();
    this.serverState = { ...state };
    this.previousState = { ...state };
    this.interpolationAlpha = 1;
    
    this.characterModel = null;
    this.animador = null;
    this.estaMoviendose = false;
    this.estaApuntando = false;
    this.estaDisparando = false;
    this.tiempoDisparo = 0; // Tiempo restante de animación de disparo
    
    // Variables para detectar movimiento REAL
    this.lastWorldPosition = new THREE.Vector3();
    this.worldVelocity = 0;
    this.moveCooldown = 0;
    
    // Requirements: 1.1, 1.2 - Guardar arma del estado inicial, no usar default si el estado tiene arma
    // El arma real se aplicará cuando el modelo esté cargado via aplicarEstadosPendientes()
    this.armaAlCargar = state.currentWeapon || null;
    // Usar el arma del estado si existe, de lo contrario usar default temporalmente
    // Este valor se sincronizará correctamente cuando el modelo cargue
    this.currentWeapon = state.currentWeapon || 'M4A1';
    this.weaponMeshes = {}; // Referencias a los meshes de armas en el modelo
    this.modeloCargado = false;
    this.placeholderCreado = false;
    
    // Sistema de cuchillo TPS
    // Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3
    this.modeloCuchilloTPS = null;  // Modelo del cuchillo para TPS (separado)
    this.meshesCuchilloEnModelo = []; // Meshes del cuchillo dentro del modelo del personaje
    this.meshesCuchillo = [];       // Referencias a los meshes del cuchillo TPS separado
    this.huesoMano = null;          // Referencia al hueso de la mano
    this.cuchilloVisible = false;   // Estado de visibilidad del cuchillo
    
    // Sistema de animación de ataque del cuchillo
    // Requirements: 3.1, 3.2, 3.3
    this.animacionAtaqueCuchilloCargada = false;  // Si la animación está cargada
    this.animacionAtaqueEnProgreso = false;       // Si hay un ataque en progreso
    this.ultimoAtaqueCuchillo = 0;                // Timestamp del último ataque
    
    // Sistema de JuiceBox TPS para curación
    // Requirements: 5.1, 6.1, 6.3
    this.modeloJuiceBoxTPS = null;      // Modelo del JuiceBox para TPS
    this.meshesJuiceBox = [];           // Referencias a los meshes del JuiceBox
    this.meshesJuiceBoxEnModelo = [];   // Meshes del JuiceBox dentro del modelo del personaje
    this.juiceBoxVisible = false;       // Estado de visibilidad del JuiceBox
    this.curacionEnProgreso = false;    // Si hay una curación en progreso
    this.animacionCuracionCargada = false; // Si la animación healt está cargada
    this.armaPreviaACuracion = null;    // Arma que tenía antes de equipar el JuiceBox
    
    // Sistema de arma oculta (tecla C) - Mesh Straw para manos vacías
    // Cuando el arma está oculta, se muestra el mesh Straw_lambert1_0
    this.meshStraw = null;              // Referencia al mesh Straw_lambert1_0
    this.armaOculta = false;            // Estado de visibilidad del arma (true = arma oculta, Straw visible)
    this.armaAntesDeOcultar = null;     // Arma que tenía antes de ocultar
    
    // Sistema de estados pendientes para sincronización
    // Requirements: 1.3, 5.3 - Encolar estados cuando el modelo no está cargado
    this.estadoPendiente = {
      currentWeapon: null,
      isHealing: false,
      isAiming: false,
      weaponHidden: false  // Estado de arma oculta (tecla C)
    };
    this.tieneEstadosPendientes = false;
    
    this.loadCharacterModel();
    
    this.group.position.set(
      state.position.x,
      state.position.y - CONFIG.jugador.alturaOjos + CHARACTER_CONFIG.heightOffset,
      state.position.z
    );
    this.group.rotation.y = state.rotation.y;
    
    // Inicializar posición de referencia
    this.lastWorldPosition.copy(this.group.position);
    
    this.scene.add(this.group);
  }

  createHitbox() {
    const { width, height, depth, centerYOffset } = SERVER_HITBOX;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      wireframe: true,
      visible: DEBUG_HELPERS
    });
    
    this.hitbox = new THREE.Mesh(geometry, material);
    this.hitbox.position.y = CONFIG.jugador.alturaOjos + centerYOffset;
    this.group.add(this.hitbox);
    
    if (DEBUG_HELPERS) {
      this.axesHelper = new THREE.AxesHelper(2);
      this.group.add(this.axesHelper);
    }
  }

  loadCharacterModel(intentos = 0) {
    const maxIntentos = 3;
    const gltfLoader = new THREE.GLTFLoader();
    
    // Crear un placeholder invisible mientras carga (no el cubo azul)
    if (!this.placeholderCreado) {
      this.crearPlaceholderInvisible();
      this.placeholderCreado = true;
    }
    
    gltfLoader.load(CHARACTER_CONFIG.modelPath, async (gltf) => {
      // Remover placeholder si existe
      this.removerPlaceholder();
      
      this.characterModel = gltf.scene;
      this.characterModel.scale.setScalar(CHARACTER_CONFIG.scale);
      this.characterModel.position.y = 0;
      this.characterModel.rotation.y = CHARACTER_CONFIG.rotationOffset;
      
      // Guardar animaciones del modelo si las tiene
      this.animacionesDelModelo = gltf.animations || [];
      
      this.characterModel.traverse((child) => {
        // IMPORTANTE: Desactivar frustum culling para evitar que el modelo
        // desaparezca cuando la cámara mira hacia arriba
        child.frustumCulled = false;
        
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
          child.frustumCulled = false;
        }
        
        // Buscar y guardar referencias a las armas del modelo
        const weaponNames = Object.values(WEAPON_MODEL_NAMES);
        if (weaponNames.includes(child.name)) {
          this.weaponMeshes[child.name] = child;
          child.visible = false; // Ocultar todas inicialmente
        }
        
        // Buscar y ocultar el cuchillo que está dentro del modelo del personaje
        // El cuchillo puede tener nombres como "knife", "Cube.001_knife_0", etc.
        const nombreLower = child.name.toLowerCase();
        if (
          nombreLower.includes('knife') ||
          nombreLower.includes('cuchillo') ||
          child.name.includes('knife')
        ) {
          console.log(`🔪 Encontrado mesh de cuchillo en modelo: ${child.name}`);
          this.meshesCuchilloEnModelo.push(child);
          child.visible = false; // Ocultar inicialmente
        }
        
        // Buscar el JuiceBox que está dentro del modelo del personaje
        // Solo ocultarlo inicialmente, se mostrará cuando esté equipado
        // NOTA: El mesh Straw_lambert1_0 NO es parte del JuiceBox, es el mesh de manos vacías
        const esJuiceBox = (
          nombreLower.includes('juice') ||
          nombreLower.includes('juicebox') ||
          nombreLower.includes('juice_box') ||
          nombreLower.includes('bebida') ||
          nombreLower.includes('drink') ||
          (nombreLower.includes('stylized') && nombreLower.includes('box')) ||
          (nombreLower === 'box' || nombreLower.startsWith('box_') || nombreLower.endsWith('_box'))
        ) && !nombreLower.includes('hitbox') && !nombreLower.includes('straw');
        
        if (esJuiceBox) {
          console.log(`🧃 Encontrado mesh de JuiceBox en modelo: ${child.name}`);
          this.meshesJuiceBoxEnModelo.push(child);
          child.visible = false; // Ocultar inicialmente
        }
        
        // Buscar el mesh Straw_lambert1_0 (manos vacías para animaciones walk, idle, healt)
        // Este mesh se muestra SOLO cuando el JuiceBox está equipado
        // Debe estar OCULTO cuando hay arma o cuchillo equipado
        const esStraw =
          child.name === 'Straw_lambert1_0' ||
          child.name === STRAW_MESH_CONFIG.meshName ||
          STRAW_MESH_CONFIG.alternativeNames.some(
            (name) => child.name === name || child.name.startsWith(name + '_')
          ) ||
          (nombreLower.includes('straw') && nombreLower.includes('lambert'));

        if (esStraw) {
          console.log(`🖐️ Encontrado mesh Straw en modelo: ${child.name}`);
          this.meshStraw = child;
          // IMPORTANTE: Ocultar inicialmente - solo visible con JuiceBox
          child.visible = false;
        }
      });

      this.group.add(this.characterModel);
      this.modeloCargado = true;
      await this.inicializarAnimaciones();

      // Cargar modelo del cuchillo TPS y parentarlo al hueso de la mano
      // Requirements: 1.1, 1.4
      await this.cargarCuchilloTPS();

      // Cargar modelo del JuiceBox TPS y parentarlo al hueso de la mano
      // Requirements: 5.1, 6.1, 6.3
      await this.cargarJuiceBoxTPS();

      // Aplicar estados pendientes (incluye el arma del estado inicial)
      // Requirements: 1.1, 1.2, 1.3 - Sincronizar arma con estado del servidor
      this.aplicarEstadosPendientes();

      // IMPORTANTE: Forzar sincronización del mesh Straw después de cargar
      // El mesh Straw debe estar OCULTO a menos que el JuiceBox esté equipado
      this.sincronizarVisibilidadStraw();

      console.log(`Character model loaded for player ${this.id} - meshStraw encontrado: ${!!this.meshStraw}`);
    }, undefined, (error) => {
      console.error(`Error loading character model for player ${this.id} (intento ${intentos + 1}/${maxIntentos}):`, error);

      // Reintentar si no hemos alcanzado el máximo de intentos
      if (intentos < maxIntentos - 1) {
        console.log(`Reintentando carga del modelo para jugador ${this.id}...`);
        setTimeout(() => {
          this.loadCharacterModel(intentos + 1);
        }, 500 * (intentos + 1)); // Espera incremental
      } else {
        // Solo mostrar fallback después de agotar todos los intentos
        console.error(`No se pudo cargar el modelo después de ${maxIntentos} intentos para jugador ${this.id}`);
        this.removerPlaceholder();
        this.createFallbackMesh();
      }
    });
  }
  
  /**
   * Crea un placeholder invisible mientras se carga el modelo
   * Esto evita que aparezca el cubo azul durante la carga
   */
  crearPlaceholderInvisible() {
    // No crear nada visible, el jugador simplemente no se ve hasta que cargue
    this.placeholderMesh = null;
  }
  
  /**
   * Remueve el placeholder si existe
   */
  removerPlaceholder() {
    if (this.placeholderMesh) {
      this.group.remove(this.placeholderMesh);
      this.placeholderMesh.geometry?.dispose();
      this.placeholderMesh.material?.dispose();
      this.placeholderMesh = null;
    }
  }

  /**
   * Actualiza qué arma es visible en el modelo
   * @param {string} weaponType - Tipo de arma (M4A1, AK47, KNIFE, JUICEBOX, etc.)
   */
  actualizarArmaVisible(weaponType) {
    console.log(`🔫 [${this.id}] actualizarArmaVisible(${weaponType}) - armaOculta: ${this.armaOculta}`);

    // Si el arma está oculta (estado weaponHidden del servidor), mostrar mesh Straw
    if (this.armaOculta) {
      // Ocultar todas las armas
      Object.values(this.weaponMeshes).forEach((mesh) => {
        mesh.visible = false;
      });
      this.actualizarVisibilidadCuchillo(false);
      this.ocultarJuiceBox();
      // Mostrar mesh Straw (manos vacías)
      if (this.meshStraw) {
        this.meshStraw.visible = true;
      }
      return;
    }

    // Si el arma es JUICEBOX, mostrar el mesh Straw (manos con JuiceBox)
    // El JuiceBox usa el mesh Straw para las animaciones walk, idle, healt
    if (weaponType === 'JUICEBOX') {
      // Guardar el arma previa si no está guardada
      if (!this.armaPreviaACuracion && this.currentWeapon !== 'JUICEBOX') {
        this.armaPreviaACuracion = this.currentWeapon;
      }

      // Ocultar todas las armas del modelo
      Object.values(this.weaponMeshes).forEach((mesh) => {
        mesh.visible = false;
      });

      // Ocultar el cuchillo
      this.actualizarVisibilidadCuchillo(false);

      // Mostrar mesh Straw cuando tiene JuiceBox equipado
      // El mesh Straw es el que tiene las animaciones de curación (healt)
      if (this.meshStraw) {
        this.meshStraw.visible = true;
      }

      // Mostrar el JuiceBox (modelo en la mano)
      this.mostrarJuiceBox();
      return;
    }

    // Si no es JUICEBOX, ocultar el JuiceBox y mostrar el arma correspondiente
    this.ocultarJuiceBox();

    // Ocultar mesh Straw cuando hay arma visible
    if (this.meshStraw) {
      this.meshStraw.visible = false;
    }

    const nombreArma = WEAPON_MODEL_NAMES[weaponType];

    // Ocultar todas las armas
    Object.values(this.weaponMeshes).forEach((mesh) => {
      mesh.visible = false;
    });

    // Mostrar solo el arma seleccionada
    if (nombreArma && this.weaponMeshes[nombreArma]) {
      this.weaponMeshes[nombreArma].visible = true;
    }

    // Actualizar visibilidad del cuchillo TPS
    // Requirements: 1.2, 1.3
    const esCuchillo = weaponType === 'KNIFE';
    this.actualizarVisibilidadCuchillo(esCuchillo);

    // Limpiar arma previa guardada
    this.armaPreviaACuracion = null;
  }
  
  /**
   * Muestra el JuiceBox (modelo TPS y meshes en el modelo del personaje)
   */
  mostrarJuiceBox() {
    if (this.modeloJuiceBoxTPS) {
      this.modeloJuiceBoxTPS.visible = true;
      this.modeloJuiceBoxTPS.traverse((child) => {
        child.visible = true;
      });
    }
    if (this.meshesJuiceBox) {
      this.meshesJuiceBox.forEach((mesh) => {
        mesh.visible = true;
      });
    }
    // También mostrar los meshes del JuiceBox que están en el modelo del personaje
    if (this.meshesJuiceBoxEnModelo) {
      this.meshesJuiceBoxEnModelo.forEach((mesh) => {
        mesh.visible = true;
      });
    }
    this.juiceBoxVisible = true;
    console.log(`🧃 [${this.id}] JuiceBox mostrado`);
  }
  
  /**
   * Oculta el JuiceBox sin restaurar armas (método auxiliar)
   */
  ocultarJuiceBox() {
    if (this.modeloJuiceBoxTPS) {
      this.modeloJuiceBoxTPS.visible = false;
      this.modeloJuiceBoxTPS.traverse((child) => {
        child.visible = false;
      });
    }
    if (this.meshesJuiceBox) {
      this.meshesJuiceBox.forEach((mesh) => {
        mesh.visible = false;
      });
    }
    // También ocultar los meshes del JuiceBox que están en el modelo del personaje
    if (this.meshesJuiceBoxEnModelo) {
      this.meshesJuiceBoxEnModelo.forEach((mesh) => {
        mesh.visible = false;
      });
    }
    this.juiceBoxVisible = false;
  }

  /**
   * Alterna el estado de arma oculta (tecla C en jugador remoto)
   * Cuando el arma está oculta, se muestra el mesh Straw_lambert1_0 (manos vacías)
   * @param {boolean} ocultar - true para ocultar arma y mostrar Straw, false para mostrar arma
   */
  alternarArmaOculta(ocultar) {
    console.log(`🖐️ [${this.id}] alternarArmaOculta(${ocultar}) - armaOculta actual: ${this.armaOculta}`);
    
    if (ocultar === this.armaOculta) {
      return; // No hay cambio
    }
    
    this.armaOculta = ocultar;
    
    if (ocultar) {
      // Ocultar arma y mostrar mesh Straw (manos vacías)
      this.armaAntesDeOcultar = this.currentWeapon;
      
      // Ocultar todas las armas
      Object.values(this.weaponMeshes).forEach(mesh => {
        mesh.visible = false;
      });
      
      // Ocultar cuchillo
      this.actualizarVisibilidadCuchillo(false);
      
      // Ocultar JuiceBox
      this.ocultarJuiceBox();
      
      // Mostrar mesh Straw (manos vacías)
      if (this.meshStraw) {
        this.meshStraw.visible = true;
        console.log(`🖐️ [${this.id}] Mesh Straw visible - arma oculta`);
      } else {
        console.warn(`⚠️ [${this.id}] No se encontró mesh Straw para mostrar`);
      }
    } else {
      // Mostrar arma y ocultar mesh Straw
      
      // Ocultar mesh Straw
      if (this.meshStraw) {
        this.meshStraw.visible = false;
      }
      
      // Restaurar arma visible
      const armaAMostrar = this.armaAntesDeOcultar || this.currentWeapon;
      this.actualizarArmaVisible(armaAMostrar);

      console.log(`🔫 [${this.id}] Arma restaurada: ${armaAMostrar}`);
      this.armaAntesDeOcultar = null;
    }
  }

  /**
   * Sincroniza la visibilidad del mesh Straw según el arma equipada
   * El mesh Straw debe estar VISIBLE solo cuando el JuiceBox está equipado
   * En cualquier otro caso (arma o cuchillo), debe estar OCULTO
   */
  sincronizarVisibilidadStraw() {
    if (!this.meshStraw) {
      console.log(`⚠️ [${this.id}] No hay mesh Straw para sincronizar`);
      return;
    }

    // El mesh Straw solo debe ser visible cuando:
    // 1. El JuiceBox está equipado (currentWeapon === 'JUICEBOX')
    // 2. O cuando armaOculta es true
    const debeSerVisible =
      this.currentWeapon === 'JUICEBOX' || this.armaOculta;

    this.meshStraw.visible = debeSerVisible;
    console.log(
      `🖐️ [${this.id}] sincronizarVisibilidadStraw - currentWeapon: ${this.currentWeapon}, armaOculta: ${this.armaOculta}, visible: ${debeSerVisible}`
    );
  }

  /**
   * Carga el modelo del cuchillo para TPS y lo parenta al hueso de la mano
   * Requirements: 1.1, 1.4
   * @returns {Promise<void>}
   */
  async cargarCuchilloTPS() {
    if (!this.characterModel) {
      console.warn(`⚠️ No hay modelo de personaje para cargar cuchillo TPS (jugador ${this.id})`);
      return;
    }

    // Buscar el hueso de la mano en el skeleton
    this.huesoMano = this.buscarHuesoMano();
    
    if (!this.huesoMano) {
      console.warn(`⚠️ No se encontró hueso de mano para jugador ${this.id}`);
      return;
    }

    return new Promise((resolve) => {
      const gltfLoader = new THREE.GLTFLoader();
      
      gltfLoader.load(
        KNIFE_TPS_CONFIG.modelPath,
        (gltf) => {
          this.modeloCuchilloTPS = gltf.scene;
          
          // Guardar referencias a todos los meshes del cuchillo para control de visibilidad
          this.meshesCuchillo = [];
          
          // Aplicar escala apropiada para TPS
          this.modeloCuchilloTPS.scale.setScalar(KNIFE_TPS_CONFIG.scale);
          
          // Aplicar offset de posición
          const pos = KNIFE_TPS_CONFIG.positionOffset;
          this.modeloCuchilloTPS.position.set(pos.x, pos.y, pos.z);
          
          // Aplicar offset de rotación
          const rot = KNIFE_TPS_CONFIG.rotationOffset;
          this.modeloCuchilloTPS.rotation.set(rot.x, rot.y, rot.z);
          
          // Configurar materiales sin sombras y guardar referencias a meshes
          this.modeloCuchilloTPS.traverse((child) => {
            // Ocultar TODOS los objetos del cuchillo inicialmente
            child.visible = false;
            // Desactivar frustum culling
            child.frustumCulled = false;
            
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = false;
              child.frustumCulled = false;
              this.meshesCuchillo.push(child);
              console.log(`🔪 Mesh del cuchillo encontrado: ${child.name}`);
            }
          });
          
          // Ocultar el objeto raíz también
          this.modeloCuchilloTPS.visible = false;
          
          // Parentar al hueso de la mano
          // Requirements: 1.4 - El cuchillo sigue la posición y rotación del hueso
          this.huesoMano.add(this.modeloCuchilloTPS);
          
          this.cuchilloVisible = false;
          
          console.log(`🔪 Cuchillo TPS cargado para jugador ${this.id} - ${this.meshesCuchillo.length} meshes`);
          resolve();
        },
        undefined,
        (error) => {
          console.error(`❌ Error cargando cuchillo TPS para jugador ${this.id}:`, error);
          resolve(); // No rechazar, permitir que el juego continúe
        }
      );
    });
  }

  /**
   * Busca el hueso de la mano derecha en el skeleton del modelo
   * Requirements: 1.1
   * @returns {THREE.Bone|null} - El hueso de la mano o null si no se encuentra
   */
  buscarHuesoMano() {
    if (!this.characterModel) return null;
    
    let huesoEncontrado = null;
    
    this.characterModel.traverse((child) => {
      if (huesoEncontrado) return; // Ya encontramos uno
      
      if (child.isBone) {
        // Buscar por nombres conocidos del hueso de la mano
        const nombreLower = child.name.toLowerCase();
        for (const nombreBuscar of KNIFE_TPS_CONFIG.handBoneNames) {
          if (nombreLower === nombreBuscar.toLowerCase() || 
              nombreLower.includes('hand') && nombreLower.includes('r')) {
            huesoEncontrado = child;
            console.log(`🦴 Hueso de mano encontrado: ${child.name} para jugador ${this.id}`);
            return;
          }
        }
      }
    });
    
    return huesoEncontrado;
  }

  /**
   * Carga el modelo del JuiceBox para TPS y lo parenta al hueso de la mano
   * Requirements: 5.1, 6.1, 6.3
   * @returns {Promise<void>}
   */
  async cargarJuiceBoxTPS() {
    if (!this.characterModel) {
      console.warn(`⚠️ No hay modelo de personaje para cargar JuiceBox TPS (jugador ${this.id})`);
      return;
    }

    // Reutilizar el hueso de la mano ya encontrado para el cuchillo
    if (!this.huesoMano) {
      this.huesoMano = this.buscarHuesoMano();
    }
    
    if (!this.huesoMano) {
      console.warn(`⚠️ No se encontró hueso de mano para JuiceBox TPS (jugador ${this.id})`);
      return;
    }

    return new Promise((resolve) => {
      const gltfLoader = new THREE.GLTFLoader();
      
      gltfLoader.load(
        JUICEBOX_TPS_CONFIG.modelPath,
        (gltf) => {
          this.modeloJuiceBoxTPS = gltf.scene;
          
          // Guardar referencias a todos los meshes del JuiceBox para control de visibilidad
          this.meshesJuiceBox = [];
          
          // Aplicar escala apropiada para TPS
          this.modeloJuiceBoxTPS.scale.setScalar(JUICEBOX_TPS_CONFIG.scale);
          
          // Aplicar offset de posición
          const pos = JUICEBOX_TPS_CONFIG.positionOffset;
          this.modeloJuiceBoxTPS.position.set(pos.x, pos.y, pos.z);
          
          // Aplicar offset de rotación
          const rot = JUICEBOX_TPS_CONFIG.rotationOffset;
          this.modeloJuiceBoxTPS.rotation.set(rot.x, rot.y, rot.z);
          
          // Configurar materiales sin sombras y guardar referencias a meshes
          this.modeloJuiceBoxTPS.traverse((child) => {
            // Ocultar TODOS los objetos del JuiceBox inicialmente
            child.visible = false;
            // Desactivar frustum culling
            child.frustumCulled = false;
            
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = false;
              child.frustumCulled = false;
              this.meshesJuiceBox.push(child);
              console.log(`🧃 Mesh del JuiceBox encontrado: ${child.name}`);
            }
          });
          
          // Ocultar el objeto raíz también
          this.modeloJuiceBoxTPS.visible = false;
          
          // Parentar al hueso de la mano
          // Requirements: 6.1 - El JuiceBox sigue la posición y rotación del hueso
          this.huesoMano.add(this.modeloJuiceBoxTPS);
          
          this.juiceBoxVisible = false;
          
          console.log(`🧃 JuiceBox TPS cargado para jugador ${this.id} - ${this.meshesJuiceBox.length} meshes`);
          resolve();
        },
        undefined,
        (error) => {
          console.error(`❌ Error cargando JuiceBox TPS para jugador ${this.id}:`, error);
          resolve(); // No rechazar, permitir que el juego continúe
        }
      );
    });
  }

  /**
   * Actualiza la visibilidad del cuchillo TPS según el arma equipada
   * Requirements: 1.2, 1.3
   * @param {boolean} visible - true para mostrar, false para ocultar
   */
  actualizarVisibilidadCuchillo(visible) {
    console.log(
      `🔪 [${this.id}] actualizarVisibilidadCuchillo(${visible}) - meshesEnModelo: ${this.meshesCuchilloEnModelo.length}, modeloTPS: ${!!this.modeloCuchilloTPS}`
    );

    // Manejar TODOS los meshes del cuchillo que están dentro del modelo del personaje
    if (this.meshesCuchilloEnModelo && this.meshesCuchilloEnModelo.length > 0) {
      this.meshesCuchilloEnModelo.forEach((mesh) => {
        mesh.visible = visible;
        console.log(`🔪 [${this.id}] ${mesh.name}.visible = ${visible}`);
      });
    }

    // Manejar el modelo de cuchillo TPS separado (si existe)
    if (this.modeloCuchilloTPS) {
      // Ocultar/mostrar el objeto padre
      this.modeloCuchilloTPS.visible = visible;

      // Ocultar/mostrar todos los hijos recursivamente
      this.modeloCuchilloTPS.traverse((child) => {
        child.visible = visible;
      });

      // También actualizar los meshes guardados explícitamente
      if (this.meshesCuchillo) {
        this.meshesCuchillo.forEach((mesh) => {
          mesh.visible = visible;
        });
      }
    }

    this.cuchilloVisible = visible;
  }

  /**
   * Actualiza la visibilidad del JuiceBox TPS según el estado de curación
   * Requirements: 3.1, 3.2, 5.1, 5.4
   * @param {boolean} visible - true para mostrar, false para ocultar
   */
  actualizarVisibilidadJuiceBox(visible) {
    console.log(
      `🧃 [${this.id}] actualizarVisibilidadJuiceBox(${visible}) - modeloTPS: ${!!this.modeloJuiceBoxTPS}, currentWeapon: ${this.currentWeapon}`
    );

    if (visible) {
      // Guardar el arma actual antes de mostrar el JuiceBox
      // Esto permite restaurarla cuando se desequipe el JuiceBox
      if (!this.armaPreviaACuracion) {
        this.armaPreviaACuracion = this.currentWeapon;
        console.log(`🧃 [${this.id}] Guardando arma previa: ${this.armaPreviaACuracion}`);
      }
      
      // Requirements: 3.1, 3.2 - Cuando el JuiceBox es visible, ocultar TODAS las armas y cuchillo
      
      // Ocultar todas las armas del modelo
      Object.values(this.weaponMeshes).forEach(mesh => {
        mesh.visible = false;
      });
      
      // Ocultar el cuchillo TPS (modelo separado y meshes en el modelo)
      this.actualizarVisibilidadCuchillo(false);
      
      // Ocultar también los meshes del cuchillo que están dentro del modelo del personaje
      // Requirements: 3.2 - Asegurar que el cuchillo también se oculte
      if (this.meshesCuchilloEnModelo && this.meshesCuchilloEnModelo.length > 0) {
        this.meshesCuchilloEnModelo.forEach((mesh) => {
          mesh.visible = false;
        });
      }
      
      // Mostrar el JuiceBox (modelo TPS separado)
      if (this.modeloJuiceBoxTPS) {
        this.modeloJuiceBoxTPS.visible = true;
        this.modeloJuiceBoxTPS.traverse((child) => {
          child.visible = true;
        });
      }
      if (this.meshesJuiceBox) {
        this.meshesJuiceBox.forEach((mesh) => {
          mesh.visible = true;
        });
      }
      
      // Mostrar también los meshes del JuiceBox que están en el modelo del personaje
      if (this.meshesJuiceBoxEnModelo && this.meshesJuiceBoxEnModelo.length > 0) {
        this.meshesJuiceBoxEnModelo.forEach((mesh) => {
          mesh.visible = true;
        });
      }
      
      this.juiceBoxVisible = true;
    } else {
      // Solo ocultar el JuiceBox, la restauración del arma se hace en finalizarCuracion
      this.ocultarJuiceBox();
    }
  }

  /**
   * Reproduce la animación de ataque del cuchillo en TPS
   * Requirements: 3.1, 3.2, 3.3
   * @returns {boolean} - true si se inició la animación, false si no se pudo
   */
  reproducirAnimacionAtaqueTPS() {
    console.log(`🔪 [JugadorRemoto ${this.id}] reproducirAnimacionAtaqueTPS - animacionEnProgreso: ${this.animacionAtaqueEnProgreso}, animacionCargada: ${this.animacionAtaqueCuchilloCargada}, animador: ${!!this.animador}`);
    
    // Requirements: 3.2 - Bloquear ataques durante animación
    if (this.animacionAtaqueEnProgreso) {
      console.log(`🔪 [JugadorRemoto ${this.id}] Animación ya en progreso, ignorando`);
      return false;
    }
    
    // Verificar cooldown
    const ahora = Date.now();
    const cooldown = KNIFE_TPS_CONFIG.animacionAtaque.cooldown;
    if (ahora - this.ultimoAtaqueCuchillo < cooldown) {
      console.log(`🔪 [JugadorRemoto ${this.id}] En cooldown, ignorando`);
      return false;
    }
    
    // Requirements: 3.1 - Reproducir animación si está cargada
    if (this.animacionAtaqueCuchilloCargada && this.animador) {
      this.animacionAtaqueEnProgreso = true;
      this.ultimoAtaqueCuchillo = ahora;
      
      // Reproducir animación de ataque (no loop)
      this.animador.reproducir('knife_attack', { transicion: 0.1, loop: false });
      
      // Programar fin de la animación
      const duracion = KNIFE_TPS_CONFIG.animacionAtaque.duracion * 1000;
      setTimeout(() => {
        this.animacionAtaqueEnProgreso = false;
        // Volver a idle si el cuchillo sigue equipado
        if (this.cuchilloVisible && this.animador) {
          this.animador.reproducir('idle', { transicion: 0.2, loop: true });
        }
      }, duracion);
      
      console.log(`🔪 Animación de ataque TPS para jugador ${this.id}`);
      return true;
    }
    
    // Requirements: 3.3 - Fallback si la animación no está cargada
    if (!this.animacionAtaqueCuchilloCargada) {
      this.animacionAtaqueEnProgreso = true;
      this.ultimoAtaqueCuchillo = ahora;
      
      // Animación procedural de fallback: mover el cuchillo hacia adelante
      this.reproducirAnimacionAtaqueFallback();
      
      console.log(`🔪 Animación de ataque fallback para jugador ${this.id}`);
      return true;
    }
    
    return false;
  }

  /**
   * Animación procedural de fallback cuando knife_attack_tps.glb no está disponible
   * Requirements: 3.3
   */
  reproducirAnimacionAtaqueFallback() {
    if (!this.modeloCuchilloTPS) {
      this.animacionAtaqueEnProgreso = false;
      return;
    }
    
    // Guardar posición original
    const posOriginal = {
      x: this.modeloCuchilloTPS.position.x,
      y: this.modeloCuchilloTPS.position.y,
      z: this.modeloCuchilloTPS.position.z
    };
    const rotOriginal = {
      x: this.modeloCuchilloTPS.rotation.x,
      y: this.modeloCuchilloTPS.rotation.y,
      z: this.modeloCuchilloTPS.rotation.z
    };
    
    // Fase 1: Mover hacia adelante (ataque)
    const duracionAtaque = 150; // ms
    const duracionRetorno = 200; // ms
    
    // Animación de ataque
    this.modeloCuchilloTPS.position.z += 0.1;
    this.modeloCuchilloTPS.rotation.x += 0.5;
    
    // Retornar a posición original
    setTimeout(() => {
      if (this.modeloCuchilloTPS) {
        this.modeloCuchilloTPS.position.set(posOriginal.x, posOriginal.y, posOriginal.z);
        this.modeloCuchilloTPS.rotation.set(rotOriginal.x, rotOriginal.y, rotOriginal.z);
      }
      this.animacionAtaqueEnProgreso = false;
    }, duracionAtaque + duracionRetorno);
  }

  /**
   * Procesa un evento de ataque con cuchillo recibido del servidor
   * Requirements: 3.1, 3.2
   */
  procesarAtaqueCuchillo() {
    console.log(`🔪 [JugadorRemoto ${this.id}] procesarAtaqueCuchillo llamado - currentWeapon: ${this.currentWeapon}, cuchilloVisible: ${this.cuchilloVisible}`);
    
    // Si recibimos un evento de ataque melee, el jugador tiene el cuchillo equipado
    // Forzar la visibilidad del cuchillo si no está sincronizado
    if (this.currentWeapon !== 'KNIFE' && !this.cuchilloVisible) {
      console.log(`🔪 [JugadorRemoto ${this.id}] Sincronizando estado del cuchillo para animación`);
      // Temporalmente mostrar el cuchillo para la animación
      this.actualizarVisibilidadCuchillo(true);
    }
    
    // Reproducir la animación de ataque
    const resultado = this.reproducirAnimacionAtaqueTPS();
    
    if (resultado) {
      console.log(`🔪 [JugadorRemoto ${this.id}] Animación de ataque TPS iniciada`);
    } else {
      console.warn(`⚠️ [JugadorRemoto ${this.id}] No se pudo iniciar animación de ataque TPS`);
    }
    
    return resultado;
  }

  /**
   * Procesa un evento de curación recibido del servidor
   * Requirements: 5.1, 5.2, 5.3
   * @param {boolean} iniciando - true si inicia curación, false si termina/cancela
   */
  procesarCuracion(iniciando) {
    console.log(`🧃 [JugadorRemoto ${this.id}] procesarCuracion(${iniciando}) - curacionEnProgreso: ${this.curacionEnProgreso}, modeloCargado: ${this.modeloCargado}`);
    
    // Requirements: 5.3 - Si el modelo no está cargado, encolar el estado de curación
    if (!this.modeloCargado) {
      console.log(`🧃 [JugadorRemoto ${this.id}] Modelo no cargado, encolando estado de curación: ${iniciando}`);
      this.estadoPendiente.isHealing = iniciando;
      this.tieneEstadosPendientes = true;
      return;
    }
    
    if (iniciando) {
      // Iniciar curación
      this.curacionEnProgreso = true;
      
      // Mostrar JuiceBox y ocultar armas/cuchillo
      // Requirements: 5.1
      this.actualizarVisibilidadJuiceBox(true);
      
      // Reproducir animación healt o fallback
      // Requirements: 4.2, 5.2
      this.reproducirAnimacionCuracion();
    } else {
      // Cancelar/terminar curación
      this.finalizarCuracion();
    }
  }

  /**
   * Reproduce la animación de curación con fallback a idle si no está disponible
   * Requirements: 4.1, 4.2
   */
  reproducirAnimacionCuracion() {
    const duracion = JUICEBOX_TPS_CONFIG.animacionCuracion.duracion * 1000;
    
    if (this.animacionCuracionCargada && this.animador) {
      // Requirements: 4.1 - Reproducir animación healt
      this.animador.reproducir('healt', { transicion: 0.2, loop: false });
      console.log(`🧃 [JugadorRemoto ${this.id}] Animación healt iniciada`);
    } else if (this.animador) {
      // Requirements: 4.2 - Fallback: usar idle sin errores, mantener flujo de curación
      console.log(`🧃 [JugadorRemoto ${this.id}] Usando animación idle como fallback para curación`);
      this.animador.reproducir('idle', { transicion: 0.2, loop: true });
    } else {
      // Sin animador disponible, solo continuar con el flujo visual
      console.log(`🧃 [JugadorRemoto ${this.id}] Sin animador, continuando curación solo con JuiceBox visible`);
    }
    
    // Programar fin de la curación después de la duración configurada
    // El flujo continúa independientemente de si hay animación o no
    setTimeout(() => {
      this.finalizarCuracion();
    }, duracion);
  }

  /**
   * Finaliza la curación y restaura el estado visual
   * Requirements: 3.3, 4.3, 5.3
   */
  finalizarCuracion() {
    if (!this.curacionEnProgreso) return;
    
    console.log(`🧃 [JugadorRemoto ${this.id}] Finalizando curación - currentWeapon: ${this.currentWeapon}`);
    
    // Ahora marcar que la curación terminó
    this.curacionEnProgreso = false;
    
    // Si el JuiceBox sigue equipado (currentWeapon === 'JUICEBOX'), mantenerlo visible
    // De lo contrario, ocultar el JuiceBox y mostrar el arma actual
    if (this.currentWeapon === 'JUICEBOX') {
      // Mantener el JuiceBox visible
      console.log(`🧃 [JugadorRemoto ${this.id}] JuiceBox sigue equipado, manteniéndolo visible`);
    } else {
      // Ocultar el JuiceBox y mostrar el arma actual
      this.forzarOcultarJuiceBox();
      this.actualizarArmaVisible(this.currentWeapon);
      console.log(`🔫 [JugadorRemoto ${this.id}] Arma restaurada: ${this.currentWeapon}`);
    }
    
    // Requirements: 4.3 - Restaurar animación idle o walk según el estado de movimiento
    // Verificar estaMoviendose (actualizado en interpolate) para elegir la animación correcta
    // Usar transición suave de 0.2 segundos para evitar cambios bruscos
    if (this.animador) {
      const animacion = this.estaMoviendose ? 'walk' : 'idle';
      this.animador.reproducir(animacion, { transicion: 0.2, loop: true });
      console.log(`🎬 [JugadorRemoto ${this.id}] Transición suave a animación: ${animacion} (movimiento: ${this.estaMoviendose})`);
    }
  }

  /**
   * Aplica los estados pendientes después de que el modelo esté cargado
   * Requirements: 1.3, 5.3 - Sincronizar estado cuando el modelo está listo
   */
  aplicarEstadosPendientes() {
    if (!this.tieneEstadosPendientes && !this.armaAlCargar) {
      return;
    }
    
    console.log(`🔄 [JugadorRemoto ${this.id}] Aplicando estados pendientes:`, {
      armaAlCargar: this.armaAlCargar,
      estadoPendiente: this.estadoPendiente,
      tieneEstadosPendientes: this.tieneEstadosPendientes
    });
    
    // Aplicar arma del estado inicial o pendiente
    const armaAplicar = this.estadoPendiente.currentWeapon || this.armaAlCargar;
    if (armaAplicar) {
      this.currentWeapon = armaAplicar;
      this.actualizarArmaVisible(armaAplicar);
      console.log(`🔫 [JugadorRemoto ${this.id}] Arma aplicada: ${armaAplicar}`);
    }
    
    // Aplicar estado de curación pendiente
    if (this.estadoPendiente.isHealing) {
      this.procesarCuracion(true);
      console.log(`🧃 [JugadorRemoto ${this.id}] Curación pendiente aplicada`);
    }
    
    // Aplicar estado de apuntado pendiente
    if (this.estadoPendiente.isAiming) {
      this.estaApuntando = true;
      console.log(`🎯 [JugadorRemoto ${this.id}] Estado de apuntado aplicado`);
    }
    
    // Aplicar estado de arma oculta pendiente (tecla C)
    if (this.estadoPendiente.weaponHidden) {
      this.alternarArmaOculta(true);
      console.log(`🖐️ [JugadorRemoto ${this.id}] Estado de arma oculta aplicado`);
    }
    
    // Limpiar estados pendientes
    this.estadoPendiente = {
      currentWeapon: null,
      isHealing: false,
      isAiming: false,
      weaponHidden: false
    };
    this.tieneEstadosPendientes = false;
    this.armaAlCargar = null;
  }

  /**
   * Cambia el arma del jugador remoto
   * Requirements: 1.2, 1.3 - Actualiza visibilidad del cuchillo
   * @param {string} weaponType - Nuevo tipo de arma
   */
  changeWeapon(weaponType) {
    if (this.currentWeapon === weaponType) return;
    
    this.currentWeapon = weaponType;
    this.actualizarArmaVisible(weaponType);
    console.log(`Remote player ${this.id} changed weapon to ${weaponType}`);
  }

  /**
   * Activa la animación de disparo
   * @param {number} duracion - Duración de la animación en segundos
   */
  dispararAnimacion(duracion = 0.3) {
    this.estaDisparando = true;
    this.tiempoDisparo = duracion;
  }

  async inicializarAnimaciones() {
    if (!this.characterModel) return;
    
    this.animador = new AnimadorPersonaje(this.characterModel);
    this.animador.inicializar();
    
    try {
      // Intentar cargar animaciones externas
      // Requirements: 5.2 - Agregar animación healt para curación
      const [clipIdle, clipWalk, clipAim, clipKnifeAttack, clipHealt] = await Promise.all([
        cargarAnimacion('idle'),
        cargarAnimacion('walk'),
        cargarAnimacion('aim'),
        cargarAnimacion('knife_attack'),  // Requirements: 3.1
        cargarAnimacion('healt')          // Requirements: 5.2 - Animación de curación
      ]);
      
      // Usar animación del modelo como fallback si no se cargó la externa
      let idleClip = clipIdle;
      if (!idleClip && this.animacionesDelModelo && this.animacionesDelModelo.length > 0) {
        idleClip = this.animacionesDelModelo[0];
        console.log(`Usando animación del modelo como idle para jugador ${this.id}`);
      }
      
      if (idleClip) {
        this.animador.agregarAnimacion('idle', idleClip);
      }
      if (clipWalk) {
        this.animador.agregarAnimacion('walk', clipWalk);
      }
      if (clipAim) {
        this.animador.agregarAnimacion('aim', clipAim);
      }
      
      // Agregar animación de ataque del cuchillo
      // Requirements: 3.1
      if (clipKnifeAttack) {
        this.animador.agregarAnimacion('knife_attack', clipKnifeAttack);
        this.animacionAtaqueCuchilloCargada = true;
        console.log(`🔪 Animación de ataque de cuchillo cargada para jugador ${this.id}`);
      } else {
        console.warn(`⚠️ No se pudo cargar animación de ataque de cuchillo para jugador ${this.id}`);
        this.animacionAtaqueCuchilloCargada = false;
      }
      
      // Agregar animación de curación
      // Requirements: 4.1, 5.2 - Verificar carga correcta de animación healt
      if (clipHealt) {
        this.animador.agregarAnimacion('healt', clipHealt);
        this.animacionCuracionCargada = true;
        console.log(`🧃 [JugadorRemoto ${this.id}] Animación healt cargada correctamente - duración: ${clipHealt.duration?.toFixed(2) || 'N/A'}s`);
      } else {
        // Requirements: 4.1 - Log claro cuando la animación no está disponible
        console.warn(`⚠️ [JugadorRemoto ${this.id}] Animación healt no disponible - se usará fallback (idle)`);
        this.animacionCuracionCargada = false;
      }
      
      // Iniciar con animación idle inmediatamente
      if (idleClip) {
        this.animador.reproducir('idle', { transicion: 0, loop: true });
        // Forzar actualización inmediata del mixer para aplicar la pose
        this.animador.actualizar(0.016);
      }
    } catch (error) {
      console.warn(`Error cargando animaciones para jugador ${this.id}:`, error);
      // Intentar usar animación del modelo como último recurso
      if (this.animacionesDelModelo && this.animacionesDelModelo.length > 0) {
        this.animador.agregarAnimacion('idle', this.animacionesDelModelo[0]);
        this.animador.reproducir('idle', { transicion: 0, loop: true });
        this.animador.actualizar(0.016);
      }
    }
  }

  createFallbackMesh() {
    const geometry = new THREE.BoxGeometry(0.8, 2, 0.6);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4488ff,
      roughness: 0.7,
      metalness: 0.3
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 1;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false;
    
    this.group.add(this.mesh);
  }

  createHealthBar() {
    this.healthBarGroup = new THREE.Group();
    const hitboxTop = CONFIG.jugador.alturaOjos + SERVER_HITBOX.centerYOffset + SERVER_HITBOX.height / 2;
    this.healthBarGroup.position.y = hitboxTop + 0.3;
    
    const bgGeometry = new THREE.PlaneGeometry(1.2, 0.15);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x333333,
      side: THREE.DoubleSide
    });
    this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
    this.healthBarGroup.add(this.healthBarBg);
    
    const healthGeometry = new THREE.PlaneGeometry(1.1, 0.1);
    const healthMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      side: THREE.DoubleSide
    });
    this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
    this.healthBar.position.z = 0.01;
    this.healthBarGroup.add(this.healthBar);
    
    this.group.add(this.healthBarGroup);
  }

  updateFromState(state) {
    const acabaDeRevivir = !this.serverState.isAlive && state.isAlive;
    
    const distanciaMovimiento = Math.sqrt(
      Math.pow(state.position.x - this.serverState.position.x, 2) +
      Math.pow(state.position.z - this.serverState.position.z, 2)
    );
    const esDash = distanciaMovimiento > 3;
    
    // Requirements: 5.3 - Encolar estados si el modelo no está cargado
    if (!this.modeloCargado) {
      // Guardar estados pendientes para aplicar cuando el modelo cargue
      if (state.currentWeapon) {
        this.estadoPendiente.currentWeapon = state.currentWeapon;
        this.tieneEstadosPendientes = true;
      }
      if (typeof state.isHealing === 'boolean') {
        this.estadoPendiente.isHealing = state.isHealing;
        this.tieneEstadosPendientes = true;
      }
      if (typeof state.isAiming === 'boolean') {
        this.estadoPendiente.isAiming = state.isAiming;
        this.tieneEstadosPendientes = true;
      }
      // Estado de arma oculta (tecla C)
      if (typeof state.weaponHidden === 'boolean') {
        this.estadoPendiente.weaponHidden = state.weaponHidden;
        this.tieneEstadosPendientes = true;
      }
      console.log(`🔄 [JugadorRemoto ${this.id}] Modelo no cargado, encolando estado:`, this.estadoPendiente);
    } else {
      // Modelo cargado, aplicar cambios inmediatamente
      if (state.currentWeapon && state.currentWeapon !== this.currentWeapon) {
        this.changeWeapon(state.currentWeapon);
      }
      
      // Detectar si está apuntando (el servidor envía isAiming)
      if (typeof state.isAiming === 'boolean' && state.isAiming !== this.estaApuntando) {
        this.estaApuntando = state.isAiming;
      }
      
      // Detectar si el arma está oculta (tecla C)
      if (typeof state.weaponHidden === 'boolean' && state.weaponHidden !== this.armaOculta) {
        this.alternarArmaOculta(state.weaponHidden);
      }
    }
    
    this.previousState = {
      position: { ...this.serverState.position },
      rotation: { ...this.serverState.rotation }
    };
    
    this.serverState = { ...state };
    
    if (acabaDeRevivir) {
      this.group.position.set(
        state.position.x,
        state.position.y - CONFIG.jugador.alturaOjos + CHARACTER_CONFIG.heightOffset,
        state.position.z
      );
      this.previousState.position = { ...state.position };
      this.interpolationAlpha = 1;
      this.lastWorldPosition.copy(this.group.position);
    } else if (esDash) {
      this.interpolationAlpha = 0;
      this.dashInterpolation = true;
    } else {
      this.interpolationAlpha = 0;
      this.dashInterpolation = false;
    }
    
    this.group.visible = state.isAlive;
  }

  updateHealthBar(health, maxHealth) {
    const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
    
    this.healthBar.scale.x = healthPercent;
    this.healthBar.position.x = (healthPercent - 1) * 0.55;
    
    if (healthPercent > 0.5) {
      this.healthBar.material.color.setHex(0x00ff00);
    } else if (healthPercent > 0.25) {
      this.healthBar.material.color.setHex(0xffff00);
    } else {
      this.healthBar.material.color.setHex(0xff0000);
    }
  }

  /**
   * ✅ ARREGLADO: Interpolación con detección de movimiento REAL
   */
  interpolate(deltaTime) {
    const interpolationSpeed = this.dashInterpolation ? 15 : 12;
    this.interpolationAlpha = Math.min(1, this.interpolationAlpha + deltaTime * interpolationSpeed);
    
    const easedAlpha = easeOutQuad(this.interpolationAlpha);
    
    // Lerp position
    const targetX = this.serverState.position.x;
    const targetY = this.serverState.position.y - CONFIG.jugador.alturaOjos + CHARACTER_CONFIG.heightOffset;
    const targetZ = this.serverState.position.z;
    
    const prevX = this.previousState.position.x;
    const prevY = this.previousState.position.y - CONFIG.jugador.alturaOjos + CHARACTER_CONFIG.heightOffset;
    const prevZ = this.previousState.position.z;
    
    this.group.position.x = lerp(prevX, targetX, easedAlpha);
    this.group.position.y = lerp(prevY, targetY, easedAlpha);
    this.group.position.z = lerp(prevZ, targetZ, easedAlpha);
    
    // Lerp rotation
    const targetRotY = this.serverState.rotation.y;
    const prevRotY = this.previousState.rotation.y;
    const currentRotY = lerpAngle(prevRotY, targetRotY, easedAlpha);
    this.group.rotation.y = currentRotY;
    
    // Medir velocidad REAL en el mundo (no estado de red)
    const currentPos = this.group.position;
    const deltaX = currentPos.x - this.lastWorldPosition.x;
    const deltaZ = currentPos.z - this.lastWorldPosition.z;
    
    const distanciaFrame = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
    this.worldVelocity = distanciaFrame / Math.max(deltaTime, 0.0001);
    
    // Guardar posición actual para el siguiente frame
    this.lastWorldPosition.copy(currentPos);
    
    // Umbral de velocidad + histeresis (anti-parpadeo)
    const SPEED_THRESHOLD = 0.08;
    
    if (this.worldVelocity > SPEED_THRESHOLD) {
      this.moveCooldown = 0.15;
    } else {
      this.moveCooldown -= deltaTime;
    }
    
    const nuevoEstadoMovimiento = this.moveCooldown > 0;
    
    // Requirements: 4.3 - Actualizar estado de movimiento para uso en finalizarCuracion
    this.estaMoviendose = nuevoEstadoMovimiento;
    
    // Actualizar tiempo de disparo
    if (this.tiempoDisparo > 0) {
      this.tiempoDisparo -= deltaTime;
      if (this.tiempoDisparo <= 0) {
        this.estaDisparando = false;
      }
    }
    
    // Determinar animación según prioridad: curación > ataque cuchillo > disparando/apuntando > walk > idle
    let animacionObjetivo = 'idle';
    let usarLoop = true;
    
    // Si hay curación en progreso, no cambiar la animación
    if (this.curacionEnProgreso) {
      if (this.animador) {
        this.animador.actualizar(deltaTime);
      }
      return;
    }
    
    // Si hay un ataque de cuchillo en progreso, no cambiar la animación
    if (this.animacionAtaqueEnProgreso) {
      if (this.animador) {
        this.animador.actualizar(deltaTime);
      }
      return;
    }
    
    if (this.estaApuntando || this.estaDisparando) {
      animacionObjetivo = 'aim';
      usarLoop = false;
    } else if (nuevoEstadoMovimiento) {
      animacionObjetivo = 'walk';
    }
    
    // Cambiar animación solo si es diferente a la actual del animador
    if (this.animador) {
      const animActual = this.animador.obtenerAnimacionActual();
      if (animacionObjetivo !== animActual) {
        this.animador.reproducir(animacionObjetivo, { transicion: 0.1, loop: usarLoop });
      }
      this.animador.actualizar(deltaTime);
    }
    
    // Actualizar visibilidad del JuiceBox según si está equipado o no
    // Las animaciones pueden cambiar la visibilidad, así que lo forzamos aquí
    const juiceBoxEquipado = this.currentWeapon === 'JUICEBOX';
    if (this.meshesJuiceBoxEnModelo && this.meshesJuiceBoxEnModelo.length > 0) {
      this.meshesJuiceBoxEnModelo.forEach((mesh) => {
        mesh.visible = juiceBoxEquipado;
      });
    }

    // IMPORTANTE: Forzar visibilidad del mesh Straw
    // El mesh Straw debe estar VISIBLE solo cuando JuiceBox está equipado o armaOculta es true
    // En cualquier otro caso (arma o cuchillo), debe estar OCULTO
    if (this.meshStraw) {
      const strawDebeSerVisible = juiceBoxEquipado || this.armaOculta;
      this.meshStraw.visible = strawDebeSerVisible;
    }
  }

  getPosition() {
    return {
      x: this.group.position.x,
      y: this.group.position.y,
      z: this.group.position.z
    };
  }  isAlive() {
    return this.serverState.isAlive;
  }

  destroy() {
    if (this.animador) {
      this.animador.destruir();
      this.animador = null;
    }
    
    // Limpiar modelo del cuchillo TPS
    if (this.modeloCuchilloTPS) {
      if (this.huesoMano) {
        this.huesoMano.remove(this.modeloCuchilloTPS);
      }
      this.modeloCuchilloTPS.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.modeloCuchilloTPS = null;
    }
    
    // Limpiar modelo del JuiceBox TPS
    // Requirements: 5.1, 6.1
    if (this.modeloJuiceBoxTPS) {
      if (this.huesoMano) {
        this.huesoMano.remove(this.modeloJuiceBoxTPS);
      }
      this.modeloJuiceBoxTPS.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.modeloJuiceBoxTPS = null;
    }
    this.huesoMano = null;
    
    this.scene.remove(this.group);
    
    if (this.hitbox) {
      this.hitbox.geometry.dispose();
      this.hitbox.material.dispose();
    }
    
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    
    if (this.characterModel) {
      this.characterModel.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
    
    this.weaponMeshes = {};
  }
}

export function getCharacterHitbox() {
  return { ...SERVER_HITBOX };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutQuad(t) {
  return t * (2 - t);
}

function lerpAngle(a, b, t) {
  let diff = b - a;
  
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  
  return a + diff * t;
}