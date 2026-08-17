<template>
  <div class="contenedor-auth">
    <h1>Crear cuenta</h1>

    <form @submit.prevent="manejarRegistro">
      <label for="nombre">Nombre</label>
      <input id="nombre" v-model="formulario.nombre" type="text" required />

      <label for="correo">Correo electrónico</label>
      <input id="correo" v-model="formulario.correo" type="email" required />

      <label for="contrasena">Contraseña</label>
      <input id="contrasena" v-model="formulario.contrasena" type="password" required />
      <small>Mínimo 8 caracteres, con mayúscula, minúscula y número</small>

      <label for="fechaNacimiento">Fecha de nacimiento</label>
      <input id="fechaNacimiento" v-model="formulario.fechaNacimiento" type="date" required />

      <!-- Solo aparece si detectamos que es menor de edad -->
      <div v-if="esMenorDeEdad">
        <label for="correoTutor">Correo de tu tutor</label>
        <input id="correoTutor" v-model="formulario.correoTutor" type="email" required />
        <small>Como eres menor de edad, necesitamos el correo de un padre/tutor</small>
      </div>

      <label class="checkbox">
        <input type="checkbox" v-model="formulario.avisoPrivacidadAceptado" required />
        Acepto el aviso de privacidad
      </label>

      <p v-if="mensajeError" class="error">{{ mensajeError }}</p>

      <button type="submit" :disabled="cargando">
        {{ cargando ? 'Creando cuenta...' : 'Registrarse' }}
      </button>
    </form>

    <router-link to="/login">¿Ya tienes cuenta? Inicia sesión</router-link>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const formulario = reactive({
  nombre: '',
  correo: '',
  contrasena: '',
  fechaNacimiento: '',
  correoTutor: '',
  avisoPrivacidadAceptado: false,
});

const cargando = ref(false);
const mensajeError = ref('');

// Calcula en el momento si la fecha ingresada corresponde a un menor de edad
const esMenorDeEdad = computed(() => {
  if (!formulario.fechaNacimiento) return false;
  const hoy = new Date();
  const nacimiento = new Date(formulario.fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad < 18;
});

async function manejarRegistro() {
  mensajeError.value = '';
  cargando.value = true;
  try {
    await authStore.registrar(formulario);
    router.push('/'); // redirige al menú principal tras registrarse
  } catch (error) {
    mensajeError.value = error.response?.data?.mensaje || 'Ocurrió un error al registrarte';
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