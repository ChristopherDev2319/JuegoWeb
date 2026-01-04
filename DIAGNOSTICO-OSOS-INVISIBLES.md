# 🐻 DIAGNÓSTICO - Osos Invisibles

## 🔍 PROBLEMA ACTUAL
Los bots aparecen invisibles a pesar de tener mesh válido. Necesitamos diagnosticar paso a paso dónde está el problema.

## 🧪 ARCHIVOS DE TEST CREADOS

### 1. `test-oso-basico.html` - Test Fundamental
**Propósito:** Verificar si el modelo cubed_bear.glb se carga y es visible
**Qué hace:**
- Carga el modelo GLB directamente con GLTFLoader
- Aplica luces muy brillantes
- Muestra cubo rojo de referencia
- Diagnostica cada mesh del modelo

**Cómo usar:**
1. Abrir `http://localhost:3001/test-oso-basico.html`
2. Click "Cargar Oso"
3. Verificar si el oso es visible
4. Click "Verificar Modelo" para ver detalles

**Resultado esperado:** Deberías ver un oso marrón rotando junto al cubo rojo

### 2. `test-debug-simple.html` - Test Cache vs Directo
**Propósito:** Comparar carga directa vs sistema de cache
**Qué hace:**
- Test directo: Carga GLB con GLTFLoader
- Test cache: Usa el sistema de modeloCache.js

**Cómo usar:**
1. Abrir `http://localhost:3001/test-debug-simple.html`
2. Probar "Test Directo" primero
3. Probar "Test Cache" después
4. Comparar resultados

### 3. `test-bots-paso-a-paso.html` - Test Sistema Completo
**Propósito:** Probar todo el sistema paso a paso
**Qué hace:**
- Paso 1: Inicializa Three.js
- Paso 2: Precarga modelo
- Paso 3: Crea BotManager
- Paso 4: Inicializa bots
- Paso 5: Verifica que todos tengan mesh

**Cómo usar:**
1. Abrir `http://localhost:3001/test-bots-paso-a-paso.html`
2. Hacer click en cada paso en orden
3. Revisar logs para ver dónde falla

## 🔧 CAMBIOS REALIZADOS

### Sistema de Cache Mejorado (`src/sistemas/modeloCache.js`)
- ✅ Agregado logging detallado
- ✅ Clonación más agresiva de materiales
- ✅ Corrección de colores negros/transparentes
- ✅ Forzar opacidad y visibilidad

### BotBase con Debugging (`src/entidades/BotBase.js`)
- ✅ Logging detallado en crearMesh()
- ✅ Verificación de mesh y materiales
- ✅ Conteo de meshes hijos

## 🎯 PLAN DE DIAGNÓSTICO

### Paso 1: Verificar Modelo Base
```
http://localhost:3001/test-oso-basico.html
```
**Si el oso NO es visible aquí:**
- Problema con el archivo cubed_bear.glb
- Problema con materiales del modelo
- Problema con luces/cámara

**Si el oso SÍ es visible aquí:**
- El modelo está bien, problema en el sistema de cache o bots

### Paso 2: Verificar Sistema de Cache
```
http://localhost:3001/test-debug-simple.html
```
**Comparar:**
- ¿Test directo funciona?
- ¿Test cache funciona?
- ¿Hay diferencias?

### Paso 3: Verificar Sistema de Bots
```
http://localhost:3001/test-bots-paso-a-paso.html
```
**Revisar cada paso:**
- ¿Se precarga el modelo?
- ¿Se crean los bots?
- ¿Tienen mesh válido?
- ¿Son visibles?

## 🚨 POSIBLES CAUSAS

### 1. Problema con el Modelo GLB
- Materiales negros/transparentes
- Geometría corrupta
- Escala incorrecta

### 2. Problema con el Sistema de Cache
- Clonación incorrecta de materiales
- Referencias compartidas
- Configuración perdida

### 3. Problema con BotBase
- Posición incorrecta
- Escala incorrecta
- No agregado a la escena

### 4. Problema con Three.js
- Versión incompatible
- Luces insuficientes
- Cámara mal posicionada

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] ¿El modelo se ve en test-oso-basico.html?
- [ ] ¿El test directo funciona en test-debug-simple.html?
- [ ] ¿El test cache funciona en test-debug-simple.html?
- [ ] ¿Los bots se crean en test-bots-paso-a-paso.html?
- [ ] ¿Los bots tienen mesh !== null?
- [ ] ¿Los meshes tienen material válido?
- [ ] ¿Los materiales son visibles?
- [ ] ¿Las posiciones son correctas?

## 🔄 PRÓXIMOS PASOS

1. **Probar test-oso-basico.html** - Si falla aquí, el problema es fundamental
2. **Revisar consola del navegador** - Buscar errores específicos
3. **Comparar test directo vs cache** - Identificar dónde se rompe
4. **Verificar paso a paso** - Encontrar el punto exacto de falla

Una vez que identifiques en qué test falla, podremos enfocar la solución específica.