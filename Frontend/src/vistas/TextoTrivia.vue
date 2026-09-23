<template>
  <div class="pagina-ejercicio">
    <h1 class="titulo-pagina">Texto + trivia</h1>

    <div v-if="cargando" class="tarjeta-ejercicio">Cargando lectura...</div>

    <div v-else-if="errorCarga" class="tarjeta-ejercicio">
      <p class="resultado incorrecto">{{ errorCarga }}</p>
      <button class="btn-primario" @click="cargarPreguntas">Reintentar</button>
    </div>

    <!-- Ya completó los 5 niveles x 5 subniveles -->
    <div v-else-if="ejercicioCompletado && !terminado && !jugarLibre" class="tarjeta-ejercicio tarjeta-resultado-final">
      <div class="emoji-final">🏆</div>
      <h2>¡Completaste todo el ejercicio!</h2>
      <p class="nota-avance">Ya pasaste los 5 niveles con sus 5 subniveles cada uno. Puedes seguir practicando libremente.</p>
      <button class="btn-primario" @click="jugarLibre = true">Practicar de todos modos</button>
    </div>

    <!-- Fase 1: solo lectura, sin preguntas visibles todavía -->
    <div v-else-if="!terminado && faseLectura" class="tarjeta-ejercicio">
      <p class="indicador-nivel">Nivel {{ numeroNivel }} · Subnivel {{ subnivelActual }} de 5</p>

      <div class="caja-lectura">
        <p class="etiqueta-lectura">Lee este texto con calma:</p>
        {{ textoLectura }}
      </div>

      <button class="btn-primario" @click="faseLectura = false">Empezar trivia</button>
    </div>

    <!-- Fase 2: ronda de preguntas en curso -->
    <div v-else-if="!terminado" class="tarjeta-ejercicio">
      <p class="indicador-nivel">Nivel {{ numeroNivel }} · Subnivel {{ subnivelActual }} de 5</p>

      <div class="caja-lectura">
        <p class="etiqueta-lectura">Lee este texto:</p>
        {{ textoLectura }}
      </div>

      <p class="pregunta-actual">{{ preguntaActual?.pregunta }}</p>

      <div class="opciones-respuesta">
        <button
          v-for="opcion in preguntaActual?.opciones"
          :key="opcion"
          class="btn-opcion"
          :class="{
            'opcion-seleccionada': opcionElegida === opcion,
            'opcion-correcta': mostrandoResultado && opcion === ultimoResultado?.respuestaCorrecta,
            'opcion-incorrecta': mostrandoResultado && opcionElegida === opcion && !ultimoResultado?.correcto
          }"
          :disabled="mostrandoResultado"
          @click="elegirOpcion(opcion)"
        >
          {{ opcion }}
        </button>
      </div>

      <button
        v-if="!mostrandoResultado"
        class="btn-primario"
        :disabled="!opcionElegida"
        @click="responder"
      >
        Comprobar
      </button>
      <button v-else class="btn-primario" @click="siguientePregunta">
        {{ esUltimaPregunta ? 'Ver resultados' : 'Siguiente' }}
      </button>

      <p class="contador-preguntas">Pregunta {{ indiceActual + 1 }} de {{ preguntas.length }}</p>
    </div>

    <!-- Pantalla final -->
    <div v-else class="tarjeta-ejercicio tarjeta-resultado-final">
      <div class="emoji-final">{{ aciertos === preguntas.length ? '🎉' : '💪' }}</div>
      <h2>{{ aciertos === preguntas.length ? '¡Todas correctas! Subiste de subnivel' : 'Sigue practicando' }}</h2>
      <p v-if="aciertos < preguntas.length" class="nota-avance">
        Necesitas acertar todas para subir de subnivel. Te quedaste en el Nivel {{ numeroNivel }} · Subnivel {{ subnivelActual }}.
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

const cargando = ref(true);
const errorCarga = ref('');
const faseLectura = ref(true); // empieza mostrando solo el texto, sin preguntas
const textoLectura = ref('');
const preguntas = ref([]);
const indiceActual = ref(0);
const opcionElegida = ref(null);
const mostrandoResultado = ref(false);
const ultimoResultado = ref(null);
const aciertos = ref(0);
const erroresCount = ref(0);
const terminado = ref(false);

const numeroNivel = ref(1);
const subnivelActual = ref(1);
const ejercicioCompletado = ref(false);
const jugarLibre = ref(false);

const preguntaActual = computed(() => preguntas.value[indiceActual.value]);
const esUltimaPregunta = computed(() => indiceActual.value === preguntas.value.length - 1);

// Se escala a 100 en una ronda perfecta sin importar cuántas preguntas
// tenga la ronda, igual que en Tarjetas
const puntosGanados = computed(() =>
  preguntas.value.length > 0 ? Math.round((aciertos.value / preguntas.value.length) * 100) : 0
);

async function cargarPreguntas() {
  cargando.value = true;
  errorCarga.value = '';
  try {
    const respuesta = await api.get('/ejercicios/texto-trivia');
    textoLectura.value = respuesta.data.textoLectura;
    preguntas.value = respuesta.data.preguntas;
    numeroNivel.value = respuesta.data.numeroNivel;
    subnivelActual.value = respuesta.data.subnivel;
    ejercicioCompletado.value = respuesta.data.ejercicioCompletado;
  } catch (error) {
    console.error('No se pudieron cargar las preguntas:', error);
    errorCarga.value = error.response?.data?.mensaje || 'No se pudo conectar con el servidor.';
  } finally {
    cargando.value = false;
  }
}

function elegirOpcion(opcion) {
  if (mostrandoResultado.value) return;
  opcionElegida.value = opcion;
}

async function responder() {
  if (!opcionElegida.value) return;

  const respuesta = await api.post('/ejercicios/texto-trivia/verificar', {
    preguntaId: preguntaActual.value.id,
    respuesta: opcionElegida.value,
  });

  ultimoResultado.value = respuesta.data;
  mostrandoResultado.value = true;

  if (respuesta.data.correcto) aciertos.value++;
  else erroresCount.value++;
}

async function siguientePregunta() {
  if (esUltimaPregunta.value) {
    await finalizarRonda();
    return;
  }
  indiceActual.value++;
  opcionElegida.value = null;
  mostrandoResultado.value = false;
  ultimoResultado.value = null;
}

async function finalizarRonda() {
  terminado.value = true;
  await progresoStore.registrarResultado({
    ejercicioClave: 'CU-EJ-01',
    nivelNumero: numeroNivel.value,
    puntosObtenidos: puntosGanados.value,
    aciertos: aciertos.value,
    errores: erroresCount.value,
  });
}

function reiniciar() {
  indiceActual.value = 0;
  opcionElegida.value = null;
  mostrandoResultado.value = false;
  ultimoResultado.value = null;
  aciertos.value = 0;
  erroresCount.value = 0;
  terminado.value = false;
  faseLectura.value = true;
  cargarPreguntas();
}

onMounted(cargarPreguntas);
</script>

<style scoped>
.pagina-ejercicio {
  max-width: 650px;
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

.caja-lectura {
  background: #f7f7f0;
  border-radius: 12px;
  padding: 1.3rem;
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.etiqueta-lectura {
  font-weight: 600;
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.pregunta-actual {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.opciones-respuesta {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.2rem;
}

.btn-opcion {
  text-align: left;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: white;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-opcion:hover:not(:disabled) {
  background: #f5f5f0;
}

.btn-opcion.opcion-seleccionada {
  border-color: var(--color-primario);
  background: #eef4e8;
}

.btn-opcion.opcion-correcta {
  background: #e6f4ea;
  border-color: #1e7e34;
  color: #1e7e34;
}

.btn-opcion.opcion-incorrecta {
  background: #fdecea;
  border-color: #c0392b;
  color: #c0392b;
}

.btn-opcion:disabled {
  cursor: not-allowed;
}

.contador-preguntas {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
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

.btn-primario {
  width: 100%;
  padding: 0.7rem;
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: var(--radio-boton);
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  box-sizing: border-box;
}

.btn-primario:hover:not(:disabled) {
  background-color: var(--color-primario-hover);
}

.btn-primario:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.resultado.incorrecto {
  color: #c0392b;
  margin-bottom: 1rem;
}
</style>