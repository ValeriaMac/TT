<template>
  <div class="pagina-auth">
    <div class="contenedor-auth">
      <h1 class="logo">lex</h1>
      <h2>Iniciar sesión</h2>

      <form @submit.prevent="manejarLogin">
        <label for="correo">Correo electrónico</label>
        <input id="correo" v-model="correo" type="email" placeholder="x@correo.com" required />

        <label for="contrasena">Contraseña</label>
        <input id="contrasena" v-model="contrasena" type="password" required />

        <router-link to="/recuperar" class="enlace-olvidaste">¿Olvidaste tu contraseña?</router-link>

        <p v-if="mensajeError" class="error">{{ mensajeError }}</p>

        <button type="submit" :disabled="cargando">
          {{ cargando ? 'Entrando...' : 'Iniciar sesión' }}
        </button>
      </form>

      <router-link to="/registro">¿No tienes cuenta? Regístrate</router-link>
    </div>
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
    router.push('/inicio');
  } catch (error) {
    mensajeError.value = error.response?.data?.mensaje || 'Correo o contraseña incorrectos';
  } finally {
    cargando.value = false;
  }
}
</script>

<style scoped>
.pagina-auth {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 85vh;
  padding: 1rem;
}

.contenedor-auth {
  background: var(--color-tarjeta);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-tarjeta);
  max-width: 380px;
  width: 100%;
  padding: 2rem;
  text-align: center;
}

.contenedor-auth .logo {
  color: var(--color-primario);
  font-size: 2rem;
  margin-bottom: 0.3rem;
}

.contenedor-auth h2 {
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.contenedor-auth form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
}

.contenedor-auth label {
  font-weight: 600;
  margin-bottom: 0.25rem;
  display: block;
  font-size: 0.9rem;
}

.contenedor-auth input[type="email"],
.contenedor-auth input[type="password"] {
  width: 100%;
  padding: 0.65rem;
  font-size: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  box-sizing: border-box;
}

.contenedor-auth input:focus {
  outline: 2px solid var(--color-primario);
  border-color: var(--color-primario);
}

.enlace-olvidaste {
  align-self: flex-end;
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
  text-decoration: none;
  margin-top: -0.5rem;
}

.contenedor-auth button {
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: var(--radio-boton);
  cursor: pointer;
  margin-top: 0.5rem;
}

.contenedor-auth button:hover:not(:disabled) {
  background-color: var(--color-primario-hover);
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

.contenedor-auth > a {
  display: block;
  margin-top: 1.2rem;
  text-align: center;
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  text-decoration: none;
}
</style>