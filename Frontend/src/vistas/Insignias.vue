<template>
  <div class="pagina-coleccion">
    <h1 class="titulo-pagina">Mi colección</h1>

    <div v-if="cargando" class="mensaje-info">Cargando tu colección...</div>

    <template v-else>
      <div class="resumen-coleccion">
        <div class="dato-resumen">
          <div class="numero-dato">{{ mascotasObtenidas.length }} / {{ mascotas.length }}</div>
          <div class="etiqueta-dato">Mascotas</div>
        </div>
        <div class="dato-resumen">
          <div class="numero-dato">{{ accesoriosObtenidos.length }} / {{ accesorios.length }}</div>
          <div class="etiqueta-dato">Accesorios</div>
        </div>
      </div>

      <h2 class="titulo-seccion">Mascotas</h2>
      <div class="grid-coleccion">
        <div
          v-for="mascota in mascotas"
          :key="'m-' + mascota.id"
          class="tarjeta-item"
          :class="{ bloqueado: !mascota.obtenida, activa: mascota.id === mascotaActivaId }"
        >
          <div class="emoji-item">
            <img v-if="mascota.imagen_url" :src="mascota.imagen_url" :alt="mascota.nombre" />
            <span v-else>{{ mascota.obtenida ? mascota.emoji_marcador : '🔒' }}</span>
          </div>
          <p class="nombre-item">{{ mascota.obtenida ? mascota.nombre : '???' }}</p>
          <p class="descripcion-item">{{ mascota.descripcion }}</p>

          <span v-if="mascota.id === mascotaActivaId" class="etiqueta-activa">✓ En uso</span>
          <button
            v-else-if="mascota.obtenida"
            class="btn-usar"
            :disabled="actualizando"
            @click="usarMascota(mascota.id)"
          >
            Usar
          </button>
        </div>
      </div>

      <h2 class="titulo-seccion">Accesorios</h2>
      <div class="grid-coleccion">
        <div
          v-for="accesorio in accesorios"
          :key="'a-' + accesorio.id"
          class="tarjeta-item"
          :class="{ bloqueado: !accesorio.obtenido, activa: accesorio.equipado }"
        >
          <div class="emoji-item">
            <img v-if="accesorio.imagen_url" :src="accesorio.imagen_url" :alt="accesorio.nombre" />
            <span v-else>{{ accesorio.obtenido ? accesorio.emoji_marcador : '🔒' }}</span>
          </div>
          <p class="nombre-item">{{ accesorio.obtenido ? accesorio.nombre : '???' }}</p>
          <p class="descripcion-item">{{ accesorio.descripcion }}</p>

          <button
            v-if="accesorio.obtenido"
            class="btn-quitar"
            :class="{ 'btn-usar': !accesorio.equipado }"
            :disabled="actualizando"
            @click="alternarAccesorio(accesorio)"
          >
            {{ accesorio.equipado ? 'Quitar' : 'Equipar' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/servicios/api';

const cargando = ref(true);
const actualizando = ref(false);
const mascotas = ref([]);
const accesorios = ref([]);
const mascotaActivaId = ref(null);

const mascotasObtenidas = computed(() => mascotas.value.filter((m) => m.obtenida));
const accesoriosObtenidos = computed(() => accesorios.value.filter((a) => a.obtenido));

async function cargarColeccion() {
  cargando.value = true;
  try {
    const respuesta = await api.get('/mascotas');
    mascotas.value = respuesta.data.mascotas;
    accesorios.value = respuesta.data.accesorios;
    mascotaActivaId.value = respuesta.data.mascotaActivaId;
  } catch (error) {
    console.error('No se pudo cargar la colección:', error);
  } finally {
    cargando.value = false;
  }
}

async function usarMascota(mascotaId) {
  actualizando.value = true;
  try {
    await api.put('/mascotas/activa', { mascotaId });
    mascotaActivaId.value = mascotaId;
  } catch (error) {
    console.error('No se pudo cambiar la mascota activa:', error);
  } finally {
    actualizando.value = false;
  }
}

async function alternarAccesorio(accesorio) {
  actualizando.value = true;
  try {
    const nuevoValor = !accesorio.equipado;
    await api.put(`/mascotas/accesorios/${accesorio.id}/equipar`, { equipar: nuevoValor });
    accesorio.equipado = nuevoValor;
  } catch (error) {
    console.error('No se pudo actualizar el accesorio:', error);
  } finally {
    actualizando.value = false;
  }
}

onMounted(cargarColeccion);
</script>

<style scoped>
.pagina-coleccion {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}

.titulo-pagina {
  font-family: var(--fuente-encabezados);
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
}

.mensaje-info {
  color: var(--color-texto-secundario);
}

.resumen-coleccion {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.dato-resumen {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1.2rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  flex: 1;
  text-align: center;
}

.numero-dato {
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--color-primario);
}

.etiqueta-dato {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
}

.titulo-seccion {
  font-family: var(--fuente-encabezados);
  font-size: 1.3rem;
  margin: 1.5rem 0 1rem;
}

.grid-coleccion {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.tarjeta-item {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1.2rem 0.8rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tarjeta-item.bloqueado {
  opacity: 0.55;
}

.tarjeta-item.activa {
  outline: 2px solid var(--color-primario);
}

.emoji-item {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.emoji-item img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.nombre-item {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}

.descripcion-item {
  font-size: 0.75rem;
  color: var(--color-texto-secundario);
  line-height: 1.3;
  margin-bottom: 0.6rem;
}

.etiqueta-activa {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primario);
}

.btn-usar,
.btn-quitar {
  border: none;
  border-radius: var(--radio-boton);
  padding: 0.35rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-usar {
  background-color: var(--color-primario);
  color: white;
}

.btn-quitar {
  background-color: #eee;
  color: var(--color-texto-secundario);
}

.btn-usar:disabled,
.btn-quitar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
