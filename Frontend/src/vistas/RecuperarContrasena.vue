<template>
  <div class="pagina-degradada">
    <div class="tarjeta-auth">

      <!-- Estado 1: formulario para pedir el correo -->
      <div v-if="!enviado">
        <div class="encabezado-auth">
          <h1 class="logo">lex</h1>
          <h2>Recuperar contraseña</h2>
          <p class="descripcion">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <form @submit.prevent="manejarEnvio" class="formulario-auth">
          <div class="campo">
            <label for="correo">Correo electrónico</label>
            <input id="correo" v-model="correo" type="email" placeholder="tu@email.com" required />
          </div>

          <p v-if="mensajeError" class="mensaje-error">{{ mensajeError }}</p>

          <button type="submit" class="btn-primario" :disabled="enviando">
            {{ enviando ? 'Enviando...' : 'Enviar enlace' }}
          </button>
        </form>

        <router-link to="/login" class="enlace-volver">← Volver al inicio de sesión</router-link>
      </div>

      <!-- Estado 2: confirmación tras enviar el correo -->
      <div v-else class="estado-confirmacion">
        <div class="icono-correo">✉️</div>
        <h2>¡Revisa tu correo!</h2>
        <p class="descripcion">Enviamos un enlace de recuperación a:</p>
        <p class="correo-destacado">{{ correo }}</p>
        <p class="nota-spam">Si no ves el correo, revisa tu carpeta de spam</p>

        <button class="btn-secundario" @click="enviado = false">Usar otro correo</button>

        <router-link to="/login" class="enlace-volver">← Volver al inicio de sesión</router-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../servicios/api';

const correo = ref('');
const enviando = ref(false);
const enviado = ref(false);
const mensajeError = ref('');

async function manejarEnvio() {
  enviando.value = true;
  mensajeError.value = '';

  try {
    // Este endpoint aún no está confirmado que exista en el backend
    // — ajustar la ruta si es distinta
    await api.post('/auth/recuperar', { correo: correo.value });
    enviado.value = true;
  } catch (error) {
    mensajeError.value = 'No encontramos una cuenta con ese correo';
  } finally {
    enviando.value = false;
  }
}
</script>

<style scoped>
.pagina-degradada {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(to bottom right, #f8f9f5, #e8edd9, #d4e0b8);
}

.tarjeta-auth {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
}

.encabezado-auth {
  text-align: center;
  margin-bottom: 2rem;
}

.encabezado-auth .logo {
  font-family: var(--fuente-encabezados);
  color: var(--color-primario);
  font-size: 2.5rem;
  margin-bottom: 0.25rem;
}

.encabezado-auth h2 {
  font-family: var(--fuente-encabezados);
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.descripcion {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  line-height: 1.5;
}

.formulario-auth {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.campo label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.campo input {
  width: 100%;
  height: 48px;
  padding: 0 1rem;
  font-size: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  box-sizing: border-box;
}

.campo input:focus {
  outline: 2px solid var(--color-primario);
  border-color: var(--color-primario);
}

.mensaje-error {
  color: #c0392b;
  background-color: #fdecea;
  padding: 0.7rem;
  border-radius: 10px;
  font-size: 0.9rem;
}

.btn-primario {
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
}

.btn-primario:hover:not(:disabled) {
  background-color: var(--color-primario-hover);
}

.btn-primario:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secundario {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  background: white;
  color: var(--color-texto-principal);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 1rem;
}

.btn-secundario:hover {
  background: #f5f5f0;
}

.enlace-volver {
  display: block;
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: var(--color-texto-secundario);
  text-decoration: none;
}

.enlace-volver:hover {
  color: var(--color-primario);
}

.estado-confirmacion {
  text-align: center;
}

.icono-correo {
  font-size: 3rem;
  background: #f0f4e8;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.estado-confirmacion h2 {
  font-family: var(--fuente-encabezados);
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.correo-destacado {
  color: var(--color-primario);
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.nota-spam {
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
  margin-bottom: 2rem;
}
</style>