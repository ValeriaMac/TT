<template>
  <div class="pagina-ejercicio">
    <h1 class="titulo-pagina">Lluvia</h1>

    <div v-if="cargando" class="tarjeta-ejercicio">Cargando...</div>

    <div v-else-if="errorCarga" class="tarjeta-ejercicio">
      <p class="resultado incorrecto">{{ errorCarga }}</p>
      <button class="btn-primario" @click="cargarConfiguracion">Reintentar</button>
    </div>

    <!-- Ya completó los 5 niveles x 5 subniveles -->
    <div v-else-if="ejercicioCompletado && !terminado && !jugarLibre && !jugando" class="tarjeta-ejercicio tarjeta-resultado-final">
      <div class="emoji-final">🏆</div>
      <h2>¡Completaste todo el ejercicio!</h2>
      <p class="nota-avance">Ya pasaste los 5 niveles con sus 5 subniveles cada uno. Puedes seguir practicando libremente.</p>
      <button class="btn-primario" @click="jugarLibre = true">Practicar de todos modos</button>
    </div>

    <!-- Pantalla de inicio de ronda -->
    <div v-else-if="!jugando && !terminado" class="tarjeta-ejercicio">
      <p class="indicador-nivel">Nivel {{ numeroNivel }} · Subnivel {{ subnivelActual }} de 5</p>
      <p class="instruccion-grande">
        Atrapa las letras que se van marcando arriba — la letra a atrapar
        va <strong>cambiando</strong> cada rato, ¡mantente alerta! Tienes 4 vidas;
        pierdes una si se te escapa la letra correcta o atrapas una equivocada.
      </p>
      <p class="instruccion-teclado">
        Puedes darle clic a la letra, o escribirla en tu teclado.
      </p>
      <p class="instruccion-meta">Necesitas {{ umbralParaAvanzar }} aciertos antes de perder tus vidas para subir de subnivel.</p>
      <button class="btn-primario" @click="comenzarJuego">▶ Comenzar</button>
    </div>

    <!-- Juego en curso (infinito hasta perder las 4 vidas) -->
    <div v-else-if="jugando" class="tarjeta-juego">
      <div class="barra-superior-juego">
        <span>Atrapa: <strong class="letra-destacada">{{ objetivoActual }}</strong></span>
        <span class="vidas">
          <span v-for="n in 4" :key="n">{{ n <= vidas ? '❤️' : '🖤' }}</span>
        </span>
        <span>Aciertos: {{ aciertos }} / {{ umbralParaAvanzar }}</span>
      </div>

      <div class="area-caida" ref="areaCaidaRef">
        <div class="lluvia-decorativa">
          <span v-for="n in 12" :key="n" class="gota" :style="{ left: (n * 8) + '%', animationDelay: (n * 0.25) + 's' }"></span>
        </div>

        <div
          v-for="letra in letrasActivas"
          :key="letra.id"
          class="letra-cayendo"
          :class="{ 'letra-atrapada': letra.atrapada, 'letra-fallida': letra.fallida }"
          :style="{ top: letra.top + 'px', left: letra.left + '%' }"
          @click="atraparLetra(letra)"
        >
          {{ letra.caracter }}
        </div>

        <div
          v-for="efecto in efectosFlotantes"
          :key="efecto.id"
          class="efecto-flotante"
          :class="efecto.tipo"
          :style="{ top: efecto.top + 'px', left: efecto.left + '%' }"
        >
          {{ efecto.texto }}
        </div>
      </div>

      <p v-if="rachaActual >= 2" class="texto-racha">🔥 ¡Racha x{{ rachaActual }}!</p>
    </div>

    <!-- Pantalla final: perdiste las 4 vidas -->
    <div v-else class="tarjeta-ejercicio tarjeta-resultado-final">
      <div class="emoji-final">{{ avanzaste ? '🎉' : '💪' }}</div>
      <h2>{{ avanzaste ? '¡Llegaste a la meta! Subiste de subnivel' : 'Sigue practicando' }}</h2>
      <p class="nota-avance">
        {{ avanzaste
          ? `Atrapaste ${aciertos} letras antes de quedarte sin vidas — ¡superaste las ${umbralParaAvanzar} necesarias!`
          : `Atrapaste ${aciertos} de las ${umbralParaAvanzar} que necesitabas. Te quedaste en el Nivel ${numeroNivel} · Subnivel ${subnivelActual}.` }}
      </p>

      <div class="grid-resultados">
        <div class="dato-resultado">
          <div class="numero-dato">{{ aciertos }}</div>
          <div class="etiqueta-dato">Atrapadas</div>
        </div>
        <div class="dato-resultado">
          <div class="numero-dato">{{ rachaMaxima }}</div>
          <div class="etiqueta-dato">Mejor racha</div>
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

const ALTURA_AREA = 350; // px, debe coincidir con el CSS de .area-caida
const VIDAS_INICIALES = 4;

// ===== Ajustes de dificultad progresiva (mientras más dura la ronda, más difícil) =====
const INTERVALO_AUMENTO_DIFICULTAD_MS = 12000; // cada 12s todo se pone un poco más rápido
const FACTOR_AUMENTO_DIFICULTAD = 1.12;         // +12% de dificultad en cada paso
const VELOCIDAD_MINIMA_MS = 700;                // nunca cae más rápido que esto (jugable)
const INTERVALO_SPAWN_BASE_MS = 900;             // cada cuánto nace una letra nueva, al inicio
const INTERVALO_SPAWN_MINIMO_MS = 350;

// Cada cuánto cambia la letra objetivo (estilo "Guitar Hero": el
// blanco se va moviendo, no te puedes quedar memorizando solo uno)
const INTERVALO_ROTACION_OBJETIVO_MS = 8000;

const cargando = ref(true);
const errorCarga = ref('');
const poolLetras = ref([]); // todas las letras posibles de este nivel (objetivo + distractores)
const velocidadBaseMs = ref(3000);

const numeroNivel = ref(1);
const subnivelActual = ref(1);
const ejercicioCompletado = ref(false);
const jugarLibre = ref(false);

// Cuántos aciertos hacen falta para que, al perder las 4 vidas, esa
// ronda cuente como "superada" y suba de subnivel — sube un poco en
// cada nivel para que siga siendo un reto real
const umbralParaAvanzar = computed(() => 10 + (numeroNivel.value - 1) * 2);

const jugando = ref(false);
const terminado = ref(false);
const avanzaste = ref(false);
const vidas = ref(VIDAS_INICIALES);
const objetivoActual = ref('');
const letrasActivas = ref([]);
const aciertos = ref(0);
const puntosGanados = ref(0);

const rachaActual = ref(0);
const rachaMaxima = ref(0);
const efectosFlotantes = ref([]);

let idSiguiente = 0;
let idEfecto = 0;
let intervaloJuego = null;

// Se miden en "tiempo transcurrido desde que empezó la ronda", para
// poder decidir cuándo toca subir la dificultad, cuándo toca rotar el
// objetivo, y cuándo toca que nazca la siguiente letra — todo dentro
// de un único ciclo (más fácil de seguir que varios timers sueltos)
let msTranscurridos = 0;
let msParaSiguienteSpawn = 0;
let msDesdeUltimaRotacion = 0;
let msDesdeUltimoAumento = 0;
let factorDificultadActual = 1;

// ===== Sonido: tonos simples con Web Audio API, sin archivos externos =====
let audioContext = null;
function obtenerAudioContext() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  return audioContext;
}
function reproducirTono(frecuencia, duracionMs, tipoOnda = 'sine') {
  try {
    const ctx = obtenerAudioContext();
    const oscilador = ctx.createOscillator();
    const ganancia = ctx.createGain();
    oscilador.type = tipoOnda;
    oscilador.frequency.value = frecuencia;
    oscilador.connect(ganancia);
    ganancia.connect(ctx.destination);
    ganancia.gain.setValueAtTime(0.15, ctx.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracionMs / 1000);
    oscilador.start();
    oscilador.stop(ctx.currentTime + duracionMs / 1000);
  } catch (error) {
    console.warn('No se pudo reproducir sonido:', error);
  }
}
function sonidoAcierto() { reproducirTono(700, 120); }
function sonidoError() { reproducirTono(180, 220, 'sawtooth'); }
function sonidoVidaPerdida() { reproducirTono(120, 350, 'square'); }

async function cargarConfiguracion() {
  cargando.value = true;
  errorCarga.value = '';
  try {
    const respuesta = await api.get('/ejercicios/lluvia');
    poolLetras.value = [respuesta.data.letraObjetivo, ...respuesta.data.distractores];
    velocidadBaseMs.value = respuesta.data.velocidadCaidaMs;
    numeroNivel.value = respuesta.data.numeroNivel;
    subnivelActual.value = respuesta.data.subnivel;
    ejercicioCompletado.value = respuesta.data.ejercicioCompletado;
  } catch (error) {
    console.error('No se pudo cargar la configuración:', error);
    errorCarga.value = error.response?.data?.mensaje || 'No se pudo conectar con el servidor.';
  } finally {
    cargando.value = false;
  }
}

function elegirNuevoObjetivo() {
  if (poolLetras.value.length <= 1) {
    objetivoActual.value = poolLetras.value[0];
    return;
  }
  // Elige una letra del pool distinta a la actual, para que sí se
  // sienta como un cambio real cada vez
  let candidatas = poolLetras.value.filter((l) => l !== objetivoActual.value);
  objetivoActual.value = candidatas[Math.floor(Math.random() * candidatas.length)];
}

function comenzarJuego() {
  vidas.value = VIDAS_INICIALES;
  aciertos.value = 0;
  rachaActual.value = 0;
  rachaMaxima.value = 0;
  letrasActivas.value = [];
  efectosFlotantes.value = [];

  msTranscurridos = 0;
  msParaSiguienteSpawn = 0;
  msDesdeUltimaRotacion = 0;
  msDesdeUltimoAumento = 0;
  factorDificultadActual = 1;

  elegirNuevoObjetivo();

  jugando.value = true;
  terminado.value = false;

  iniciarGameLoop();
}

function nacerLetra() {
  // Un poco más de la mitad de las letras que nacen son el objetivo
  // actual, para que atraparlo siga siendo frecuente
  const esObjetivo = Math.random() < 0.55;
  const caracter = esObjetivo
    ? objetivoActual.value
    : poolLetras.value.filter((l) => l !== objetivoActual.value)[
        Math.floor(Math.random() * Math.max(1, poolLetras.value.length - 1))
      ] || objetivoActual.value;

  const velocidadPropia = Math.max(VELOCIDAD_MINIMA_MS, velocidadBaseMs.value / factorDificultadActual);

  letrasActivas.value.push({
    id: idSiguiente++,
    caracter,
    // El objetivo se "graba" en la letra al nacer — si el objetivo
    // cambia mientras esta letra sigue cayendo, ya no le afecta
    objetivoAlNacer: objetivoActual.value,
    top: 0,
    left: 10 + Math.random() * 75,
    atrapada: false,
    fallida: false,
    velocidadPropiaMs: velocidadPropia,
  });
}

function mostrarEfectoFlotante(letra, texto, tipo) {
  const efecto = { id: idEfecto++, texto, tipo, top: letra.top, left: letra.left };
  efectosFlotantes.value.push(efecto);
  setTimeout(() => {
    efectosFlotantes.value = efectosFlotantes.value.filter((e) => e.id !== efecto.id);
  }, 800);
}

function perderVida() {
  vidas.value--;
  rachaActual.value = 0;
  sonidoVidaPerdida();
  if (vidas.value <= 0) {
    finalizarJuego();
  }
}

function atraparLetra(letra) {
  if (letra.atrapada || letra.fallida || !jugando.value) return;

  letra.atrapada = true;
  const eraObjetivo = letra.caracter === letra.objetivoAlNacer;

  if (eraObjetivo) {
    aciertos.value++;
    rachaActual.value++;
    rachaMaxima.value = Math.max(rachaMaxima.value, rachaActual.value);
    sonidoAcierto();
    mostrarEfectoFlotante(letra, '+1', 'efecto-acierto');
  } else {
    sonidoError();
    mostrarEfectoFlotante(letra, '✕', 'efecto-error');
    perderVida();
  }
}

const PASOS_POR_SEGUNDO = 30;
const MS_POR_PASO = 1000 / PASOS_POR_SEGUNDO;

function iniciarGameLoop() {
  clearInterval(intervaloJuego);

  intervaloJuego = setInterval(() => {
    if (!jugando.value) return;

    msTranscurridos += MS_POR_PASO;
    msParaSiguienteSpawn -= MS_POR_PASO;
    msDesdeUltimaRotacion += MS_POR_PASO;
    msDesdeUltimoAumento += MS_POR_PASO;

    // 1) ¿Toca aumentar la dificultad?
    if (msDesdeUltimoAumento >= INTERVALO_AUMENTO_DIFICULTAD_MS) {
      msDesdeUltimoAumento = 0;
      factorDificultadActual *= FACTOR_AUMENTO_DIFICULTAD;
    }

    // 2) ¿Toca rotar el objetivo? (estilo Guitar Hero)
    if (msDesdeUltimaRotacion >= INTERVALO_ROTACION_OBJETIVO_MS) {
      msDesdeUltimaRotacion = 0;
      elegirNuevoObjetivo();
    }

    // 3) ¿Toca que nazca una letra nueva?
    if (msParaSiguienteSpawn <= 0) {
      nacerLetra();
      const intervaloSpawnActual = Math.max(
        INTERVALO_SPAWN_MINIMO_MS,
        INTERVALO_SPAWN_BASE_MS / factorDificultadActual
      );
      msParaSiguienteSpawn = intervaloSpawnActual;
    }

    // 4) Mover las letras que ya están cayendo
    letrasActivas.value.forEach((letra) => {
      if (letra.atrapada || letra.fallida) return;
      const incremento = ALTURA_AREA / (letra.velocidadPropiaMs / MS_POR_PASO);
      letra.top += incremento;

      if (letra.top >= ALTURA_AREA) {
        letra.fallida = true;
        if (letra.caracter === letra.objetivoAlNacer) {
          // Se le escapó una letra que sí había que atrapar
          perderVida();
        }
      }
    });

    // 5) Limpieza: no dejar crecer el arreglo para siempre (esto es
    // infinito, así que hay que quitar las que ya se resolvieron)
    if (letrasActivas.value.length > 30) {
      letrasActivas.value = letrasActivas.value.filter((l) => !l.atrapada && !l.fallida);
    }
  }, MS_POR_PASO);
}

function finalizarJuego() {
  clearInterval(intervaloJuego);
  jugando.value = false;
  terminado.value = true;

  avanzaste.value = aciertos.value >= umbralParaAvanzar.value;

  // 100 puntos exactos si llegaste a la meta (esto es lo único que el
  // sistema de niveles revisa para decidir si subes de subnivel);
  // si no, una puntuación parcial proporcional, limitada a 90 para
  // que nunca se confunda con un 100 real
  puntosGanados.value = avanzaste.value
    ? 100
    : Math.min(90, Math.round((aciertos.value / umbralParaAvanzar.value) * 90));

  progresoStore.registrarResultado({
    ejercicioClave: 'CU-EJ-05',
    nivelNumero: numeroNivel.value,
    puntosObtenidos: puntosGanados.value,
    aciertos: aciertos.value,
    errores: VIDAS_INICIALES, // siempre termina al perder las 4 vidas
  });
}

function reiniciar() {
  terminado.value = false;
  cargarConfiguracion();
}

function manejarTecla(evento) {
  if (!jugando.value) return;
  const teclaPresionada = evento.key.toLowerCase();
  const letraCoincidente = letrasActivas.value.find(
    (letra) => !letra.atrapada && !letra.fallida && letra.caracter.toLowerCase() === teclaPresionada
  );
  if (letraCoincidente) atraparLetra(letraCoincidente);
}

onMounted(() => {
  cargarConfiguracion();
  window.addEventListener('keydown', manejarTecla);
});

onUnmounted(() => {
  clearInterval(intervaloJuego);
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

.tarjeta-ejercicio,
.tarjeta-juego {
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

.instruccion-grande {
  font-size: 1.05rem;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.letra-destacada {
  color: var(--color-primario);
  font-size: 1.3rem;
}

.instruccion-teclado,
.instruccion-meta {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
  margin-bottom: 0.6rem;
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
  margin-top: 1rem;
}

.btn-primario:hover {
  background-color: var(--color-primario-hover);
}

.barra-superior-juego {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-weight: 600;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.vidas {
  font-size: 1.1rem;
}

.area-caida {
  position: relative;
  height: 350px;
  background: linear-gradient(to bottom, #eef4f8, #f7f7f0);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--color-borde);
}

.lluvia-decorativa {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.gota {
  position: absolute;
  top: -20px;
  width: 2px;
  height: 16px;
  background: rgba(92, 122, 63, 0.15);
  border-radius: 2px;
  animation: caer-gota 2.5s linear infinite;
}

@keyframes caer-gota {
  from { transform: translateY(-20px); }
  to { transform: translateY(370px); }
}

.texto-racha {
  text-align: center;
  font-weight: 600;
  color: #e67e22;
  margin-top: 0.8rem;
  font-size: 1.1rem;
}

.efecto-flotante {
  position: absolute;
  font-weight: 700;
  font-size: 1.2rem;
  pointer-events: none;
  z-index: 5;
  animation: flotar-arriba 0.8s ease-out forwards;
}

.efecto-flotante.efecto-acierto { color: #1e7e34; }
.efecto-flotante.efecto-error { color: #c0392b; }

@keyframes flotar-arriba {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-40px); }
}

.letra-cayendo {
  position: absolute;
  z-index: 2;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 2px solid var(--color-primario);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s, transform 0.2s;
}

.letra-cayendo.letra-atrapada {
  opacity: 0;
  transform: scale(1.4);
  pointer-events: none;
}

.letra-cayendo.letra-fallida {
  opacity: 0;
  pointer-events: none;
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