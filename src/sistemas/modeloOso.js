/**
 * Sistema de carga única del modelo de oso
 * Evita cargar el modelo múltiples veces y asegura que todos los bots tengan mesh
 */

// Verificar que THREE esté disponible
if (typeof THREE === 'undefined') {
  console.error('❌ THREE.js no está disponible en modeloOso.js');
}

// Variable global para el modelo cargado
let modeloOso = null;
let promesaCarga = null;

/**
 * Carga el modelo de oso una sola vez
 * @returns {Promise<THREE.Group>} Promesa que resuelve con el modelo cargado
 */
export async function cargarSkinOso() {
  // Si ya está cargado, devolverlo inmediatamente
  if (modeloOso) {
    console.log('🐻 Modelo de oso ya cargado, reutilizando');
    return modeloOso;
  }

  // Si ya hay una carga en progreso, esperar a que termine
  if (promesaCarga) {
    console.log('🔄 Esperando carga en progreso del modelo de oso...');
    return promesaCarga;
  }

  console.log('🐻 Iniciando carga única del modelo de oso...');

  // Crear nueva promesa de carga
  promesaCarga = new Promise((resolve, reject) => {
    const loader = new THREE.GLTFLoader();
    
    loader.load(
      '/modelos/cubed_bear.glb',
      (gltf) => {
        modeloOso = gltf.scene;
        console.log('✅ Modelo de oso cargado exitosamente');
        
        // Analizar el modelo
        let meshCount = 0;
        const box = new THREE.Box3().setFromObject(modeloOso);
        const size = box.getSize(new THREE.Vector3());
        
        modeloOso.traverse((child) => {
          if (child.isMesh) {
            meshCount++;
          }
        });
        
        console.log(`📊 Modelo de oso: ${meshCount} meshes, tamaño: ${size.x.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}`);
        
        resolve(modeloOso);
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log(`🔄 Cargando modelo de oso: ${percent}%`);
        }
      },
      (error) => {
        console.error('❌ Error cargando modelo de oso:', error);
        promesaCarga = null; // Resetear para permitir reintentos
        reject(error);
      }
    );
  });

  return promesaCarga;
}

/**
 * Clona el modelo de oso para un bot específico
 * @param {string} tipoBot - Tipo de bot para logs
 * @returns {THREE.Group} Clon del modelo configurado
 */
export function clonarSkinOso(tipoBot = 'bot') {
  if (!modeloOso) {
    console.error(`❌ Intentando clonar modelo de oso antes de cargarlo para ${tipoBot}`);
    return null;
  }

  console.log(`🐻 Clonando modelo de oso para ${tipoBot}`);
  
  // Clonar profundamente el modelo
  const skin = modeloOso.clone(true);
  
  // Configurar propiedades básicas
  skin.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.visible = true;
      
      // Asegurar que el material sea visible
      if (child.material) {
        child.material.visible = true;
        child.material.needsUpdate = true;
        
        // Corregir transparencia problemática
        if (child.material.transparent && child.material.opacity === 0) {
          child.material.opacity = 1.0;
        }
        
        // Corregir materiales negros
        if (child.material.color && child.material.color.getHex() === 0x000000) {
          child.material.color.setHex(0x8B4513); // Marrón oso
        }
      }
    }
  });
  
  // Aplicar escala apropiada
  const box = new THREE.Box3().setFromObject(skin);
  const size = box.getSize(new THREE.Vector3());
  
  let escala = 2.0; // Escala base
  if (size.x < 0.5 || size.y < 0.5 || size.z < 0.5) {
    escala = 4.0; // Muy pequeño
  } else if (size.x < 1.5 || size.y < 1.5 || size.z < 1.5) {
    escala = 2.5; // Pequeño
  }
  
  skin.scale.set(escala, escala, escala);
  console.log(`📏 Skin de ${tipoBot} escalada x${escala}`);
  
  return skin;
}

/**
 * Verifica si el modelo está cargado
 * @returns {boolean}
 */
export function estaModeloCargado() {
  return modeloOso !== null;
}

/**
 * Obtiene información del modelo cargado
 * @returns {Object|null}
 */
export function obtenerInfoModelo() {
  if (!modeloOso) return null;
  
  const box = new THREE.Box3().setFromObject(modeloOso);
  const size = box.getSize(new THREE.Vector3());
  let meshCount = 0;
  
  modeloOso.traverse((child) => {
    if (child.isMesh) meshCount++;
  });
  
  return {
    meshes: meshCount,
    tamaño: {
      x: size.x,
      y: size.y,
      z: size.z
    },
    cargado: true
  };
}