<!-- vistas/AvisoPrivacidad.vue -->
<!-- Página pública (no requiere sesión). Se enlaza desde el registro. -->
<template>
  <div class="pagina-aviso">
    <article class="tarjeta-aviso">
      <router-link :to="volverA" class="enlace-volver">← Volver</router-link>

      <h1>Aviso de privacidad</h1>
      <p class="fecha">Última actualización: {{ FECHA_ACTUALIZACION }}</p>

      <h2>1. ¿Quién es el responsable de tus datos?</h2>
      <p>
        La aplicación es un proyecto de Trabajo Terminal (TT 2026-B002) de la Escuela Superior de
        Cómputo (ESCOM) del Instituto Politécnico Nacional. La responsable del tratamiento de tus
        datos personales es Valeria Odette Mac Comish Sánchez. Para cualquier duda puedes escribir a:
        <strong>{{ CORREO_CONTACTO }}</strong>.
      </p>

      <h2>2. ¿Qué datos recopilamos?</h2>
      <ul>
        <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y contraseña (se guarda cifrada, nunca en texto plano).</li>
        <li><strong>Fecha de nacimiento:</strong> para saber si eres menor de edad.</li>
        <li><strong>Correo de un padre o tutor:</strong> solo si eres menor de edad.</li>
        <li><strong>Contenido que creas o subes:</strong> los documentos que escribes y los libros (EPUB) que subes.</li>
        <li><strong>Uso de la aplicación:</strong> resultados y puntos de los ejercicios, avance de lectura, insignias, mascotas y accesorios.</li>
        <li><strong>Preferencias:</strong> configuración visual (tipo de letra, colores, espaciado) y tema claro u oscuro.</li>
      </ul>
      <p>
        <strong>No te pedimos ningún diagnóstico médico</strong> ni datos de salud, ni tampoco
        datos bancarios.
      </p>

      <h2>3. ¿Para qué usamos tus datos?</h2>
      <ul>
        <li>Crear tu cuenta, verificar tu correo y permitirte iniciar sesión.</li>
        <li>Guardar tus documentos, tu progreso y tu personalización visual.</li>
        <li>Calcular tus puntos, insignias y recompensas.</li>
        <li>Pedir la autorización de un padre o tutor cuando eres menor de edad.</li>
        <li>Enviarte correos necesarios del servicio (verificación y recuperación de contraseña).</li>
        <li>Fines académicos del proyecto, siempre con datos sin tu nombre (estadísticas generales).</li>
      </ul>
      <p>No usamos tus datos para publicidad ni los vendemos.</p>

      <h2>4. Menores de edad</h2>
      <p>
        Si eres menor de edad, necesitamos el correo de un padre o tutor. Le enviamos un mensaje
        para que autorice el uso de la cuenta. Mientras no lo confirme, no puedes iniciar sesión.
      </p>

      <h2>5. ¿Con quién compartimos tus datos?</h2>
      <p>
        No los compartimos con terceros para otros fines. Solo usamos proveedores que guardan o
        procesan la información para que la aplicación funcione:
      </p>
      <ul>
        <li><strong>Supabase:</strong> base de datos.</li>
        <li><strong>Cloudinary:</strong> imágenes (mascotas, accesorios y archivos).</li>
        <li><strong>Brevo:</strong> envío de correos.</li>
        <li><strong>Vercel y Render:</strong> alojamiento de la aplicación.</li>
      </ul>
      <p>Algunos de estos servicios pueden almacenar la información en servidores fuera de México.</p>

      <h2>6. Almacenamiento en tu dispositivo</h2>
      <p>
        La aplicación guarda en tu navegador (localStorage) tu sesión, el tema claro u oscuro,
        el contador de intentos de los ejercicios y los resultados pendientes de enviar cuando no
        hay internet. No usamos cookies de publicidad ni de seguimiento.
      </p>

      <h2>7. Tus derechos (ARCO)</h2>
      <p>
        Tienes derecho a <strong>Acceder</strong> a tus datos, <strong>Rectificarlos</strong> si
        están mal, <strong>Cancelarlos</strong> (pedir que se eliminen) y
        <strong>Oponerte</strong> a su uso. También puedes retirar tu consentimiento. Para
        ejercerlos, escribe a {{ CORREO_CONTACTO }} indicando tu nombre, el correo con el que te
        registraste y qué derecho quieres ejercer. Responderemos en un máximo de 20 días hábiles.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Usamos conexión cifrada (HTTPS), guardamos las contraseñas cifradas y limitamos el acceso
        a la base de datos. Aun así, ningún sistema es 100 % seguro.
      </p>

      <h2>9. Cambios a este aviso</h2>
      <p>
        Si este aviso cambia, publicaremos la nueva versión en esta misma página con su fecha de
        actualización.
      </p>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// Cambia estos dos datos antes de entregar el proyecto
const CORREO_CONTACTO = 'lexapp.notificaciones@gmail.com'
const FECHA_ACTUALIZACION = '26 de octubre de 2026'

// Si venías del registro, "Volver" te regresa ahí; si no, a la página principal
const route = useRoute()
const volverA = computed(() => (route.query.desde === 'registro' ? '/registro' : '/'))
</script>

<style scoped>
.pagina-aviso {
  min-height: 100vh;
  padding: 1.5rem 1rem;
  background: var(--color-fondo, #f5f5f0);
}
.tarjeta-aviso {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem 1.8rem;
  background: var(--color-tarjeta, #fff);
  color: var(--color-texto-principal, #3a3a2c);
  border-radius: var(--radio-tarjeta, 16px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  line-height: 1.7;
}
.enlace-volver {
  display: inline-block;
  margin-bottom: 0.8rem;
  color: var(--color-primario, #5c7a3f);
  text-decoration: none;
  font-weight: 600;
}
h1 { margin: 0 0 0.2rem; font-size: 1.7rem; }
h2 { margin: 1.5rem 0 0.4rem; font-size: 1.1rem; color: var(--color-primario, #5c7a3f); }
.fecha { margin: 0; font-size: 0.85rem; color: var(--color-texto-secundario, #7a7a6a); }
ul { padding-left: 1.3rem; margin: 0.4rem 0; }
li { margin-bottom: 0.3rem; }
p { margin: 0.4rem 0; }
</style>
