<template>
  <div class="pagina-degradada">
    <div class="tarjeta-auth tarjeta-ancha" v-if="cuentaCreada">
      <div class="estado-confirmacion">
        <div class="icono-correo">✉️</div>
        <h2>¡Ya casi!</h2>
        <p class="descripcion">{{ mensajeExito }}</p>
        <router-link to="/login" class="btn-primario btn-enlace">Ir a iniciar sesión</router-link>
      </div>
    </div>

    <div class="tarjeta-auth tarjeta-ancha" v-else>
      <div class="encabezado-auth">
        <h1 class="logo">lex</h1>
        <h2>Crear cuenta</h2>
      </div>

      <form @submit.prevent="manejarRegistro" class="formulario-auth">
        <div class="campo">
          <label for="nombre">Nombre completo</label>
          <input id="nombre" v-model="formulario.nombre" type="text" required />
        </div>

        <div class="campo">
          <label for="correo">Correo electrónico</label>
          <input id="correo" v-model="formulario.correo" type="email" placeholder="tu@email.com" required />
        </div>

        <div class="campo">
          <label for="contrasena">Contraseña</label>
          <input id="contrasena" v-model="formulario.contrasena" type="password" required />
          <small>Mínimo 8 caracteres, con mayúscula, minúscula y número</small>
        </div>

        <div class="campo">
          <label for="fechaNacimiento">Fecha de nacimiento</label>
          <input id="fechaNacimiento" v-model="formulario.fechaNacimiento" type="date" required />
        </div>

        <!-- Solo aparece si detectamos que es menor de edad -->
        <div v-if="esMenorDeEdad" class="campo campo-tutor">
          <label for="correoTutor">Correo de tu tutor</label>
          <input id="correoTutor" v-model="formulario.correoTutor" type="email" required />
          <small>Como eres menor de edad, necesitamos el correo de un padre/tutor</small>
        </div>

        <label class="campo-checkbox">
          <input type="checkbox" v-model="formulario.avisoPrivacidadAceptado" required />
          Acepto el aviso de privacidad
        </label>

        <p v-if="mensajeError" class="mensaje-error">{{ mensajeError }}</p>

        <button type="submit" class="btn-primario" :disabled="cargando">
          {{ cargando ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="pie-auth">
        ¿Ya tienes una cuenta?
        <router-link to="/login">Inicia sesión</router-link>
      </p>
    </div>
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
const cuentaCreada = ref(false);
const mensajeExito = ref('');

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
    const respuesta = await authStore.registrar(formulario);
    // Ya no entra directo a Inicio: falta confirmar el correo (y, si
    // es menor, que el tutor confirme también)
    mensajeExito.value = respuesta.mensaje;
    cuentaCreada.value = true;
  } catch (error) {
    mensajeError.value = error.response?.data?.mensaje || 'Ocurrió un error al registrarte';
  } finally {
    cargando.value = false;
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

.tarjeta-ancha {
  max-width: 460px;
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
  gap: 1.1rem;
}

.campo label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.campo input[type="text"],
.campo input[type="email"],
.campo input[type="password"],
.campo input[type="date"] {
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

.campo small {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
}

.campo-tutor {
  background: #f5f7ee;
  padding: 0.9rem;
  border-radius: 12px;
}

.campo-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
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
  margin-top: 0.3rem;
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

.descripcion {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.btn-enlace {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
</style>