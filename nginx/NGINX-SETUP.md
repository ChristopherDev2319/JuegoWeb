# Configuración Nginx para BearStrike

## Archivos incluidos

- `bearstrike.conf` - Configuración completa standalone
- `sites-available/bearstrike.com.mx` - Configuración para sites-available/sites-enabled

## Instalación rápida

### 1. Copiar configuración

```bash
# Opción A: Usar sites-available (recomendado)
sudo cp nginx/sites-available/bearstrike.com.mx /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/bearstrike.com.mx /etc/nginx/sites-enabled/

# Opción B: Usar conf.d
sudo cp nginx/bearstrike.conf /etc/nginx/conf.d/
```

### 2. Crear directorios necesarios

```bash
sudo mkdir -p /var/www/bearstrike
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/bearstrike
```

### 3. Obtener certificados SSL (Let's Encrypt)

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificados
sudo certbot certonly --webroot -w /var/www/certbot \
  -d bearstrike.com.mx \
  -d www.bearstrike.com.mx
```

### 4. Verificar y reiniciar Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Puertos utilizados

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Game Server | 3000 | WebSocket para el juego |
| API Server | 3001 | Backend REST API |
| Web Server | 8080 | Archivos estáticos |

## Iniciar servicios con PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar servicios
pm2 start server/index.js --name bearstrike-game
pm2 start backend/server.js --name bearstrike-api
pm2 start servidor-local.js --name bearstrike-web

# Guardar configuración
pm2 save
pm2 startup
```

## Renovación automática de SSL

```bash
# Agregar cron job
sudo crontab -e

# Agregar línea:
0 0 1 * * certbot renew --quiet && systemctl reload nginx
```
