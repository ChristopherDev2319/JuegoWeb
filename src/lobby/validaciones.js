/**
 * Módulo de validaciones y utilidades para el sistema de lobby
 * Requirements: 1.4, 1.5, 4.2, 4.4
 */

/**
 * Valida un nombre de jugador
 * Acepta 3-16 caracteres alfanuméricos (a-z, A-Z, 0-9, _)
 * @param {string} nombre - Nombre a validar
 * @returns {{valido: boolean, error?: string}}
 */
export function validarNombre(nombre) {
  if (typeof nombre !== 'string') {
    return { valido: false, error: 'El nombre debe ser un texto' };
  }
  
  if (nombre.length < 3) {
    return { valido: false, error: 'El nombre debe tener al menos 3 caracteres' };
  }
  
  if (nombre.length > 16) {
    return { valido: false, error: 'El nombre no puede tener más de 16 caracteres' };
  }
  
  // Solo permite caracteres alfanuméricos y guión bajo
  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(nombre)) {
    return { valido: false, error: 'El nombre solo puede contener letras, números y guión bajo' };
  }
  
  return { valido: true };
}

/**
 * Valida una contraseña de sala
 * Acepta 4-20 caracteres
 * @param {string} password - Contraseña a validar
 * @returns {{valido: boolean, error?: string}}
 */
export function validarPassword(password) {
  if (typeof password !== 'string') {
    return { valido: false, error: 'La contraseña debe ser un texto' };
  }
  
  if (password.length < 4) {
    return { valido: false, error: 'La contraseña debe tener al menos 4 caracteres' };
  }
  
  if (password.length > 20) {
    return { valido: false, error: 'La contraseña no puede tener más de 20 caracteres' };
  }
  
  return { valido: true };
}

/**
 * Genera un nombre aleatorio con formato "Jugador_XXXX"
 * donde XXXX son 4 dígitos numéricos
 * @returns {string}
 */
export function generarNombreAleatorio() {
  const digitos = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `Jugador_${digitos}`;
}

/**
 * Genera un código de sala único de 6 caracteres alfanuméricos
 * @returns {string}
 */
export function generarCodigoSala() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}
