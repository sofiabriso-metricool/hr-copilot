# 🚀 HR Co-pilot - Guía de Despliegue

## 📋 Despliegue en la Nube (GRATIS)

### 1️⃣ **Backend en Render** (API + Base de Datos)

#### Paso 1: Crear cuenta en Render
1. Ve a [render.com](https://render.com)
2. Regístrate con tu email o GitHub (gratis)

#### Paso 2: Crear Web Service
1. Click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub (o sube el código)
3. Configuración:
   - **Name**: `hr-copilot-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: **Free**

#### Paso 3: Variables de Entorno
En la sección **Environment**, añade:

```
PORT=5000
MONGODB_URI=tu_mongodb_connection_string
JWT_SECRET=tu_secreto_para_jwt
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_de_google
FRONTEND_URL=https://tu-app.vercel.app
```

#### Paso 4: Desplegar
- Click en **"Create Web Service"**
- Espera 2-3 minutos
- Copia la URL que te dan (ej: `https://hr-copilot-api.onrender.com`)

---

### 2️⃣ **Frontend en Vercel** (Aplicación Web)

#### Paso 1: Crear cuenta en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Regístrate con GitHub (gratis)

#### Paso 2: Importar Proyecto
1. Click en **"Add New..."** → **"Project"**
2. Importa tu repositorio
3. Configuración:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### Paso 3: Variables de Entorno
En **Environment Variables**, añade:

```
VITE_API_URL=https://hr-copilot-api.onrender.com/api
```
*(Reemplaza con la URL de tu backend de Render)*

#### Paso 4: Desplegar
- Click en **"Deploy"**
- Espera 1-2 minutos
- ¡Listo! Tu app estará en `https://tu-app.vercel.app`

---

## 🔒 Seguridad

✅ **Totalmente seguro**:
- No expone tu red local
- No requiere abrir puertos en tu router
- Datos encriptados en tránsito (HTTPS)
- MongoDB Atlas ya está en la nube
- Contraseñas en variables de entorno (no en el código)

---

## 🌍 Acceso

Una vez desplegado:
- **URL Pública**: `https://tu-app.vercel.app`
- **Accesible desde**: Cualquier dispositivo con internet
- **Login**: `sofiabriso@metricool.com` / `123`

---

## 🔄 Actualizaciones

Para actualizar la app:
1. Haz cambios en tu código local
2. Sube a GitHub: `git push`
3. Vercel y Render se actualizan automáticamente ✨

---

## 💡 Alternativa Rápida: Ngrok (Temporal)

Si solo necesitas acceso temporal (para pruebas):

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer backend
ngrok http 5000

# Exponer frontend
ngrok http 5173
```

⚠️ **Nota**: Ngrok es temporal y la URL cambia cada vez que lo reinicias.

---

## 📞 Soporte

Si tienes problemas, revisa:
- Logs en Render (pestaña "Logs")
- Logs en Vercel (pestaña "Deployments")
- Que las variables de entorno estén correctas
