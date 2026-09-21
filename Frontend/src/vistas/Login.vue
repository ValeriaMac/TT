<template>
  <div class="pagina-degradada">
    <div class="tarjeta-auth">
      <div class="encabezado-auth">
        <h1 class="logo">lex</h1>
        <h2>Iniciar sesión</h2>
      </div>

      <form @submit.prevent="manejarLogin" class="formulario-auth">
        <div class="campo">
          <label for="correo">Correo electrónico</label>
          <input id="correo" v-model="correo" type="email" placeholder="tu@email.com" required />
        </div>

        <div class="campo">
          <label for="contrasena">Contraseña</label>
          <input id="contrasena" v-model="contrasena" type="password" placeholder="Tu contraseña" required />
        </div>

        <router-link to="/recuperar" class="enlace-olvidaste">¿Olvidaste tu contraseña?</router-link>

        <p v-if="mensajeError" class="mensaje-error">{{ mensajeError }}</p>

        <button type="submit" class="btn-primario" :disabled="cargando">
          {{ cargando ? 'Entrando...' : 'Iniciar sesión' }}
        </button>
      </form>

      <p class="pie-auth">
        ¿No tienes cuenta?
        <router-link to="/registro">Regístrate</router-link>
      </p>
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
/* Estas clases (.pagina-degradada, .tarjeta-auth, .campo, .btn-primario, etc.)
   se repiten igual en Registro.vue y RecuperarContrasena.vue, para que las
   3 pantallas de autenticación se vean como parte de la misma familia. */

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

.enlace-olvidaste {
  text-align: right;
  font-size: 0.85rem;
  color: var(--color-primario);
  text-decoration: none;
  margin-top: -0.6rem;
}

.enlace-olvidaste:hover {
  text-decoration: underline;
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

.pie-auth {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: var(--color-texto-secundario);
}

.pie-auth a {
  color: var(--color-primario);
  font-weight: 600;
  text-decoration: none;
}

.pie-auth a:hover {
  text-decoration: underline;
}
</style>