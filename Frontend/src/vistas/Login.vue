<template>
  <div class="contenedor-auth">
    <h1>Iniciar sesión</h1>

    <form @submit.prevent="manejarLogin">
      <label for="correo">Correo electrónico</label>
      <input id="correo" v-model="correo" type="email" required />

      <label for="contrasena">Contraseña</label>
      <input id="contrasena" v-model="contrasena" type="password" required />

      <p v-if="mensajeError" class="error">{{ mensajeError }}</p>

      <button type="submit" :disabled="cargando">
        {{ cargando ? 'Entrando...' : 'Iniciar sesión' }}
      </button>
    </form>

    <router-link to="/registro">¿No tienes cuenta? Créala aquí</router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const correo = ref('');
const contrasena = ref('');
const cargando = ref(false);
const mensajeError = ref('');

async function manejarLogin() {
  mensajeError.value = '';
  cargando.value = true;
  try {
    await authStore.iniciarSesion(correo.value, contrasena.value);
    router.push('/');
  } catch (error) {
    mensajeError.value = error.response?.data?.mensaje || 'Correo o contraseña incorrectos';
  } finally {
    cargando.value = false;
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
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
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

.contenedor-auth input[type="text"],
.contenedor-auth input[type="email"],
.contenedor-auth input[type="password"],
.contenedor-auth input[type="date"] {
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

.contenedor-auth small {
  color: #666;
  font-size: 0.85rem;
}

.contenedor-auth .checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
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

.contenedor-auth .error {
  color: #c0392b;
  background-color: #fdecea;
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