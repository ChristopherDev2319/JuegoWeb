/**
 * Utilidades para manejo seguro de localStorage
 * Maneja errores de tracking prevention y otros problemas de storage
 */

// Estado del storage
let storageAvailable = true;
let fallbackStorage = new Map();

/**
 * Verifica si localStorage está disponible
 */
function checkStorageAvailability() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    storageAvailable = true;
    return true;
  } catch (error) {
    console.warn('⚠️ localStorage no disponible:', error.message);
    storageAvailable = false;
    return false;
  }
}

/**
 * Obtiene un item del storage de forma segura
 * @param {string} key - Clave del item
 * @param {string} defaultValue - Valor por defecto si no existe
 * @returns {string|null} - Valor del item o null
 */
export function getStorageItem(key, defaultValue = null) {
  try {
    if (storageAvailable) {
      return localStorage.getItem(key) || defaultValue;
    } else {
      return fallbackStorage.get(key) || defaultValue;
    }
  } catch (error) {
    console.warn(`⚠️ Error obteniendo ${key} del storage:`, error.message);
    storageAvailable = false;
    return fallbackStorage.get(key) || defaultValue;
  }
}

/**
 * Guarda un item en el storage de forma segura
 * @param {string} key - Clave del item
 * @param {string} value - Valor a guardar
 * @returns {boolean} - true si se guardó correctamente
 */
export function setStorageItem(key, value) {
  try {
    if (storageAvailable) {
      localStorage.setItem(key, value);
      // También guardar en fallback por si acaso
      fallbackStorage.set(key, value);
      return true;
    } else {
      fallbackStorage.set(key, value);
      console.warn(`⚠️ Usando storage temporal para ${key} (localStorage no disponible)`);
      return false;
    }
  } catch (error) {
    console.warn(`⚠️ Error guardando ${key} en storage:`, error.message);
    storageAvailable = false;
    fallbackStorage.set(key, value);
    return false;
  }
}

/**
 * Elimina un item del storage de forma segura
 * @param {string} key - Clave del item
 * @returns {boolean} - true si se eliminó correctamente
 */
export function removeStorageItem(key) {
  try {
    if (storageAvailable) {
      localStorage.removeItem(key);
    }
    fallbackStorage.delete(key);
    return true;
  } catch (error) {
    console.warn(`⚠️ Error eliminando ${key} del storage:`, error.message);
    fallbackStorage.delete(key);
    return false;
  }
}

/**
 * Obtiene un objeto JSON del storage de forma segura
 * @param {string} key - Clave del item
 * @param {Object} defaultValue - Valor por defecto si no existe
 * @returns {Object} - Objeto parseado o valor por defecto
 */
export function getStorageJSON(key, defaultValue = {}) {
  try {
    const item = getStorageItem(key);
    if (item) {
      return JSON.parse(item);
    }
    return defaultValue;
  } catch (error) {
    console.warn(`⚠️ Error parseando JSON de ${key}:`, error.message);
    return defaultValue;
  }
}

/**
 * Guarda un objeto JSON en el storage de forma segura
 * @param {string} key - Clave del item
 * @param {Object} value - Objeto a guardar
 * @returns {boolean} - true si se guardó correctamente
 */
export function setStorageJSON(key, value) {
  try {
    const jsonString = JSON.stringify(value);
    return setStorageItem(key, jsonString);
  } catch (error) {
    console.warn(`⚠️ Error convirtiendo a JSON ${key}:`, error.message);
    return false;
  }
}

/**
 * Verifica el estado del storage y muestra información
 */
export function getStorageInfo() {
  checkStorageAvailability();
  return {
    available: storageAvailable,
    fallbackItems: fallbackStorage.size,
    message: storageAvailable ? 
      'localStorage disponible' : 
      `localStorage no disponible, usando storage temporal (${fallbackStorage.size} items)`
  };
}

// Verificar disponibilidad al cargar el módulo
checkStorageAvailability();

// Mostrar información del storage
console.log('💾 Storage Info:', getStorageInfo());