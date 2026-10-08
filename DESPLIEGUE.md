# Guía de despliegue

Backend en **Render**, frontend en **Vercel**, base de datos en **Supabase** e imágenes en **Cloudinary**.

## 0. Antes de todo: seguridad
El archivo `Backend/.env` se subió a GitHub con valores reales. Hay que:
1. Regenerar: secreto de Cloudinary, contraseña de aplicación de Gmail, llaves de Supabase y `JWT_SECRET`.
2. Dejar de rastrear el archivo: `git rm --cached Backend/.env` y hacer commit.
3. Usar `Backend/.env.example` como plantilla (solo tiene placeholders).

## 1. Base de datos (Supabase)
Ejecutar en el SQL Editor, en orden: `Database/esquema.sql` y luego las migraciones de mascotas
(`1_esquema_mascotas.sql` a `4_migracion_mascota_activa.sql`). Verificar que `banco_preguntas`
tenga contenido para los 5 ejercicios.

## 2. Backend (Render, Web Service)
- Root Directory: `Backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`
- Variables de entorno: todas las de `Backend/.env.example`, con `NODE_ENV=production`
  y `FRONTEND_URL` = la URL de Vercel (sin `/` al final).

## 3. Frontend (Vercel)
- Root Directory: `Frontend`
- Framework: Vite (build `npm run build`, salida `dist`)
- Variable: `VITE_API_URL` = `https://TU-BACKEND.onrender.com/api`
- `vercel.json` ya incluye la regla para que recargar rutas como `/login` no dé 404.

## 4. Orden
Primero Render (para obtener su URL), luego Vercel con `VITE_API_URL`, y al final volver a Render
a poner `FRONTEND_URL` con la URL de Vercel.

## 5. Pruebas después de desplegar
- [ ] Abrir la página principal y recargar en `/login`
- [ ] Registrarse y recibir el correo de verificación
- [ ] Probar un registro de menor de edad (correo al tutor)
- [ ] Iniciar sesión, cambiar la configuración visual, guardar una plantilla
- [ ] Subir un EPUB (máx. 5 MB) y usar la lectura con voz
- [ ] Jugar una ronda de cada ejercicio y ver puntos/progreso
- [ ] Cortar el internet en una ronda y comprobar la sincronización al reconectar

Nota: el plan gratuito de Render duerme el servicio tras un rato sin uso; la primera petición
puede tardar 30-50 segundos. Abrir la app unos minutos antes de una demostración.
