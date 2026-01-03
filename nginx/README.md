# Configuración Nginx para BearStrike

## Estructura de Puertos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| WebSocket Game | 3000 | Servidor multiplayer (cluster) |
| Backend API | 3001 | Express (auth, progreso) |
| Cluster Status | 3002 | Métricas del cluster (cambiar en statusEndpoint.js) |

## Instalación

### 1. Copiar configuración
```bash
sudo cp nginx/bearstrike.conf /etc/nginx/sites-available/bearstrike.conf
sudo ln -s /etc/nginx/sites-available/bearstrike.conf /etc/nginx/sites-enabled/
```

### 2. Crear directorio del proyecto
```bash
sudo mkdir -p /var/www/bearstrike
sudo cp -r index.html css/ src/ modelos/ sonidos/ /var/www/bearstrike/
```

### 3. Obtener certificados SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d bearstrike.com.mx -d www.bearstrike.com.mx
```

### 4. Verificar y reiniciar Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Notas Importantes

- El puerto del Cluster Status está configurado en `3002` para evitar conflicto con el Backend API (3001)
- Actualizar `server/cluster/statusEndpoint.js` para usar puerto 3002:
  ```javascript
  const STATUS_PORT = parseInt(process.env.CLUSTER_STATUS_PORT) || 3002;
  ```

- Ajustar `root` en la configuración si tu proyecto está en otra ruta
