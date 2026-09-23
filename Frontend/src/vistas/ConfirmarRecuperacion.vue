<template>
  <div class="pagina-degradada">
    <div class="tarjeta-auth">
      <div v-if="!exito">
        <div class="encabezado-auth">
          <h1 class="logo">lex</h1>
          <h2>Crea tu nueva contraseña</h2>
        </div>

        <form @submit.prevent="manejarConfirmacion" class="formulario-auth">
          <div class="campo">
            <label for="nuevaContrasena">Nueva contraseña</label>
            <input id="nuevaContrasena" v-model="nuevaContrasena" type="password" required minlength="8" />
            <small>Mínimo 8 caracteres, con mayúscula, minúscula y número</small>
          </div>

          <div class="campo">
            <label for="confirmar">Confirmar contraseña</label>
            <input id="confirmar" v-model="confirmarContrasena" type="password" required minlength="8" />
          </div>

          <p v-if="mensajeError" class="mensaje-error">{{ mensajeError }}</p>

          <button type="submit" class="btn-primario" :disabled="enviando">
            {{ enviando ? 'Guardando...' : 'Guardar nueva contraseña' }}
          </button>
        </form>
      </div>

      <div v-else class="estado-confirmacion">
        <div class="icono-correo">✅</div>
        <h2>¡Contraseña actualizada!</h2>
        <p class="descripcion">Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <router-link to="/login" class="btn-primario btn-enlace">Ir a iniciar sesión</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/servicios/api';

const route = useRoute();

const nuevaContrasena = ref('');
const confirmarContrasena = ref('');
const enviando = ref(false);
const exito = ref(false);
const mensajeError = ref('');

async function manejarConfirmacion() {
  mensajeError.value = '';

  if (nuevaContrasena.value !== confirmarContrasena.value) {
    mensajeError.value = 'Las contraseñas no coinciden';
    return;
  }

  const token = route.query.token;
  if (!token) {
    mensajeError.value = 'El enlace no es válido. Solicita uno nuevo desde "¿Olvidaste tu contraseña?"';
    return;
  }

  enviando.value = true;
  try {
    await api.post('/auth/recuperar/confirmar', {
      token,
      nuevaContrasena: nuevaContrasena.value,
    });
    exito.value = true;
  } catch (error) {
    mensajeError.value = error.response?.data?.mensaje || 'No se pudo actualizar la contraseña.';
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

.campo small {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
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

.estado-confirmacion {
  text-align: center;
}

.icono-correo {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.estado-confirmacion h2 {
  font-family: var(--fuente-encabezados);
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.descripcion {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.btn-enlace {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
</style>