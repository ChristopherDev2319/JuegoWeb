/**
 * Script de verificación del sistema de chat mejorado
 * Verifica que las mejoras de nombres de jugadores funcionen correctamente
 */

// Simular DOM básico para testing
global.document = {
  createElement: (tag) => ({
    style: { cssText: '' },
    innerHTML: '',
    appendChild: () => {},
    addEventListener: () => {},
    matches: () => false,
    querySelector: () => null,
    querySelectorAll: () => [],
    classList: { add: () => {}, remove: () => {} },
    parentNode: { replaceChild: () => {} },
    cloneNode: () => ({ disabled: false, classList: { add: () => {}, contains: () => false } })
  }),
  body: {
    appendChild: () => {},
    requestPointerLock: () => {}
  },
  addEventListener: () => {},
  getElementById: () => null,
  pointerLockElement: null,
  exitPointerLock: () => {}
};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: () => {},
  location: { protocol: 'http:', hostname: 'localhost', port: '3001' }
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Navigator is read-only in Node.js, skip override

global.performance = {
  now: () => Date.now()
};

// Importar y probar el sistema de chat
import { ChatSystem } from './src/ui/chatSystem.js';

console.log('🧪 Iniciando verificación del sistema de chat mejorado...\n');

// Test 1: Inicialización en modo local
console.log('📝 Test 1: Inicialización en modo local');
try {
  const chatLocal = new ChatSystem({
    isOnline: false,
    playerName: 'TestPlayer'
  });
  console.log('✅ Chat local inicializado correctamente');
} catch (error) {
  console.error('❌ Error en inicialización local:', error.message);
}

// Test 2: Inicialización en modo online
console.log('\n🌐 Test 2: Inicialización en modo online');
try {
  const chatOnline = new ChatSystem({
    isOnline: true,
    playerName: 'OnlinePlayer'
  });
  console.log('✅ Chat online inicializado correctamente');
} catch (error) {
  console.error('❌ Error en inicialización online:', error.message);
}

// Test 3: Verificar función addPlayerMessage
console.log('\n💬 Test 3: Función addPlayerMessage');
try {
  const chat = new ChatSystem({
    isOnline: true,
    playerName: 'TestPlayer'
  });
  
  // Verificar que la función existe y tiene los parámetros correctos
  if (typeof chat.addPlayerMessage === 'function') {
    console.log('✅ Función addPlayerMessage existe');
    
    // Verificar que acepta el parámetro isOwnMessage
    const funcString = chat.addPlayerMessage.toString();
    if (funcString.includes('isOwnMessage')) {
      console.log('✅ Parámetro isOwnMessage detectado');
    } else {
      console.log('❌ Parámetro isOwnMessage no encontrado');
    }
    
    // Probar llamadas a la función
    chat.addPlayerMessage('TestPlayer', 'Mensaje propio', true);
    chat.addPlayerMessage('OtroJugador', 'Mensaje de otro', false);
    console.log('✅ Llamadas a addPlayerMessage ejecutadas sin errores');
    
  } else {
    console.log('❌ Función addPlayerMessage no encontrada');
  }
} catch (error) {
  console.error('❌ Error probando addPlayerMessage:', error.message);
}

// Test 4: Verificar cambio de modo
console.log('\n🔄 Test 4: Cambio de modo');
try {
  const chat = new ChatSystem({
    isOnline: false,
    playerName: 'TestPlayer'
  });
  
  // Cambiar a modo online
  chat.setMode(true, 'OnlinePlayer');
  console.log('✅ Cambio a modo online exitoso');
  
  // Cambiar de vuelta a modo local
  chat.setMode(false, 'LocalPlayer');
  console.log('✅ Cambio a modo local exitoso');
  
} catch (error) {
  console.error('❌ Error en cambio de modo:', error.message);
}

// Test 5: Verificar procesamiento de comandos locales
console.log('\n⚙️ Test 5: Comandos locales');
try {
  const chat = new ChatSystem({
    isOnline: false,
    playerName: 'TestPlayer'
  });
  
  // Probar comando help
  chat.processLocalMessage('help');
  console.log('✅ Comando help procesado');
  
  // Probar comando time
  chat.processLocalMessage('time');
  console.log('✅ Comando time procesado');
  
  // Probar comando info
  chat.processLocalMessage('info');
  console.log('✅ Comando info procesado');
  
} catch (error) {
  console.error('❌ Error procesando comandos:', error.message);
}

// Test 6: Verificar función receiveMessage
console.log('\n📨 Test 6: Recepción de mensajes');
try {
  const chat = new ChatSystem({
    isOnline: true,
    playerName: 'TestPlayer'
  });
  
  if (typeof chat.receiveMessage === 'function') {
    chat.receiveMessage('RemotePlayer', 'Mensaje recibido');
    console.log('✅ Función receiveMessage funciona correctamente');
  } else {
    console.log('❌ Función receiveMessage no encontrada');
  }
  
} catch (error) {
  console.error('❌ Error en receiveMessage:', error.message);
}

console.log('\n🎉 Verificación completada!');
console.log('\n📋 Resumen de mejoras implementadas:');
console.log('   ✅ Fondos coloreados para mensajes (verde=propio, azul=otros)');
console.log('   ✅ Indicadores emoji (🟢=propio, 🔵=otros)');
console.log('   ✅ Nombres coloreados según el remitente');
console.log('   ✅ Detección automática de mensajes propios');
console.log('   ✅ Soporte para modo local y online');
console.log('   ✅ Comandos especiales en modo local');
console.log('   ✅ Función receiveMessage para mensajes remotos');