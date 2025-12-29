# Sistema de Armas - Guía Completa

## 🔫 Descripción General

El sistema de armas ha sido completamente renovado para soportar múltiples tipos de armas con diferentes características y comportamientos. Ahora puedes tener un arsenal completo con rifles, pistolas, francotiradores y escopetas.

## 🎮 Controles

### Cambio de Armas
- **Q**: Siguiente arma
- **Rueda del mouse hacia arriba**: Siguiente arma  
- **Rueda del mouse hacia abajo**: Arma anterior
- **1-5**: Seleccionar arma directamente por número

### Acciones
- **Clic izquierdo**: Disparar
- **Clic derecho**: Apuntar (mantener presionado)
- **R**: Recargar
- **E**: Dash
- **Espacio**: Saltar

## 🎯 Sistema de Apuntado (ADS)

### Funcionalidad
El sistema de apuntado permite mayor precisión y control al disparar. Cada arma tiene configuraciones únicas de apuntado.

### Controles
- **Clic derecho**: Mantener presionado para apuntar
- **Soltar clic derecho**: Dejar de apuntar

### Beneficios del Apuntado
1. **Zoom de cámara**: Acerca la vista para mejor precisión
2. **Reducción de retroceso**: Menor retroceso al disparar
3. **Crosshair mejorado**: Más pequeño y preciso (verde)
4. **Reducción de dispersión**: Para escopetas, menor dispersión de proyectiles
5. **Mira telescópica**: El francotirador tiene zoom especial

### Configuración por Arma
- **M4A1**: Zoom 1.5x, -40% retroceso
- **AK-47**: Zoom 1.4x, -50% retroceso  
- **Glock 17**: Zoom 1.2x, -30% retroceso
- **AWP**: Zoom 4.0x, -70% retroceso, mira telescópica
- **Escopeta**: Zoom 1.3x, -60% retroceso, -40% dispersión

### Indicadores Visuales
- **Crosshair verde**: Cuando está apuntando
- **Crosshair más pequeño**: Mayor precisión
- **Indicador "APUNTANDO"**: Texto en pantalla
- **Nombre del arma**: Muestra "[APUNTANDO]" en la UI

## 🔧 Armas Disponibles

### 1. M4A1 (Rifle de Asalto)
- **Daño**: 20
- **Cadencia**: 400 RPM
- **Cargador**: 30 balas
- **Munición total**: 120
- **Recarga**: 2.0s
- **Zoom**: 1.5x
- **Reducción retroceso**: 40%
- **Características**: Arma equilibrada, buena para combate medio

### 2. AK-47 (Rifle de Asalto)
- **Daño**: 30
- **Cadencia**: 600 RPM  
- **Cargador**: 30 balas
- **Munición total**: 90
- **Recarga**: 2.5s
- **Zoom**: 1.4x
- **Reducción retroceso**: 50%
- **Características**: Más daño pero más retroceso

### 3. Glock 17 (Pistola)
- **Daño**: 15
- **Cadencia**: 300 RPM
- **Cargador**: 17 balas
- **Munición total**: 68
- **Recarga**: 1.5s
- **Zoom**: 1.2x
- **Reducción retroceso**: 30%
- **Características**: Rápida de recargar, poco retroceso

### 4. AWP (Francotirador)
- **Daño**: 100
- **Cadencia**: 60 RPM
- **Cargador**: 5 balas
- **Munición total**: 20
- **Recarga**: 3.0s
- **Zoom**: 4.0x (Mira telescópica)
- **Reducción retroceso**: 70%
- **Características**: Daño extremo, disparo lento, máximo zoom

### 5. Remington 870 (Escopeta)
- **Daño**: 80
- **Cadencia**: 120 RPM
- **Cargador**: 8 balas
- **Munición total**: 32
- **Recarga**: 2.8s
- **Zoom**: 1.3x
- **Reducción retroceso**: 60%
- **Reducción dispersión**: 40%
- **Características**: 8 proyectiles por disparo, dispersión reducida al apuntar

## 💻 Implementación Técnica

### Configuración de Armas

Las armas se configuran en `src/config.js`:

```javascript
armas: {
  "NUEVA_ARMA": {
    nombre: "Nombre del Arma",
    tipo: "rifle", // rifle, pistola, francotirador, escopeta
    cadenciaDisparo: 400, // Balas por minuto
    daño: 25,
    tamañoCargador: 30,
    municionTotal: 120,
    tiempoRecarga: 2.0, // Segundos
    velocidadBala: 30.0,
    retroceso: {
      cantidad: 0.05,
      arriba: 0.02,
      duracion: 60 // Milisegundos
    },
    // Para escopetas:
    proyectiles: 8, // Múltiples proyectiles
    dispersion: 0.1 // Dispersión de proyectiles
  }
}
```

### Funciones Principales

#### Cambio de Armas
```javascript
import { cambiarArma, agregarArma, siguienteArma, armaAnterior } from './src/sistemas/armas.js';

// Cambiar a un arma específica
cambiarArma('AK47');

// Agregar arma al inventario
agregarArma('SNIPER');

// Navegar por las armas
siguienteArma();
armaAnterior();
```

#### Funciones de Apuntado
```javascript
import { alternarApuntado, estaApuntando, establecerCamara } from './src/sistemas/armas.js';

// Establecer referencia de cámara (necesario para el zoom)
establecerCamara(camera);

// Apuntar
alternarApuntado(true);

// Dejar de apuntar
alternarApuntado(false);

// Alternar apuntado
alternarApuntado(); // Cambia entre apuntar/no apuntar

// Verificar si está apuntando
if (estaApuntando()) {
  console.log('El jugador está apuntando');
}
```

#### Configuración de Apuntado
```javascript
// En src/config.js
armas: {
  "MI_ARMA": {
    // ... otras configuraciones
    apuntado: {
      zoom: 1.5, // Factor de zoom de la cámara
      reduccionRetroceso: 0.6, // 0.6 = 40% menos retroceso
      tiempoTransicion: 0.2, // Segundos para la animación
      posicionArma: { x: 0, y: -0.1, z: -0.2 }, // Posición del arma al apuntar
      miraTelescopica: true, // Solo para francotiradores
      reduccionDispersion: 0.6 // Solo para escopetas (0.6 = 40% menos dispersión)
    }
  }
}
```

#### Disparo y Recarga
```javascript
import { disparar, recargar } from './src/sistemas/armas.js';

// Disparar (automáticamente usa la configuración del arma actual)
disparar(camera, enemigos, balas, scene, onImpacto);

// Recargar con callback
recargar(() => {
  console.log('Recarga completada');
});
```

### Integración con UI

```javascript
import { actualizarInfoArma, mostrarCambioArma } from './src/utils/ui.js';

// Actualizar información del arma en la UI
const estado = obtenerEstado();
actualizarInfoArma(estado);

// Mostrar notificación de cambio
mostrarCambioArma(estado.nombre);
```

## 🎨 Personalización de UI

### Elementos HTML Necesarios

```html
<!-- Información del arma -->
<div id="weapon-info">
  <div id="weapon-name">M4A1</div>
  <div id="ammo">30 / 120</div>
</div>

<!-- Lista de armas -->
<div id="weapon-list"></div>

<!-- Notificación de cambio -->
<div id="weapon-change-notification"></div>
```

### Estilos CSS

Los estilos están en `css/estilos.css` y incluyen:
- Información del arma (esquina inferior derecha)
- Lista de armas disponibles
- Notificaciones de cambio de arma
- Indicadores de munición con colores

## 🚀 Cómo Agregar Nuevas Armas

### 1. Configurar el Arma

Agrega la configuración en `src/config.js`:

```javascript
armas: {
  // ... armas existentes
  "MI_ARMA": {
    nombre: "Mi Arma Personalizada",
    tipo: "rifle",
    cadenciaDisparo: 500,
    daño: 35,
    tamañoCargador: 25,
    municionTotal: 100,
    tiempoRecarga: 2.2,
    velocidadBala: 32.0,
    retroceso: {
      cantidad: 0.06,
      arriba: 0.03,
      duracion: 70
    }
  }
}
```

### 2. Agregar al Inventario

```javascript
import { agregarArma } from './src/sistemas/armas.js';

// En tu código de juego
agregarArma('MI_ARMA');
```

### 3. Personalizar Comportamiento (Opcional)

Para comportamientos especiales, puedes modificar la función `disparar()` en `src/sistemas/armas.js`.

## 🔍 Debugging y Testing

### Funciones de Testing

```javascript
// En la consola del navegador
mostrarEstadisticasArmas(); // Muestra stats de todas las armas
recogerArma('SNIPER'); // Simula recoger un arma

// Nuevas funciones de apuntado
alternarApuntado(true); // Apuntar
alternarApuntado(false); // Dejar de apuntar
estaApuntando(); // Verificar estado
```

### Tests Disponibles

#### Test Completo del Sistema
```
http://localhost:8080/test-armas.html
```
- Prueba todas las funcionalidades
- Cambio de armas
- Sistema de apuntado básico

#### Test Específico de Apuntado
```
http://localhost:8080/test-apuntado.html
```
- Demo visual del crosshair
- Comparación de zoom por arma
- Estadísticas de apuntado
- Simulación de efectos

### Logs Útiles

El sistema incluye logs en consola para:
- Cambios de arma
- Recarga completada
- Armas agregadas al inventario

## 🐛 Solución de Problemas

### El arma no cambia
- Verifica que el arma esté en el inventario con `obtenerEstado().armasDisponibles`
- Asegúrate de que el tipo de arma existe en `CONFIG.armas`

### La UI no se actualiza
- Llama a `actualizarInfoArma(obtenerEstado())` después de cambios
- Verifica que los elementos HTML existan en el DOM

### Problemas de disparo
- Revisa que la función `disparar()` reciba todos los parámetros
- Verifica que el arma tenga munición y no esté recargando

## 📝 Ejemplo Completo

Ver `ejemplo-armas.js` para un ejemplo completo de implementación.

## 🎯 Próximas Mejoras

- [ ] Modelos 3D específicos para cada arma
- [ ] Sonidos únicos por arma
- [ ] Efectos de partículas personalizados
- [ ] Sistema de attachments/modificaciones
- [ ] Armas automáticas vs semiautomáticas
- [ ] Diferentes tipos de munición
- [ ] **Miras personalizadas** (punto rojo, holográfica, ACOG)
- [ ] **Zoom variable** para francotiradores
- [ ] **Respiración del francotirador** (sway al apuntar)
- [ ] **Tiempo de apuntado** diferente por arma
- [ ] **Efectos de desenfoque** al apuntar
- [ ] **Mira láser** para algunas armas