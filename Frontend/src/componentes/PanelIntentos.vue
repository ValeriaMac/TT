<template>
  <!-- RN_07 / RF_25: muestra cuántos intentos lleva la persona y, al
       agotar los 3, le permite ver la solución de la ronda. -->
  <div v-if="!superada" class="panel-intentos">
    <p class="chip-intentos">Intento {{ intentosUsados }} de {{ maximo }}</p>

    <p v-if="!agotados" class="texto-intentos">
      Te {{ maximo - intentosUsados === 1 ? 'queda' : 'quedan' }}
      {{ maximo - intentosUsados }}
      {{ maximo - intentosUsados === 1 ? 'intento' : 'intentos' }}
      antes de poder ver la solución.
    </p>

    <template v-else>
      <p class="texto-intentos">
        Ya usaste tus {{ maximo }} intentos en este subnivel. Puedes ver la solución para
        aprender de ella; después empiezas con intentos nuevos.
      </p>

      <button v-if="!verSolucion" type="button" class="btn-secundario" @click="verSolucion = true">
        💡 Ver solución
      </button>

      <div v-else class="solucion">
        <p v-if="nota" class="nota-solucion">{{ nota }}</p>

        <ul class="lista-solucion">
          <li v-for="(item, indice) in solucion" :key="indice">
            <span class="sol-titulo">{{ item.titulo }}</span>
            <span class="sol-correcta">✔ {{ item.correcta }}</span>
            <span v-if="item.tuRespuesta && item.tuRespuesta !== item.correcta" class="sol-tuya">
              Tu respuesta: {{ item.tuRespuesta }}
            </span>
          </li>
        </ul>

        <button type="button" class="btn-primario" @click="terminarSolucion">
          Entendido, empezar de nuevo
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  intentosUsados: { type: Number, required: true },
  maximo: { type: Number, default: 3 },
  agotados: { type: Boolean, default: false },
  superada: { type: Boolean, default: false },
  // Lista de { titulo, correcta, tuRespuesta? } con lo que se falló en la ronda
  solucion: { type: Array, default: () => [] },
  nota: { type: String, default: '' },
});

const emit = defineEmits(['cerrar']);
const verSolucion = ref(false);

function terminarSolucion() {
  verSolucion.value = false;
  emit('cerrar');
}
</script>

<style scoped>
.panel-intentos {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 12px;
  border: 1px dashed var(--color-primario, #5a7a3a);
  text-align: left;
}

.chip-intentos {
  display: inline-block;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--color-primario, #5a7a3a);
  color: var(--color-primario, #5a7a3a);
  margin-bottom: 0.6rem;
}

.texto-intentos {
  font-size: 0.95rem;
  margin-bottom: 0.8rem;
  line-height: 1.5;
}

.nota-solucion {
  font-size: 0.9rem;
  margin-bottom: 0.6rem;
  color: var(--color-texto-secundario, #666);
}

.lista-solucion {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
}

.lista-solucion li {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.25);
}

.sol-titulo {
  font-size: 0.9rem;
  color: var(--color-texto-secundario, #666);
}

.sol-correcta {
  font-weight: 700;
}

.sol-tuya {
  font-size: 0.85rem;
  color: #b3261e;
}
</style>
