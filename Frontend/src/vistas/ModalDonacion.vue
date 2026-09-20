<!-- componentes/ModalDonacion.vue -->
<!-- Modal reutilizable de donación. El componente padre controla si se
     muestra o no mediante la prop "visible", y este emite "cerrar"
     cuando el usuario lo cierra (clic en X o en "Quizás después"). -->
<template>
  <div v-if="visible" class="fondo-modal" @click.self="$emit('cerrar')">
    <div class="tarjeta-modal">
      <button class="btn-cerrar" @click="$emit('cerrar')">✕</button>

      <div class="icono-corazon">💚</div>
      <h2>Apoya a Lex</h2>
      <p class="descripcion-modal">Tu donación mantiene la app accesible</p>

      <div class="opciones-monto">
        <button
          v-for="monto in montos"
          :key="monto"
          class="btn-monto"
          :class="{ seleccionado: montoElegido === monto }"
          @click="montoElegido = monto"
        >
          ${{ monto }}
        </button>
      </div>

      <button class="btn-donar" @click="manejarDonar">
        💗 Donar ahora
      </button>

      <button class="enlace-despues" @click="$emit('cerrar')">Quizás después</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['cerrar']);

const montos = [20, 50, 100];
const montoElegido = ref(50);

function manejarDonar() {
  // NOTA: aquí falta conectar con una pasarela de pago real
  // (Stripe, PayPal, etc.) — por ahora solo cierra el modal.
  // Este es un punto pendiente a resolver antes de usarse en producción.
  console.log('Monto elegido para donar:', montoElegido.value);
  emit('cerrar');
}
</script>

<style scoped>
.fondo-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

.tarjeta-modal {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 320px;
  width: 100%;
  text-align: center;
  position: relative;
}

.btn-cerrar {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: var(--color-texto-secundario);
}

.icono-corazon {
  font-size: 2.5rem;
}

.descripcion-modal {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  margin-bottom: 1.2rem;
}

.opciones-monto {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1.2rem;
}

.btn-monto {
  flex: 1;
  padding: 0.7rem 0;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-boton);
  background: white;
  cursor: pointer;
  font-weight: 600;
}

.btn-monto.seleccionado {
  border-color: var(--color-primario);
  border-width: 2px;
}

.btn-donar {
  width: 100%;
  padding: 0.8rem;
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 0.8rem;
}

.enlace-despues {
  background: none;
  border: none;
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
  cursor: pointer;
}
</style>