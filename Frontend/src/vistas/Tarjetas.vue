<template>
  <div class="pagina-ejercicio">
    <h1 class="titulo-pagina">Tarjetas</h1>

    <div v-if="cargando" class="tarjeta-ejercicio">Cargando tarjetas...</div>

    <div v-else-if="errorCarga" class="tarjeta-ejercicio">
      <p class="resultado incorrecto">{{ errorCarga }}</p>
      <button class="btn-primario" @click="cargarTarjetas">Reintentar</button>
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
      <p class="instruccion">
        ¿Esto tiene una <strong>{{ tarjetaActual?.letraIzquierda }}</strong>
        o una <strong>{{ tarjetaActual?.letraDerecha }}</strong>?
        Presiona el botón de esa letra (o usa las flechas ← →)
      </p>

      <div class="caja-palabra" :class="{ 'resaltado-correcto': ultimoResultado?.correcto === true, 'resaltado-incorrecto': ultimoResultado?.correcto === false }">
        {{ tarjetaActual?.palabra }}
      </div>

      <div class="barra-tiempo-contenedor">
        <div class="barra-tiempo" :style="{ width: (tiempoRestante / TIEMPO_POR_TARJETA * 100) + '%' }"></div>
      </div>

      <div class="botones-decision">
        <button class="btn-decision btn-izquierda" :disabled="mostrandoResultado" @click="responder('izquierda')">
          ← {{ tarjetaActual?.letraIzquierda }}
        </button>
        <button class="btn-decision btn-derecha" :disabled="mostrandoResultado" @click="responder('derecha')">
          {{ tarjetaActual?.letraDerecha }} →
        </button>
      </div>

      <p v-if="mostrandoResultado" class="resultado" :class="{ correcto: ultimoResultado.correcto, incorrecto: !ultimoResultado.correcto }">
        <span v-if="ultimoResultado.correcto">✓ ¡Bien!</span>
        <span v-else>
          ✕ Era con {{ ultimoResultado.respuestaCorrecta === 'izquierda' ? tarjetaActual?.letraIzquierda : tarjetaActual?.letraDerecha }}
        </span>
      </p>

      <p class="contador-tarjetas">Tarjeta {{ indiceActual + 1 }} de {{ tarjetas.length }}</p>
    </div>

    <!-- Pantalla final -->
    <div v-else class="tarjeta-ejercicio tarjeta-resultado-final">
      <div class="emoji-final">{{ aciertos === tarjetas.length ? '🎉' : '💪' }}</div>
      <h2>{{ aciertos === tarjetas.length ? '¡Todas correctas! Subiste de subnivel' : 'Sigue practicando' }}</h2>
      <p v-if="aciertos < tarjetas.length" class="nota-avance">
        Necesitas acertar todas para subir de subnivel. Te quedaste en el Nivel {{ numeroNivel }} · Subnivel {{ subnivelActual }}.
      </p>

      <div class="grid-resultados">
        <div class="dato-resultado">
          <div class="numero-dato">{{ aciertos }}</div>
          <div class="etiqueta-dato">Correctas</div>
        </div>
        <div class="dato-resultado">
          <div class="numero-dato">{{ tarjetas.length }}</div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '@/servicios/api';
import { useProgresoStore } from '@/store/progreso.store';

const progresoStore = useProgresoStore();

const TIEMPO_POR_TARJETA = 5; // segundos para decidir cada tarjeta

const cargando = ref(true);
const errorCarga = ref('');
const tarjetas = ref([]);
const indiceActual = ref(0);
const mostrandoResultado = ref(false);
const ultimoResultado = ref(null);
const aciertos = ref(0);
const erroresCount = ref(0);
const terminado = ref(false);
const tiempoRestante = ref(TIEMPO_POR_TARJETA);

const numeroNivel = ref(1);
const subnivelActual = ref(1);
const ejercicioCompletado = ref(false);
const jugarLibre = ref(false);

let intervaloTiempo = null;

const tarjetaActual = computed(() => tarjetas.value[indiceActual.value]);

// Se escala a 100 en una ronda perfecta SIN IMPORTAR cuántas tarjetas
// tenga la ronda (puede variar según cuánto contenido haya por
// subnivel) — así "ronda perfecta = 100 puntos" se cumple siempre,
// que es lo que usa determinarNivelYSubnivel para saber si subes.
const puntosGanados = computed(() =>
  tarjetas.value.length > 0 ? Math.round((aciertos.value / tarjetas.value.length) * 100) : 0
);

async function cargarTarjetas() {
  cargando.value = true;
  errorCarga.value = '';
  try {
    const respuesta = await api.get('/ejercicios/tarjetas');
    tarjetas.value = respuesta.data.tarjetas;
    numeroNivel.value = respuesta.data.numeroNivel;
    subnivelActual.value = respuesta.data.subnivel;
    ejercicioCompletado.value = respuesta.data.ejercicioCompletado;
    iniciarTemporizadorTarjeta();
  } catch (error) {
    console.error('No se pudieron cargar las tarjetas:', error);
    errorCarga.value = error.response?.data?.mensaje || 'No se pudo conectar con el servidor.';
  } finally {
    cargando.value = false;
  }
}

function iniciarTemporizadorTarjeta() {
  clearInterval(intervaloTiempo);
  tiempoRestante.value = TIEMPO_POR_TARJETA;

  intervaloTiempo = setInterval(() => {
    tiempoRestante.value -= 0.1;
    if (tiempoRestante.value <= 0) {
      clearInterval(intervaloTiempo);
      // Se acabó el tiempo sin responder: cuenta como fallo
      responder(null);
    }
  }, 100);
}

async function responder(respuestaUsuario) {
  if (mostrandoResultado.value) return;
  clearInterval(intervaloTiempo);

  if (respuestaUsuario === null) {
    // Se agotó el tiempo: no se llama al backend, se marca directo como error
    ultimoResultado.value = { correcto: false, respuestaCorrecta: 'tiempo agotado' };
    erroresCount.value++;
  } else {
    const respuesta = await api.post('/ejercicios/tarjetas/verificar', {
      tarjetaId: tarjetaActual.value.id,
      respuestaUsuario,
    });
    ultimoResultado.value = respuesta.data;
    if (respuesta.data.correcto) aciertos.value++;
    else erroresCount.value++;
  }

  mostrandoResultado.value = true;

  setTimeout(() => {
    if (indiceActual.value === tarjetas.value.length - 1) {
      finalizarRonda();
    } else {
      indiceActual.value++;
      mostrandoResultado.value = false;
      ultimoResultado.value = null;
      iniciarTemporizadorTarjeta();
    }
  }, 1200);
}

async function finalizarRonda() {
  terminado.value = true;

  await progresoStore.registrarResultado({
    ejercicioClave: 'CU-EJ-04',
    nivelNumero: numeroNivel.value,
    puntosObtenidos: puntosGanados.value,
    aciertos: aciertos.value,
    errores: erroresCount.value,
  });
}

function reiniciar() {
  indiceActual.value = 0;
  mostrandoResultado.value = false;
  ultimoResultado.value = null;
  aciertos.value = 0;
  erroresCount.value = 0;
  terminado.value = false;
  cargarTarjetas();
}

// Soporte de teclado: flecha izquierda = B, flecha derecha = D —
// practica también la asociación letra/dirección, no solo el clic
function manejarTecla(evento) {
  if (mostrandoResultado.value || terminado.value) return;
  if (evento.key === 'ArrowLeft') responder('izquierda');
  else if (evento.key === 'ArrowRight') responder('derecha');
}

onMounted(() => {
  cargarTarjetas();
  window.addEventListener('keydown', manejarTecla);
});

onUnmounted(() => {
  clearInterval(intervaloTiempo);
  window.removeEventListener('keydown', manejarTecla);
});
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
  text-align: center;
}

.caja-palabra {
  background: #f7f7f0;
  border-radius: 12px;
  padding: 2.5rem 1rem;
  font-size: 2.2rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
  transition: background-color 0.2s;
}

.caja-palabra.resaltado-correcto {
  background: #e6f4ea;
}

.caja-palabra.resaltado-incorrecto {
  background: #fdecea;
}

.barra-tiempo-contenedor {
  height: 6px;
  background: #eee;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.barra-tiempo {
  height: 100%;
  background: var(--color-primario);
  transition: width 0.1s linear;
}

.botones-decision {
  display: flex;
  gap: 1rem;
}

.btn-decision {
  flex: 1;
  padding: 1rem;
  border-radius: var(--radio-boton);
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
}

.btn-izquierda {
  background: #eef4e8;
  color: var(--color-primario);
}

.btn-izquierda:hover:not(:disabled) {
  background: var(--color-primario);
  color: white;
}

.btn-derecha {
  background: #eef4e8;
  color: var(--color-primario);
}

.btn-derecha:hover:not(:disabled) {
  background: var(--color-primario);
  color: white;
}

.btn-decision:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.resultado {
  text-align: center;
  font-weight: 600;
  margin-top: 1rem;
}

.resultado.correcto {
  color: #1e7e34;
}

.resultado.incorrecto {
  color: #c0392b;
}

.contador-tarjetas {
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