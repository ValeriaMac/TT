<template>
  <div class="pagina-ejercicio">
    <h1 class="titulo-pagina">Cronómetro</h1>

    <div v-if="cargando" class="tarjeta-ejercicio">Cargando lectura...</div>

    <div v-else-if="errorCarga" class="tarjeta-ejercicio">
      <p class="resultado incorrecto">{{ errorCarga }}</p>
      <button class="btn-primario" @click="cargarLectura()">Reintentar</button>
    </div>

    <!-- Ya completó los 5 niveles x 5 subniveles -->
    <div v-else-if="ejercicioCompletado && !terminado && !jugarLibre" class="tarjeta-ejercicio tarjeta-resultado-final">
      <div class="emoji-final">🏆</div>
      <h2>¡Completaste todo el ejercicio!</h2>
      <p class="nota-avance">Ya pasaste los 5 niveles con sus 5 subniveles cada uno. Puedes seguir practicando libremente.</p>
      <button class="btn-primario" @click="jugarLibre = true">Practicar de todos modos</button>
    </div>

    <!-- Ronda en curso: se lee el MISMO texto 3 veces -->
    <div v-else-if="!terminado" class="tarjeta-ejercicio">
      <p class="indicador-nivel">Nivel {{ numeroNivel }} · Subnivel {{ subnivelActual }} de 5</p>

      <p class="contador-lectura">Lectura {{ numeroLectura }} de 3</p>

      <p class="instruccion">
        {{ numeroLectura === 1
          ? 'Presiona "Empezar" y lee el texto en voz alta a tu ritmo normal.'
          : 'Lee el MISMO texto otra vez. La idea es ver si esta vez te sale más rápido.' }}
      </p>

      <div class="caja-oracion">{{ enunciado }}</div>

      <!-- Historial de las lecturas ya hechas en esta ronda -->
      <div v-if="lecturasPrevias.length > 0" class="historial-lecturas">
        <span v-for="(ppm, indice) in lecturasPrevias" :key="indice" class="chip-lectura">
          Lectura {{ indice + 1 }}: {{ ppm }} ppm
        </span>
      </div>

      <div class="controles-cronometro">
        <button v-if="!leyendo" class="btn-primario" @click="empezar">▶ Empezar</button>
        <button v-else class="btn-primario btn-detener" @click="terminarLectura">⏹ Terminar</button>

        <span v-if="leyendo" class="tiempo-transcurrido">{{ tiempoTranscurrido }}s</span>
      </div>
    </div>

    <!-- Pantalla final: resultado de las 3 lecturas -->
    <div v-else class="tarjeta-ejercicio tarjeta-resultado-final">
      <div class="emoji-final">{{ rondaFueExitosa ? '🎉' : '💪' }}</div>
      <h2 v-if="huboMejoraReal">¡Mejoraste! Subiste de subnivel</h2>
      <h2 v-else-if="fueConsistente">¡Lectura constante y rápida! Subiste de subnivel</h2>
      <h2 v-else>Sigue practicando este mismo texto</h2>
      <p class="nota-avance">
        <template v-if="huboMejoraReal">Pasaste de {{ lecturasPrevias[0] }} a {{ lecturasPrevias[2] }} palabras por minuto.</template>
        <template v-else-if="fueConsistente">Mantuviste un ritmo parejo en tus 3 lecturas — eso también cuenta como buen dominio del texto.</template>
        <template v-else>Te quedaste en el Nivel {{ numeroNivel }} · Subnivel {{ subnivelActual }}. ¡Vuelve a intentarlo!</template>
      </p>

      <div class="grid-resultados grid-3-lecturas">
        <div v-for="(ppm, indice) in lecturasPrevias" :key="indice" class="dato-resultado">
          <div class="numero-dato">{{ ppm }}</div>
          <div class="etiqueta-dato">Lectura {{ indice + 1 }}</div>
        </div>
      </div>

      <div class="dato-puntos">+{{ puntosObtenidos }} puntos</div>

      <div class="botones-final">
        <button class="btn-secundario" @click="reiniciarRonda">Intentar de nuevo</button>
        <router-link to="/ejercicios" class="btn-primario btn-enlace">Volver a ejercicios</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '@/servicios/api';
import { useProgresoStore } from '@/store/progreso.store';

const progresoStore = useProgresoStore();

const cargando = ref(true);
const errorCarga = ref('');
const ultimaLecturaId = ref(null);
const enunciado = ref('');
const numeroNivel = ref(1);
const subnivelActual = ref(1);
const ejercicioCompletado = ref(false);
const jugarLibre = ref(false);

const leyendo = ref(false);
const terminado = ref(false);
const tiempoTranscurrido = ref(0);

// El corazón del diseño "repeated reading": se lee el mismo texto 3
// veces, guardando el PPM de cada una
const numeroLectura = ref(1);
const lecturasPrevias = ref([]);
const puntosObtenidos = ref(0);

let horaInicio = null;
let intervaloReloj = null;

async function cargarLectura(excluirId = null) {
  cargando.value = true;
  errorCarga.value = '';
  terminado.value = false;
  numeroLectura.value = 1;
  lecturasPrevias.value = [];

  try {
    const parametros = excluirId ? { excluirId } : {};
    const respuesta = await api.get('/ejercicios/cronometro', { params: parametros });
    ultimaLecturaId.value = respuesta.data.lecturaId;
    enunciado.value = respuesta.data.enunciado;
    numeroNivel.value = respuesta.data.numeroNivel;
    subnivelActual.value = respuesta.data.subnivel;
    ejercicioCompletado.value = respuesta.data.ejercicioCompletado;
  } catch (error) {
    console.error('No se pudo cargar la lectura:', error);
    errorCarga.value = error.response?.data?.mensaje || 'No se pudo conectar con el servidor.';
  } finally {
    cargando.value = false;
  }
}

// El tiempo empieza a correr de inmediato al presionar el botón
function empezar() {
  leyendo.value = true;
  horaInicio = Date.now();
  tiempoTranscurrido.value = 0;
  intervaloReloj = setInterval(() => {
    tiempoTranscurrido.value = Math.floor((Date.now() - horaInicio) / 1000);
  }, 1000);
}

async function terminarLectura() {
  clearInterval(intervaloReloj);
  leyendo.value = false;

  const segundosTotales = (Date.now() - horaInicio) / 1000;
  const numeroPalabras = enunciado.value.trim().split(/\s+/).length;
  const ppm = Math.round(numeroPalabras / (segundosTotales / 60));

  lecturasPrevias.value.push(ppm);

  if (numeroLectura.value < 3) {
    // Todavía faltan repeticiones de este mismo texto
    numeroLectura.value++;
  } else {
    // Ya son las 3 lecturas: se compara la última contra la primera
    await finalizarRonda();
  }
}

// La ronda cuenta como exitosa de DOS formas posibles:
// 1) Mejoró: la 3ra lectura fue más rápida que el promedio de las 3.
// 2) Fue consistente: las 3 lecturas salieron parejas entre sí (poca
//    variación), lo cual también es una señal positiva — significa
//    que ya lee ese texto de forma estable y fluida, no que "falló".
const PORCENTAJE_MAXIMO_VARIACION = 10;

const huboMejoraReal = computed(() => {
  if (lecturasPrevias.value.length < 3) return false;
  const promedio = lecturasPrevias.value.reduce((suma, ppm) => suma + ppm, 0) / 3;
  return lecturasPrevias.value[2] > promedio;
});

const fueConsistente = computed(() => {
  if (lecturasPrevias.value.length < 3) return false;
  const promedio = lecturasPrevias.value.reduce((suma, ppm) => suma + ppm, 0) / 3;
  const maximo = Math.max(...lecturasPrevias.value);
  const minimo = Math.min(...lecturasPrevias.value);
  const variacionPorcentaje = ((maximo - minimo) / promedio) * 100;
  return variacionPorcentaje <= PORCENTAJE_MAXIMO_VARIACION;
});

const rondaFueExitosa = computed(() => huboMejoraReal.value || fueConsistente.value);

async function finalizarRonda() {
  puntosObtenidos.value = rondaFueExitosa.value ? 100 : 60;
  terminado.value = true;

  await progresoStore.registrarResultado({
    ejercicioClave: 'CU-EJ-02',
    nivelNumero: numeroNivel.value,
    puntosObtenidos: puntosObtenidos.value,
    aciertos: rondaFueExitosa.value ? 1 : 0,
    errores: rondaFueExitosa.value ? 0 : 1,
  });
}

function reiniciarRonda() {
  leyendo.value = false;
  terminado.value = false;
  tiempoTranscurrido.value = 0;
  puntosObtenidos.value = 0;
  cargarLectura(ultimaLecturaId.value);
}

onMounted(() => cargarLectura());
onUnmounted(() => clearInterval(intervaloReloj));
</script>

<style scoped>
.pagina-ejercicio {
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
}

.titulo-pagina {
  font-family: var(--fuente-encabezados);
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
}

.tarjeta-ejercicio {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.indicador-nivel {
  display: inline-block;
  background: #eef4e8;
  color: var(--color-primario);
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  margin-bottom: 0.6rem;
}

.contador-lectura {
  font-weight: 600;
  color: var(--color-texto-secundario);
  margin-bottom: 0.6rem;
}

.instruccion {
  color: var(--color-texto-secundario);
  margin-bottom: 1.2rem;
}

.caja-oracion {
  background: #f7f7f0;
  border-radius: 12px;
  padding: 1.5rem;
  font-size: 1.15rem;
  line-height: 1.8;
  margin-bottom: 1rem;
}

.historial-lecturas {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.2rem;
}

.chip-lectura {
  background: #eef4e8;
  color: var(--color-primario);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
}

.controles-cronometro {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-primario {
  padding: 0.7rem 1.4rem;
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: var(--radio-boton);
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
}

.btn-primario:hover {
  background-color: var(--color-primario-hover);
}

.btn-primario:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-detener {
  background-color: #c0392b;
}

.btn-detener:hover {
  background-color: #a93226;
}

.tiempo-transcurrido {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-texto-secundario);
}

.resultado.incorrecto {
  color: #c0392b;
  margin-bottom: 1rem;
}

.nota-avance {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.tarjeta-resultado-final {
  text-align: center;
}

.emoji-final {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.grid-3-lecturas {
  grid-template-columns: repeat(3, 1fr);
}

.grid-resultados {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0 1rem;
}

.dato-resultado {
  background: #f7f7f0;
  border-radius: 12px;
  padding: 1rem 0.5rem;
}

.numero-dato {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--color-primario);
}

.etiqueta-dato {
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
}

.dato-puntos {
  font-weight: 600;
  color: var(--color-primario);
  margin-bottom: 1.2rem;
}

.botones-final {
  display: flex;
  gap: 0.8rem;
}

.botones-final > * {
  flex: 1;
}

.btn-secundario {
  padding: 0.7rem;
  background: white;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-boton);
  cursor: pointer;
}

.btn-enlace {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>