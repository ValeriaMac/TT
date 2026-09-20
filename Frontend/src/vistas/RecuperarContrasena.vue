<template>
  <div class="contenedor-auth">
    <h1>Recuperar contraseña</h1>
    <p class="descripcion">
      Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
    </p>

    <form @submit.prevent="manejarEnvio">
      <label for="correo">Correo electrónico</label>
      <input id="correo" v-model="correo" type="email" required />

      <p v-if="mensaje" class="mensaje">{{ mensaje }}</p>

      <button type="submit" :disabled="enviando">
        {{ enviando ? 'Enviando...' : 'Enviar enlace' }}
      </button>
    </form>

    <router-link to="/login">← Volver al inicio de sesión</router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../servicios/api';

const correo = ref('');
const enviando = ref(false);
const mensaje = ref('');

async function manejarEnvio() {
  enviando.value = true;
  mensaje.value = '';

  try {
    // Este endpoint aún no está confirmado que exista en el backend
    // — ajustar la ruta si es distinta
    await api.post('/auth/recuperar', { correo: correo.value });
    mensaje.value = 'Si el correo existe, te llegará un enlace en unos minutos.';
  } catch (error) {
    mensaje.value = 'Ocurrió un error al enviar el enlace. Intenta de nuevo.';
  } finally {
    enviando.value = false;
  }
}
</script>

<style scoped>
.contenedor-auth {
  max-width: 420px;
  margin: 3rem auto;
  padding: 2rem;
  font-family: system-ui, sans-serif;
}

.contenedor-auth h1 {
  margin-bottom: 0.5rem;
  font-size: 1.75rem;
}

.descripcion {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.contenedor-auth form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contenedor-auth label {
  font-weight: 600;
  margin-bottom: 0.25rem;
  display: block;
}

.contenedor-auth input[type="email"] {
  width: 100%;
  padding: 0.65rem;
  font-size: 1rem;
  border: 2px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
}

.contenedor-auth input:focus {
  outline: 3px solid #4a90d9;
  border-color: #4a90d9;
}

.contenedor-auth button {
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  background-color: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.contenedor-auth button:hover:not(:disabled) {
  background-color: #3a7bc0;
}

.contenedor-auth button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}

.contenedor-auth .mensaje {
  color: #2c7a4b;
  background-color: #eafaf0;
  padding: 0.6rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.contenedor-auth a {
  display: block;
  margin-top: 1rem;
  text-align: center;
  color: #4a90d9;
}
</style>