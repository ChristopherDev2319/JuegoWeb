# 🤖 GUÍA COMPLETA: MODIFICAR BOTS

## 🎨 1. CAMBIAR SKINS DE LOS BOTS

### **Dificultad: ⭐⭐☆☆☆ (Fácil - 15 minutos)**

**Ubicación:** `src/entidades/BotBase.js` - método `crearMesh()`

**ANTES (cubo simple):**
```javascript
crearMesh(x, y, z) {
  const geometria = new THREE.BoxGeometry(1.5, 2, 1.5);
  const material = new THREE.MeshStandardMaterial({ color: this.color });
  this.mesh = new THREE.Mesh(geometria, material);
  // ...
}
```

**DESPUÉS (modelo personalizado):**
```javascript
crearMesh(x, y, z) {
  // Cargar modelo específico según tipo de bot
  const modeloPorTipo = {
    'estatico': '/modelos/bot_soldier.glb',
    'movil': '/modelos/bot_scout.glb', 
    'tirador': '/modelos/bot_sniper.glb'
  };
  
  const loader = new THREE.GLTFLoader();
  loader.load(modeloPorTipo[this.tipo] || '/modelos/cubed_bear.glb', (gltf) => {
    this.mesh = gltf.scene.clone();
    this.mesh.scale.set(2, 2, 2);
    this.mesh.position.set(x, y, z);
    
    // Aplicar color distintivo por tipo
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.setHex(this.color);
      }
    });
    
    this.scene.add(this.mesh);
    this.crearBarraVida(); // Crear barra después del modelo
  });
}
```

### **Modelos Recomendados:**
- **Soldado básico:** Para bots estáticos
- **Scout/Explorador:** Para bots móviles  
- **Francotirador:** Para bots tiradores
- **Diferentes uniformes:** Enemigos vs aliados

---

## 🎯 2. MEJORAR COMPORTAMIENTO DE DISPARO

### **Dificultad: ⭐⭐⭐☆☆ (Medio - 30 minutos)**

**Los BotTirador YA PUEDEN DISPARAR**, pero se puede mejorar:

### **A. Hacer Disparos Más Realistas:**

**En `BotTirador.js` - método `disparar()`:**
```javascript
disparar(jugadorPos) {
  // Crear bala física en lugar de solo efecto visual
  const bala = new Bala(
    this.scene,
    this.mesh.position.clone(),
    direccion,
    'bot', // Identificar como disparo de bot
    {
      velocidad: 25,
      daño: this.dañoReducido,
      color: 0xff4444 // Balas rojas para bots
    }
  );
  
  // Añadir a array de balas del juego
  if (window.balasGlobales) {
    window.balasGlobales.push(bala);
  }
}
```

### **B. Diferentes Tipos de Disparo:**
```javascript
// En constructor de cada tipo de bot
switch(this.tipo) {
  case 'tirador':
    this.tipoDisparo = 'precision'; // Disparo único preciso
    this.cadenciaDisparo = 2000;
    break;
  case 'ametrallador':
    this.tipoDisparo = 'rafaga'; // Ráfagas de 3-5 balas
    this.cadenciaDisparo = 100;
    break;
  case 'escopetero':
    this.tipoDisparo = 'escopeta'; // Múltiples proyectiles
    this.proyectilesPorDisparo = 8;
    break;
}
```

---

## 🧠 3. INTELIGENCIA ARTIFICIAL AVANZADA

### **Dificultad: ⭐⭐⭐⭐☆ (Difícil - 2 horas)**

### **A. Estados de Comportamiento:**
```javascript
class BotInteligente extends BotBase {
  constructor(scene, config, x, y, z) {
    super(scene, config, x, y, z);
    
    this.estado = 'patrullando'; // patrullando, persiguiendo, atacando, buscando
    this.puntosPatrulla = this.generarPuntosPatrulla();
    this.puntoActual = 0;
    this.ultimaPosicionJugador = null;
    this.tiempoSinVerJugador = 0;
  }
  
  actualizar(deltaTime, jugadorPos) {
    switch(this.estado) {
      case 'patrullando':
        this.patrullar(deltaTime);
        if (this.puedeVerJugador(jugadorPos)) {
          this.estado = 'persiguiendo';
        }
        break;
        
      case 'persiguiendo':
        this.perseguirJugador(jugadorPos);
        if (this.enRangoDisparo(jugadorPos)) {
          this.estado = 'atacando';
        }
        break;
        
      case 'atacando':
        this.atacarJugador(jugadorPos);
        if (!this.puedeVerJugador(jugadorPos)) {
          this.estado = 'buscando';
          this.ultimaPosicionJugador = jugadorPos.clone();
        }
        break;
        
      case 'buscando':
        this.buscarEnUltimaPosicion();
        break;
    }
  }
}
```

### **B. Pathfinding (Navegación Inteligente):**
```javascript
// Usar A* o navegación por waypoints
encontrarCaminoHacia(destino) {
  // Implementar algoritmo de pathfinding
  // Evitar obstáculos, encontrar ruta óptima
}

moverseHacia(destino, deltaTime) {
  const direccion = destino.clone().sub(this.mesh.position).normalize();
  const velocidad = this.velocidadMovimiento * deltaTime;
  this.mesh.position.add(direccion.multiplyScalar(velocidad));
}
```

---

## 🎮 4. TIPOS DE BOTS ESPECIALIZADOS

### **Dificultad: ⭐⭐⭐☆☆ (Medio - 1 hora)**

### **A. Bot Francotirador:**
```javascript
class BotFrancotirador extends BotTirador {
  constructor(scene, x, y, z) {
    super(scene, x, y, z);
    this.rangoVision = 50; // Rango muy largo
    this.cadenciaDisparo = 3000; // Disparo lento pero letal
    this.dañoReducido = 75; // Mucho daño
    this.precision = 0.95; // Muy preciso
  }
  
  disparar(jugadorPos) {
    // Tiempo de apuntado antes de disparar
    this.tiempoApuntando += deltaTime;
    if (this.tiempoApuntando > 1000) { // 1 segundo apuntando
      super.disparar(jugadorPos);
      this.tiempoApuntando = 0;
    }
  }
}
```

### **B. Bot Rusher (Agresivo):**
```javascript
class BotRusher extends BotMovil {
  constructor(scene, x, y, z) {
    super(scene, x, y, z);
    this.velocidad = 5; // Muy rápido
    this.vida = 75; // Menos vida pero más agresivo
  }
  
  actualizar(deltaTime, jugadorPos) {
    if (jugadorPos) {
      // Correr directamente hacia el jugador
      this.moverseHacia(jugadorPos, deltaTime);
      
      // Disparar mientras corre
      if (this.distanciaAJugador(jugadorPos) < 15) {
        this.disparar(jugadorPos);
      }
    }
  }
}
```

---

## 🔧 5. IMPLEMENTACIÓN PASO A PASO

### **Paso 1: Skins Básicas (15 min)**
1. Modificar `BotBase.crearMesh()`
2. Añadir modelos GLB específicos por tipo
3. Probar con `http://localhost:3001/test-bots-skin.html`

### **Paso 2: Mejorar Disparos (30 min)**
1. Modificar `BotTirador.disparar()`
2. Crear balas físicas en lugar de solo efectos
3. Añadir diferentes tipos de munición

### **Paso 3: Estados de IA (1 hora)**
1. Crear clase `BotInteligente`
2. Implementar máquina de estados
3. Añadir comportamientos de patrulla y búsqueda

### **Paso 4: Tipos Especializados (1 hora)**
1. Crear subclases especializadas
2. Configurar parámetros únicos
3. Probar balance de juego

---

## 📊 CONFIGURACIÓN RECOMENDADA

### **Para Juego Balanceado:**
```javascript
// En config.js
botsEnemigos: {
  francotirador: {
    vida: 100,
    daño: 75,
    cadencia: 3000,
    rango: 50,
    precision: 0.95,
    cantidad: 1
  },
  soldado: {
    vida: 100, 
    daño: 25,
    cadencia: 600,
    rango: 25,
    precision: 0.7,
    cantidad: 3
  },
  rusher: {
    vida: 75,
    daño: 20,
    cadencia: 400,
    rango: 15,
    velocidad: 5,
    cantidad: 2
  }
}
```

---

## 🎯 RESULTADO FINAL

Con estas modificaciones tendrás:

- ✅ **Bots con skins personalizadas** (soldados, scouts, snipers)
- ✅ **Disparos realistas** con balas físicas
- ✅ **IA inteligente** con estados y comportamientos
- ✅ **Tipos especializados** (francotirador, rusher, soldado)
- ✅ **Navegación avanzada** evitando obstáculos
- ✅ **Balance de juego** configurable

**¡Los bots pasarán de ser objetivos de práctica a enemigos desafiantes!** 🎮