# 🚀 Despliegue Rápido - HR Co-pilot

## ✅ OPCIÓN RECOMENDADA: Vercel + Render (100% GRATIS y SEGURO)

### 🎯 Resumen
- ✨ **Gratis para siempre**
- 🔒 **Muy seguro** (no expone tu red WiFi)
- 🌍 **Acceso desde cualquier lugar**
- ⚡ **Rápido** (servidores globales)

---

## 📝 PASO A PASO

### 1️⃣ Subir código a GitHub (5 minutos)

```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "Initial commit"

# Crear repositorio en github.com y luego:
git remote add origin https://github.com/TU-USUARIO/hr-copilot.git
git push -u origin main
```

---

### 2️⃣ Desplegar Backend en Render (5 minutos)

1. **Ir a**: https://render.com
2. **Sign Up** (gratis con email o GitHub)
3. Click **"New +"** → **"Web Service"**
4. Conectar tu repositorio de GitHub
5. **Configuración**:
   - Name: `hr-copilot-api`
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Plan: **Free**

6. **Environment Variables** (click "Advanced"):
   ```
   PORT=5000
   MONGODB_URI=tu_mongodb_connection_string
   JWT_SECRET=tu_secreto_para_jwt
   EMAIL_USER=tu_email@gmail.com
   EMAIL_PASS=tu_app_password_de_google
   FRONTEND_URL=*
   ```

7. Click **"Create Web Service"**
8. **Espera 2-3 minutos** ⏳
9. **Copia la URL** (ej: `https://hr-copilot-api.onrender.com`)

---

### 3️⃣ Desplegar Frontend en Vercel (3 minutos)

1. **Ir a**: https://vercel.com
2. **Sign Up** con GitHub (gratis)
3. Click **"Add New..."** → **"Project"**
4. Selecciona tu repositorio `hr-copilot`
5. **Configuración**:
   - Framework: Vite (auto-detectado)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

6. **Environment Variables**:
   ```
   VITE_API_URL=https://hr-copilot-api.onrender.com/api
   ```
   *(Reemplaza con TU URL de Render del paso 2)*

7. Click **"Deploy"**
8. **Espera 1-2 minutos** ⏳
9. **¡Listo!** Tu app estará en `https://tu-app.vercel.app`

---

## 🎉 ¡YA ESTÁ!

Ahora puedes acceder desde cualquier dispositivo:
- **URL**: La que te dio Vercel (ej: `https://hr-copilot-xyz.vercel.app`)
- **Login**: `sofiabriso@metricool.com` / `123`

---

## 🔄 Para Actualizar

Cada vez que hagas cambios:
```bash
git add .
git commit -m "Descripción del cambio"
git push
```

Vercel y Render se actualizan **automáticamente** ✨

---

## ⚠️ Problemas Comunes

### Backend no arranca en Render
- Revisa los **Logs** en Render
- Verifica que las variables de entorno estén correctas
- Asegúrate de que `Start Command` sea `node index.js`

### Frontend no conecta con Backend
- Verifica que `VITE_API_URL` tenga la URL correcta de Render
- Debe terminar en `/api`
- Ejemplo: `https://hr-copilot-api.onrender.com/api`

### Error de CORS
- En Render, asegúrate de que `FRONTEND_URL` sea `*` o la URL exacta de Vercel

---

## 💡 Alternativa: Ngrok (Solo para pruebas rápidas)

Si solo quieres probar acceso desde internet **temporalmente**:

```bash
# Instalar
npm install -g ngrok

# En una terminal (backend)
ngrok http 5000

# En otra terminal (frontend)  
ngrok http 5173
```

⚠️ **Limitaciones**:
- URL cambia cada vez que reinicias
- Versión gratis tiene límites
- No es para producción

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs en Render/Vercel
2. Verifica que las URLs estén correctas
3. Asegúrate de que MongoDB Atlas permite conexiones desde cualquier IP (0.0.0.0/0)
