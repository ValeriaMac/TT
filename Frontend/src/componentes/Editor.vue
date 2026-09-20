<!--
  Editor.vue — Módulo de escritura (CU-SIS-10, RF_13, RF_14)
  Corrector ortográfico interactivo: resalta palabras con error
  y muestra sugerencias al hacer clic sobre ellas.
-->
<template>
  <div class="editor-contenedor" :style="estilosPersonalizacion">
    <!-- Dos capas superpuestas: el textarea real (texto invisible)
         y un div debajo que pinta el resaltado de errores -->
    <div class="editor-envoltura">
      <textarea
        v-model="texto"
        @input="alEscribir"
        class="editor-textarea"
        placeholder="Escribe aquí..."
      ></textarea>

      <div
        class="editor-resaltado"
        v-html="textoConResaltado"
        @click="mostrarSugerencias"
      ></div>
    </div>

    <p class="editor-estado">
      <span v-if="revisando">Revisando ortografía...</span>
      <span v-else-if="errores.length === 0 && texto.length > 0">
        Sin errores detectados ✓
      </span>
      <span v-else-if="errores.length > 0">
        {{ errores.length }} posible(s) error(es) ortográfico(s)
      </span>
    </p>

    <!-- Menú de sugerencias al hacer clic en una palabra marcada -->
    <div
      v-if="palabraSeleccionada"
      class="menu-sugerencias"
      :style="{ top: posicionMenu.y + 'px', left: posicionMenu.x + 'px' }"
    >
      <p class="menu-titulo">"{{ palabraSeleccionada.palabra }}"</p>
      <ul>
        <li
          v-for="sugerencia in palabraSeleccionada.sugerencias"
          :key="sugerencia"
          @click="aplicarSugerencia(sugerencia)"
        >
          {{ sugerencia }}
        </li>
        <li v-if="palabraSeleccionada.sugerencias.length === 0" class="menu-sin-sugerencias">
          Sin sugerencias disponibles
        </li>
      </ul>
      <button @click="ignorarPalabra" class="menu-ignorar">Ignorar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useEstilosPersonalizacion } from '@/composables/useEstilosPersonalizacion';
import { useConfiguracionStore } from '@/store/configuracion.store';

const configuracionStore = useConfiguracionStore();
const { estilosPersonalizacion } = useEstilosPersonalizacion();

onMounted(() => {
  // Si el usuario llegó directo a /escritura sin pasar antes por otra
  // vista que ya haya cargado su configuración, se carga aquí
  if (!configuracionStore.config) {
    configuracionStore.cargarConfiguracion();
  }
});

const texto = ref('');
const errores = ref([]);
const revisando = ref(false);
const palabraSeleccionada = ref(null);
const posicionMenu = ref({ x: 0, y: 0 });

// Palabras que el usuario marcó como "ignorar" en esta sesión
const palabrasIgnoradas = ref(new Set());

let temporizadorDebounce = null;

// Espera 600ms sin escritura antes de mandar la petición al backend
function alEscribir() {
  clearTimeout(temporizadorDebounce);
  temporizadorDebounce = setTimeout(revisarOrtografia, 600);
}

async function revisarOrtografia() {
  if (texto.value.trim().length === 0) {
    errores.value = [];
    return;
  }

  revisando.value = true;

  try {
    const token = localStorage.getItem('token');
    const respuesta = await axios.post(
      '/api/escritura/revisar',
      { texto: texto.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    errores.value = respuesta.data.errores.filter(
      (error) => !palabrasIgnoradas.value.has(error.palabra.toLowerCase())
    );
  } catch (error) {
    console.error('No se pudo revisar el texto:', error);
  } finally {
    revisando.value = false;
  }
}

// Reconstruye el texto envolviendo cada palabra con error en un <span>
const textoConResaltado = computed(() => {
  if (errores.value.length === 0) return escaparHtml(texto.value);

  let resultado = '';
  let ultimaPosicion = 0;

  const erroresOrdenados = [...errores.value].sort((a, b) => a.posicion - b.posicion);

  erroresOrdenados.forEach((error) => {
    const antes = texto.value.slice(ultimaPosicion, error.posicion);
    const palabra = texto.value.slice(error.posicion, error.posicion + error.palabra.length);

    resultado += escaparHtml(antes);
    resultado += `<span class="palabra-error" data-palabra="${palabra}">${escaparHtml(palabra)}</span>`;

    ultimaPosicion = error.posicion + error.palabra.length;
  });

  resultado += escaparHtml(texto.value.slice(ultimaPosicion));
  return resultado;
});

function escaparHtml(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function mostrarSugerencias(evento) {
  const elemento = evento.target;
  if (!elemento.classList.contains('palabra-error')) return;

  const palabra = elemento.dataset.palabra;
  const error = errores.value.find((e) => e.palabra === palabra);
  if (!error) return;

  palabraSeleccionada.value = error;
  posicionMenu.value = { x: evento.clientX, y: evento.clientY };
}

function aplicarSugerencia(sugerencia) {
  const error = palabraSeleccionada.value;

  texto.value =
    texto.value.slice(0, error.posicion) +
    sugerencia +
    texto.value.slice(error.posicion + error.palabra.length);

  palabraSeleccionada.value = null;
  revisarOrtografia();
}

function ignorarPalabra() {
  palabrasIgnoradas.value.add(palabraSeleccionada.value.palabra.toLowerCase());
  errores.value = errores.value.filter((e) => e.palabra !== palabraSeleccionada.value.palabra);
  palabraSeleccionada.value = null;
}
</script>

<style scoped>
.editor-envoltura {
  position: relative;
}

.editor-textarea {
  width: 100%;
  min-height: 300px;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: transparent;
  color: transparent;
  caret-color: black;
  position: relative;
  z-index: 2;
  font: inherit;
  line-height: 1.6;
  resize: vertical;
}

.editor-resaltado {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 300px;
  padding: 1rem;
  z-index: 1;
  line-height: 1.6;
  white-space: pre-wrap;
  pointer-events: none;
}

.editor-resaltado :deep(.palabra-error) {
  text-decoration: underline wavy #e53e3e;
  text-decoration-thickness: 2px;
  pointer-events: auto;
  cursor: pointer;
}

.editor-estado {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.menu-sugerencias {
  position: fixed;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  z-index: 10;
  min-width: 150px;
}

.menu-titulo {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.menu-sugerencias ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-sugerencias li {
  padding: 0.4rem;
  cursor: pointer;
  border-radius: 4px;
}

.menu-sugerencias li:hover {
  background: #f0f0f0;
}

.menu-sin-sugerencias {
  color: #999;
  font-style: italic;
  cursor: default !important;
}

.menu-ignorar {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.3rem;
  border: none;
  background: #eee;
  border-radius: 4px;
  cursor: pointer;
}
</style>