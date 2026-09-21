<template>
  <div class="pagina-ejercicio">
    <h1 class="titulo-pagina">Atrapa el error</h1>

    <div v-if="cargando" class="tarjeta-ejercicio">Cargando preguntas...</div>

    <div v-else-if="errorCarga" class="tarjeta-ejercicio">
      <p class="resultado incorrecto">{{ errorCarga }}</p>
      <button class="btn-primario" @click="cargarPreguntas">Reintentar</button>
    </div>

    <div v-else-if="preguntas.length === 0" class="tarjeta-ejercicio">
      No hay preguntas cargadas todavía para este nivel.
    </div>

    <!-- Ya completó los 5 niveles x 5 subniveles -->
    <div v-else-if="ejercicioCompletado && !terminado && !jugarLibre" class="tarjeta-ejercicio tarjeta-resultado-final">
      <div class="emoji-final">🏆</div>
      <h2>¡Completaste todo el ejercicio!</h2>
      <p class="nota-avance">Ya pasaste los 5 niveles con sus 5 subniveles cada uno. Puedes seguir practicando libremente.</p>
      <button class="btn-primario" @click="jugarLibre = true">Practicar de todos modos</button>
    </div>

    <!-- Ronda en curso -->
    <div v-else-if="!terminado" class="tarjeta-ejercicio">
      <p class="indicador-nivel">Nivel {{ numeroNivel }} · Subnivel {{ subnivelActual }} de 5</p>
      <p class="instruccion">Identifica la palabra incorrecta y escríbela correctamente</p>

      <div class="caja-oracion" v-html="oracionMostrada"></div>

      <form @submit.prevent="manejarRespuesta" class="formulario-respuesta">
        <input
          v-model="respuestaUsuario"
          type="text"
          placeholder="Escribe la palabra correcta"
          :disabled="mostrandoResultado"
          class="input-respuesta"
          autofocus
        />

        <p v-if="mostrandoResultado" class="resultado" :class="{ correcto: ultimoResultado.correcto, incorrecto: !ultimoResultado.correcto }">
          <span v-if="ultimoResultado.correcto">✓ ¡Correcto!</span>
          <span v-else>✕ Era: {{ ultimoResultado.respuestaCorrecta }}</span>
        </p>

        <button v-if="!mostrandoResultado" type="submit" class="btn-primario">Comprobar</button>
        <button v-else type="button" class="btn-primario" @click="siguientePregunta">
          {{ esUltimaPregunta ? 'Ver resultados' : 'Siguiente' }}
        </button>
      </form>

      <p class="contador-preguntas">Pregunta {{ indiceActual + 1 }} de {{ preguntas.length }}</p>
    </div>

    <!-- Pantalla final -->
    <div v-else class="tarjeta-ejercicio tarjeta-resultado-final">
      <div class="emoji-final">{{ rondaFuePerfecta ? '🎉' : '💪' }}</div>
      <h2 v-if="rondaFuePerfecta">¡Ronda perfecta! Subiste de subnivel</h2>
      <h2 v-else>Necesitas las 5 correctas para avanzar</h2>
      <p v-if="!rondaFuePerfecta" class="nota-avance">
        Te quedaste en el Nivel {{ numeroNivel }} · Subnivel {{ subnivelActual }}. ¡Inténtalo de nuevo!
      </p>

      <div class="grid-resultados">
        <div class="dato-resultado">
          <div class="numero-dato">{{ aciertos }}</div>
          <div class="etiqueta-dato">Correctas</div>
        </div>
        <div class="dato-resultado">
          <div class="numero-dato">{{ preguntas.length }}</div>
          <div class="etiqueta-dato">Total</div>
        </div>
        <div class="dato-resultado">
          <div class="numero-dato">+{{ puntosGanados }}</div>
          <div class="etiqueta-dato">Puntos</div>
        </div>
      </div>

      <div class="botones-final">
        <button class="btn-secundario" @click="reiniciar">Intentar de nuevo</button>
        <router-link to="/ejercicios" class="btn-primario btn-enlace">Volver a ejercicios</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/servicios/api';
import { useProgresoStore } from '@/store/progreso.store';

const progresoStore = useProgresoStore();

const PUNTOS_POR_ACIERTO = 20; // igual que en la Tabla de reglas técnicas del ejercicio
const TOTAL_PREGUNTAS_RONDA = 5;

const cargando = ref(true);
const errorCarga = ref('');
const preguntas = ref([]);

// Ya no es un valor fijo: lo calcula el backend según el progreso
// real del usuario en este ejercicio (nivel 1 a 5, subnivel 1 a 5)
const numeroNivel = ref(1);
const subnivelActual = ref(1);
const ejercicioCompletado = ref(false);
const jugarLibre = ref(false); // permite seguir practicando aunque ya haya terminado todo
const indiceActual = ref(0);
const respuestaUsuario = ref('');
const mostrandoResultado = ref(false);
const ultimoResultado = ref(null);
const aciertos = ref(0);
const erroresCount = ref(0);
const erroresConsecutivos = ref(0);
const terminado = ref(false);
const palabraAResaltar = ref(null); // se activa tras 3 fallos seguidos (RN de dificultad)

const preguntaActual = computed(() => preguntas.value[indiceActual.value]);
const esUltimaPregunta = computed(() => indiceActual.value === preguntas.value.length - 1);
const puntosGanados = computed(() => aciertos.value * PUNTOS_POR_ACIERTO);

// Si el usuario lleva 3 fallos seguidos, se resalta en negritas la
// palabra incorrecta dentro de la oración (ayuda visual, RN de CU-EJ-03)
const oracionMostrada = computed(() => {
  const enunciado = preguntaActual.value?.enunciado || '';
  if (!palabraAResaltar.value) return enunciado;

  const regex = new RegExp(`(${palabraAResaltar.value})`, 'i');
  return enunciado.replace(regex, '<strong class="palabra-resaltada">$1</strong>');
});

async function cargarPreguntas() {
  cargando.value = true;
  errorCarga.value = '';
  try {
    const respuesta = await api.get('/ejercicios/atrapa-error');
    preguntas.value = respuesta.data.preguntas;
    numeroNivel.value = respuesta.data.numeroNivel;
    subnivelActual.value = respuesta.data.subnivel;
    ejercicioCompletado.value = respuesta.data.ejercicioCompletado;
  } catch (error) {
    console.error('Error al cargar las preguntas:', error);
    errorCarga.value = error.response?.data?.mensaje || 'No se pudo conectar con el servidor.';
  } finally {
    cargando.value = false;
  }
}

async function manejarRespuesta() {
  if (!respuestaUsuario.value.trim()) return;

  const respuesta = await api.post('/ejercicios/atrapa-error/verificar', {
    preguntaId: preguntaActual.value.id,
    respuesta: respuestaUsuario.value,
  });

  ultimoResultado.value = respuesta.data;
  mostrandoResultado.value = true;

  if (respuesta.data.correcto) {
    aciertos.value++;
    erroresConsecutivos.value = 0;
    palabraAResaltar.value = null;
  } else {
    erroresCount.value++;
    erroresConsecutivos.value++;
    // A partir del 3er fallo seguido, se prepara el resaltado para
    // la SIGUIENTE pregunta
    if (erroresConsecutivos.value >= 3) {
      palabraAResaltar.value = respuesta.data.palabraIncorrecta;
    }
  }
}

async function siguientePregunta() {
  if (esUltimaPregunta.value) {
    await finalizarRonda();
    return;
  }

  indiceActual.value++;
  respuestaUsuario.value = '';
  mostrandoResultado.value = false;
  ultimoResultado.value = null;
}

async function finalizarRonda() {
  terminado.value = true;

  await progresoStore.registrarResultado({
    ejercicioClave: 'CU-EJ-03',
    nivelNumero: numeroNivel.value,
    puntosObtenidos: puntosGanados.value,
    aciertos: aciertos.value,
    errores: erroresCount.value,
  });
}

// Se calcula aparte de "aciertos", para dejar clarísimo en la
// plantilla la condición real de avance: los 5 correctos, ni uno menos
const rondaFuePerfecta = computed(() => aciertos.value === TOTAL_PREGUNTAS_RONDA);

function reiniciar() {
  indiceActual.value = 0;
  respuestaUsuario.value = '';
  mostrandoResultado.value = false;
  ultimoResultado.value = null;
  aciertos.value = 0;
  erroresCount.value = 0;
  erroresConsecutivos.value = 0;
  terminado.value = false;
  palabraAResaltar.value = null;
  cargarPreguntas();
}

onMounted(cargarPreguntas);
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
  margin-bottom: 1rem;
}

.instruccion {
  color: var(--color-texto-secundario);
  margin-bottom: 1.2rem;
}

.nota-avance {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.caja-oracion {
  background: #f7f7f0;
  border-radius: 12px;
  padding: 1.2rem;
  font-size: 1.15rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.caja-oracion :deep(.palabra-resaltada) {
  color: var(--color-primario);
  text-decoration: underline;
}

.formulario-respuesta {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.input-respuesta {
  padding: 0.7rem 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  font-size: 1rem;
}

.input-respuesta:focus {
  outline: 2px solid var(--color-primario);
  border-color: var(--color-primario);
}

.resultado {
  font-weight: 600;
  padding: 0.6rem;
  border-radius: 8px;
}

.resultado.correcto {
  background: #e6f4ea;
  color: #1e7e34;
}

.resultado.incorrecto {
  background: #fdecea;
  color: #c0392b;
}

.btn-primario {
  padding: 0.7rem;
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

.contador-preguntas {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
}

.tarjeta-resultado-final {
  text-align: center;
}

.emoji-final {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.grid-resultados {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.dato-resultado {
  background: #f7f7f0;
  border-radius: 12px;
  padding: 1rem 0.5rem;
}

.numero-dato {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primario);
}

.etiqueta-dato {
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
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