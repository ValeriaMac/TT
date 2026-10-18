<script setup>
import { ref } from 'vue';

defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['cerrar']);

const montos = [20, 50, 100];
const montoElegido = ref(50);

// Cada monto tiene su link de pago, guardado en variables de entorno
const enlaces = {
  20: import.meta.env.VITE_DONACION_URL_20,
  50: import.meta.env.VITE_DONACION_URL_50,
  100: import.meta.env.VITE_DONACION_URL_100,
};

function manejarDonar() {
  const enlace = enlaces[montoElegido.value];

  if (!enlace) {
    alert('Las donaciones aún no están disponibles. ¡Gracias por tu intención!');
    return;
  }

  // Abre el pago en otra pestaña y cierra el modal
  window.open(enlace, '_blank', 'noopener');
  emit('cerrar');
}
</script>