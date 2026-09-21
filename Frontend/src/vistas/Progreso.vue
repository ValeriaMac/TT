<template>
  <div class="pagina-progreso">
    <h1 class="titulo-pagina">Progreso</h1>

    <div class="grid-estadisticas">
      <div class="tarjeta-estadistica">
        <span class="icono-estadistica">📈</span>
        <div class="numero-estadistica">{{ progresoStore.puntosTotales }}</div>
        <div class="etiqueta-estadistica">Puntos</div>
      </div>
      <div class="tarjeta-estadistica">
        <span class="icono-estadistica">🔥</span>
        <div class="numero-estadistica">{{ progresoStore.rachaActual }}</div>
        <div class="etiqueta-estadistica">Racha</div>
      </div>
      <div class="tarjeta-estadistica">
        <span class="icono-estadistica">📅</span>
        <div class="numero-estadistica">{{ progresoStore.historial.length }}</div>
        <div class="etiqueta-estadistica">Ejercicios</div>
      </div>
    </div>

    <h2 class="titulo-seccion">Recientes</h2>

    <div v-if="cargando" class="mensaje-vacio">Cargando...</div>

    <div v-else-if="progresoStore.historial.length === 0" class="mensaje-vacio">
      Todavía no has completado ningún ejercicio.
    </div>

    <div v-else class="lista-historial">
      <div v-for="intento in progresoStore.historial" :key="intento.id" class="fila-historial">
        <div>
          <p class="nombre-ejercicio">{{ intento.nombreEjercicio }}</p>
          <p class="fecha-ejercicio">{{ formatearFecha(intento.fecha) }}</p>
        </div>
        <div class="resultado-ejercicio">
          <span class="porcentaje" :class="{ bueno: intento.porcentaje >= 70, malo: intento.porcentaje < 40 }">
            {{ intento.porcentaje }}%
          </span>
          <span class="puntos-ganados">+{{ intento.puntosObtenidos }} puntos</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useProgresoStore } from '@/store/progreso.store';

const progresoStore = useProgresoStore();
const cargando = ref(true);

onMounted(async () => {
  if (!progresoStore.cargado) {
    await progresoStore.cargarProgreso();
  }
  await progresoStore.cargarHistorial();
  cargando.value = false;
});

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped>
.pagina-progreso {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}

.titulo-pagina {
  font-family: var(--fuente-encabezados);
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
}

.grid-estadisticas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.tarjeta-estadistica {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1.2rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.icono-estadistica {
  font-size: 1.5rem;
}

.numero-estadistica {
  font-size: 1.6rem;
  font-weight: 600;
  margin: 0.3rem 0;
}

.etiqueta-estadistica {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
}

.titulo-seccion {
  font-family: var(--fuente-encabezados);
  font-size: 1.3rem;
  margin-bottom: 1rem;
}

.mensaje-vacio {
  color: var(--color-texto-secundario);
  text-align: center;
  padding: 2rem;
}

.lista-historial {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.fila-historial {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1rem 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.nombre-ejercicio {
  font-weight: 600;
}

.fecha-ejercicio {
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
}

.resultado-ejercicio {
  text-align: right;
}

.porcentaje {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: #f5f0dd;
  color: #8a6d00;
}

.porcentaje.bueno {
  background: #e6f4ea;
  color: #1e7e34;
}

.porcentaje.malo {
  background: #fdecea;
  color: #c0392b;
}

.puntos-ganados {
  display: block;
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
  margin-top: 0.2rem;
}
</style>