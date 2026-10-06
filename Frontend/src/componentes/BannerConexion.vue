<template>
  <!-- RF_26: avisa cuando no hay internet y cuántos resultados están
       guardados en el dispositivo esperando sincronizarse. -->
  <div v-if="!progresoStore.enLinea || progresoStore.pendientes > 0" class="banner-conexion" role="status" aria-live="polite">
    <span v-if="!progresoStore.enLinea">
      📡 Sin conexión. Tu progreso se guarda en este dispositivo y se sincroniza al reconectar
      <template v-if="progresoStore.pendientes > 0">({{ progresoStore.pendientes }} pendiente{{ progresoStore.pendientes === 1 ? '' : 's' }})</template>.
    </span>
    <span v-else>
      🔄 Sincronizando {{ progresoStore.pendientes }} resultado{{ progresoStore.pendientes === 1 ? '' : 's' }} guardado{{ progresoStore.pendientes === 1 ? '' : 's' }}...
    </span>
  </div>
</template>

<script setup>
import { useProgresoStore } from '@/store/progreso.store';

const progresoStore = useProgresoStore();
</script>

<style scoped>
.banner-conexion {
  position: fixed;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  z-index: 200;
  max-width: min(92vw, 560px);
  padding: 0.7rem 1.1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.4;
  text-align: center;
  background: #fff4d6;
  color: #3d3200;
  border: 1px solid #e0c46a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}
</style>
