// composables/useIntentosEjercicio.js
//
// RN_07 / RF_25: cada ejercicio permite máximo 3 intentos por subnivel.
// Un "intento" es una ronda que NO se superó. Al agotar los 3, el
// sistema deja ver la solución (componente PanelIntentos.vue) y después
// el contador se reinicia para que la persona pueda volver a intentar.
//
// El contador se guarda en localStorage (por usuario, ejercicio, nivel
// y subnivel), así no se pierde si la persona recarga la página.
import { ref, computed } from 'vue';
import { useAuthStore } from '@/store/auth.store';

export const MAX_INTENTOS = 3;

export function useIntentosEjercicio(claveEjercicio) {
  const authStore = useAuthStore();
  const intentosUsados = ref(0);
  let llave = '';

  function construirLlave(nivel, subnivel) {
    const quien = authStore.usuario?.id ?? authStore.usuario?.correo ?? 'anonimo';
    return `intentos:${quien}:${claveEjercicio}:${nivel}:${subnivel}`;
  }

  // Se llama cuando ya se sabe en qué nivel y subnivel está la persona
  function cargar(nivel, subnivel) {
    llave = construirLlave(nivel, subnivel);
    try {
      intentosUsados.value = Number(localStorage.getItem(llave)) || 0;
    } catch {
      intentosUsados.value = 0;
    }
  }

  function guardar() {
    try {
      localStorage.setItem(llave, String(intentosUsados.value));
    } catch {
      // si el navegador no deja guardar, el contador solo vive en esta pantalla
    }
  }

  // Se llama al terminar cada ronda. Si se superó, el contador se limpia.
  function registrarRonda(superada) {
    if (superada) {
      intentosUsados.value = 0;
    } else {
      intentosUsados.value = Math.min(MAX_INTENTOS, intentosUsados.value + 1);
    }
    guardar();
  }

  function reiniciar() {
    intentosUsados.value = 0;
    guardar();
  }

  const agotados = computed(() => intentosUsados.value >= MAX_INTENTOS);

  return { intentosUsados, agotados, MAX_INTENTOS, cargar, registrarRonda, reiniciar };
}
