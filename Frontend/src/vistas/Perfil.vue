<template>
  <div class="pagina-perfil">
    <h1 class="titulo-pagina">Mi Perfil</h1>

    <!-- Información -->
    <div class="tarjeta-perfil">
      <div class="encabezado-tarjeta">
        <span class="icono-tarjeta">👤</span>
        <h2>Información</h2>
      </div>

      <div class="campo-info">
        <label>Nombre</label>
        <div v-if="!editandoNombre" class="fila-nombre">
          <span class="valor-info">{{ authStore.usuario?.nombre }}</span>
          <button class="btn-enlace" @click="iniciarEdicionNombre">Editar</button>
        </div>
        <div v-else class="fila-editar-nombre">
          <input v-model="nuevoNombre" class="input-normal" />
          <button class="btn-guardar-chico" @click="guardarNombre" :disabled="guardandoNombre">Guardar</button>
          <button class="btn-cancelar-chico" @click="editandoNombre = false">Cancelar</button>
        </div>
      </div>

      <div class="campo-info">
        <label>Correo</label>
        <span class="valor-info">{{ authStore.usuario?.correo }}</span>
      </div>

      <p v-if="mensajeNombre" class="mensaje" :class="{ error: errorNombre }">{{ mensajeNombre }}</p>
    </div>

    <!-- Cambiar contraseña -->
    <div class="tarjeta-perfil">
      <div class="encabezado-tarjeta">
        <span class="icono-tarjeta">🔒</span>
        <h2>Cambiar Contraseña</h2>
      </div>

      <form @submit.prevent="manejarCambioContrasena" class="formulario-contrasena">
        <div class="campo-info">
          <label>Contraseña actual</label>
          <input v-model="contrasenaActual" type="password" class="input-normal" required />
        </div>

        <div class="campo-info">
          <label>Nueva contraseña (mínimo 8 caracteres)</label>
          <input v-model="contrasenaNueva" type="password" class="input-normal" required minlength="8" />
        </div>

        <div class="campo-info">
          <label>Confirmar nueva contraseña</label>
          <input v-model="confirmarContrasena" type="password" class="input-normal" required minlength="8" />
        </div>

        <p v-if="mensajeContrasena" class="mensaje" :class="{ error: errorContrasena }">{{ mensajeContrasena }}</p>

        <button type="submit" class="btn-primario" :disabled="cambiandoContrasena">
          {{ cambiandoContrasena ? 'Actualizando...' : 'Actualizar Contraseña' }}
        </button>
      </form>
    </div>

    <!-- Zona peligrosa -->
    <div class="tarjeta-perfil tarjeta-peligro">
      <div class="encabezado-tarjeta">
        <span class="icono-tarjeta">🗑</span>
        <h2 class="titulo-peligro">Zona Peligrosa</h2>
      </div>

      <button v-if="!mostrarConfirmarEliminar" class="btn-peligro" @click="mostrarConfirmarEliminar = true">
        Eliminar Cuenta
      </button>

      <div v-else class="confirmacion-eliminar">
        <p class="aviso-peligro">⚠️ Esta acción es permanente. Todos tus datos se eliminarán.</p>

        <div class="campo-info">
          <label>Confirma tu contraseña</label>
          <input v-model="contrasenaEliminar" type="password" class="input-normal" placeholder="Escribe tu contraseña" />
        </div>

        <p v-if="mensajeEliminar" class="mensaje error">{{ mensajeEliminar }}</p>

        <div class="botones-eliminar">
          <button class="btn-peligro" @click="manejarEliminarCuenta" :disabled="eliminando">
            {{ eliminando ? 'Eliminando...' : 'Confirmar Eliminación' }}
          </button>
          <button class="btn-cancelar" @click="mostrarConfirmarEliminar = false; contrasenaEliminar = ''">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth.store';

const router = useRouter();
const authStore = useAuthStore();

// ---- Editar nombre ----
const editandoNombre = ref(false);
const nuevoNombre = ref('');
const guardandoNombre = ref(false);
const mensajeNombre = ref('');
const errorNombre = ref(false);

function iniciarEdicionNombre() {
  nuevoNombre.value = authStore.usuario?.nombre || '';
  editandoNombre.value = true;
  mensajeNombre.value = '';
}

async function guardarNombre() {
  if (!nuevoNombre.value.trim()) return;

  guardandoNombre.value = true;
  mensajeNombre.value = '';
  try {
    await authStore.actualizarNombre(nuevoNombre.value.trim());
    editandoNombre.value = false;
    mensajeNombre.value = 'Nombre actualizado';
    errorNombre.value = false;
  } catch (error) {
    mensajeNombre.value = error.response?.data?.mensaje || 'No se pudo actualizar el nombre';
    errorNombre.value = true;
  } finally {
    guardandoNombre.value = false;
    setTimeout(() => (mensajeNombre.value = ''), 4000);
  }
}

// ---- Cambiar contraseña ----
const contrasenaActual = ref('');
const contrasenaNueva = ref('');
const confirmarContrasena = ref('');
const cambiandoContrasena = ref(false);
const mensajeContrasena = ref('');
const errorContrasena = ref(false);

async function manejarCambioContrasena() {
  mensajeContrasena.value = '';

  if (contrasenaNueva.value.length < 8) {
    mensajeContrasena.value = 'La contraseña debe tener al menos 8 caracteres';
    errorContrasena.value = true;
    return;
  }

  if (contrasenaNueva.value !== confirmarContrasena.value) {
    mensajeContrasena.value = 'Las contraseñas no coinciden';
    errorContrasena.value = true;
    return;
  }

  cambiandoContrasena.value = true;
  try {
    await authStore.cambiarContrasena(contrasenaActual.value, contrasenaNueva.value);
    mensajeContrasena.value = 'Contraseña actualizada';
    errorContrasena.value = false;
    contrasenaActual.value = '';
    contrasenaNueva.value = '';
    confirmarContrasena.value = '';
  } catch (error) {
    mensajeContrasena.value = error.response?.data?.mensaje || 'Error al cambiar la contraseña';
    errorContrasena.value = true;
  } finally {
    cambiandoContrasena.value = false;
  }
}

// ---- Eliminar cuenta ----
const mostrarConfirmarEliminar = ref(false);
const contrasenaEliminar = ref('');
const eliminando = ref(false);
const mensajeEliminar = ref('');

async function manejarEliminarCuenta() {
  if (!contrasenaEliminar.value) {
    mensajeEliminar.value = 'Debes escribir tu contraseña para confirmar';
    return;
  }

  eliminando.value = true;
  mensajeEliminar.value = '';
  try {
    await authStore.eliminarCuenta(contrasenaEliminar.value);
    router.push('/');
  } catch (error) {
    mensajeEliminar.value = error.response?.data?.mensaje || 'Error al eliminar la cuenta';
  } finally {
    eliminando.value = false;
  }
}
</script>

<style scoped>
.pagina-perfil {
  max-width: 650px;
  margin: 0 auto;
  padding: 1.5rem;
}

.titulo-pagina {
  font-family: var(--fuente-encabezados);
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
}

.tarjeta-perfil {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.tarjeta-peligro {
  border: 1px solid #f5c6cb;
}

.encabezado-tarjeta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.2rem;
}

.icono-tarjeta {
  font-size: 1.3rem;
}

.encabezado-tarjeta h2 {
  font-family: var(--fuente-encabezados);
  font-size: 1.2rem;
}

.titulo-peligro {
  color: #c0392b;
}

.campo-info {
  margin-bottom: 1rem;
}

.campo-info label {
  display: block;
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
  margin-bottom: 0.3rem;
}

.valor-info {
  font-size: 1.05rem;
}

.fila-nombre {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fila-editar-nombre {
  display: flex;
  gap: 0.5rem;
}

.input-normal {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  box-sizing: border-box;
  font-size: 0.95rem;
}

.input-normal:focus {
  outline: 2px solid var(--color-primario);
  border-color: var(--color-primario);
}

.btn-enlace {
  background: none;
  border: none;
  color: var(--color-primario);
  font-weight: 600;
  cursor: pointer;
}

.btn-guardar-chico,
.btn-cancelar-chico {
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.btn-guardar-chico {
  background: var(--color-primario);
  color: white;
}

.btn-cancelar-chico {
  background: #eee;
}

.formulario-contrasena {
  display: flex;
  flex-direction: column;
}

.btn-primario {
  width: 100%;
  padding: 0.7rem;
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: var(--radio-boton);
  font-weight: 600;
  cursor: pointer;
}

.btn-primario:hover:not(:disabled) {
  background-color: var(--color-primario-hover);
}

.btn-primario:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mensaje {
  font-size: 0.85rem;
  color: var(--color-primario);
  margin-bottom: 0.8rem;
}

.mensaje.error {
  color: #c0392b;
}

.btn-peligro {
  width: 100%;
  padding: 0.7rem;
  background: #fdecea;
  color: #c0392b;
  border: 1px solid #f5c6cb;
  border-radius: var(--radio-boton);
  font-weight: 600;
  cursor: pointer;
}

.btn-peligro:hover:not(:disabled) {
  background: #c0392b;
  color: white;
}

.btn-peligro:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.aviso-peligro {
  font-size: 0.85rem;
  color: #c0392b;
  margin-bottom: 1rem;
}

.botones-eliminar {
  display: flex;
  gap: 0.6rem;
}

.botones-eliminar .btn-peligro {
  flex: 1;
}

.btn-cancelar {
  flex: 1;
  padding: 0.7rem;
  background: #eee;
  border: none;
  border-radius: var(--radio-boton);
  cursor: pointer;
}

@media (max-width: 640px) {
  .fila-editar-nombre {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>