/**
 * Sistema de caché de modelos GLB
 * Carga modelos una sola vez y los mantiene en memoria para clonación rápida
 */

// Cache global de modelos cargados
const modelosCache = new Map();

// Estado de carga
const estadoCarga = new Map();

// Ruta del modelo de oso
const RUTA_MODELO_OSO = '/modelos/cubed_bear.glb';

/**
 * Carga un modelo GLB y lo guarda en caché
 * @param {string} ruta - Ruta del modelo GLB
 * @returns {Promise<THREE.Object3D>} - Modelo cargado
 */
export async function cargarModelo(ruta) {
  // Si ya está en caché, devolverlo inmediatamente
  if (modelosCache.has(ruta)) {
    return modelosCache.get(ruta);
  }

  // Si ya se está cargando, esperar a que termine
  if (estadoCarga.has(ruta)) {
    return estadoCarga.get(ruta);
  }

  // Crear promesa de carga
  const promesaCarga = new Promise((resolve, reject) => {
    const loader = new THREE.GLTFLoader();
    
    loader.load(ruta, (gltf) => {
      const modelo = gltf.scene;
      
      // Configurar modelo base
      modelo.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.visible = true;
          
          if (child.material) {
            child.material.needsUpdate = true;
            
            // Corregir transparencia
            if (child.material.transparent && child.material.opacity === 0) {
              child.material.opacity = 1.0;
            }
            
            // Corregir color negro
            if (child.material.color && child.material.color.getHex() === 0x000000) {
              child.material.color.setHex(0x8B4513);
            }
          }
        }
      });
      
      // Guardar en caché
      modelosCache.set(ruta, modelo);
      estadoCarga.delete(ruta);
      
      console.log(`✅ Modelo cacheado: ${ruta}`);
      resolve(modelo);
      
    }, undefined, (error) => {
      estadoCarga.delete(ruta);
      console.error(`❌ Error cargando modelo ${ruta}:`, error);
      reject(error);
    });
  });

  // Guardar promesa mientras se carga
  estadoCarga.set(ruta, promesaCarga);
  
  return promesaCarga;
}

/**
 * Clona un modelo del caché
 * @param {string} ruta - Ruta del modelo GLB
 * @returns {Promise<THREE.Object3D>} - Clon del modelo
 */
export async function clonarModelo(ruta) {
  const modeloOriginal = await cargarModelo(ruta);
  return modeloOriginal.clone(true);
}

/**
 * Verifica si un modelo está en caché
 * @param {string} ruta - Ruta del modelo GLB
 * @returns {boolean}
 */
export function estaEnCache(ruta) {
  return modelosCache.has(ruta);
}

/**
 * Precarga el modelo de oso para uso inmediato
 * @returns {Promise<THREE.Object3D>} - Modelo cargado
 */
export async function precargarModeloOso() {
  return cargarModelo(RUTA_MODELO_OSO);
}

/**
 * Crea un clon del modelo de oso (debe estar precargado)
 * @returns {THREE.Object3D|null} - Clon del modelo o null si no está cargado
 */
export function crearClonOso() {
  if (!modelosCache.has(RUTA_MODELO_OSO)) {
    console.error('❌ Modelo de oso no está en caché. Debe precargarse primero.');
    return null;
  }
  
  const modeloOriginal = modelosCache.get(RUTA_MODELO_OSO);
  
  if (!modeloOriginal) {
    console.error('❌ Modelo original es null en el cache');
    return null;
  }
  
  const clon = modeloOriginal.clone(true);
  
  if (!clon) {
    console.error('❌ Error clonando modelo - clon es null');
    return null;
  }
  
  console.log(`🔄 Creando clon de oso...`);
  
  // Aplicar configuraciones específicas del oso
  const escala = 2.5;
  clon.scale.set(escala, escala, escala);
  clon.castShadow = true;
  clon.receiveShadow = true;
  clon.visible = true;
  
  // Configurar materiales para visibilidad
  let meshesEncontrados = 0;
  clon.traverse((child) => {
    if (child.isMesh) {
      meshesEncontrados++;
      
      child.castShadow = true;
      child.receiveShadow = true;
      child.visible = true;
      child.frustumCulled = false; // Evitar culling
      
      if (child.material) {
        // Clonar el material para evitar compartir referencias
        child.material = child.material.clone();
        
        child.material.visible = true;
        child.material.needsUpdate = true;
        child.material.transparent = false; // Forzar opaco
        child.material.opacity = 1.0;
        child.material.alphaTest = 0;
        
        // Corregir color negro
        if (child.material.color) {
          const colorHex = child.material.color.getHex();
          
          if (colorHex === 0x000000 || colorHex < 0x111111) {
            child.material.color.setHex(0x8B4513); // Marrón oso
          }
        }
        
        // Si es MeshStandardMaterial, configurar propiedades adicionales
        if (child.material.isMeshStandardMaterial) {
          child.material.metalness = 0.1;
          child.material.roughness = 0.8;
        }
      } else {
        // Crear material básico si no tiene
        child.material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      }
    }
  });
  
  console.log(`✅ Clon de oso configurado con ${meshesEncontrados} meshes`);
  return clon;
}

/**
 * Limpia el caché de modelos
 */
export function limpiarCache() {
  modelosCache.clear();
  estadoCarga.clear();
  console.log('🧹 Caché de modelos limpiado');
}