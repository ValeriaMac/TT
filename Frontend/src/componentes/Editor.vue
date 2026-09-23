<!--
  Editor.vue — Módulo de escritura (CU-SIS-10, RF_13, RF_14)
  Corrector ortográfico interactivo + barra de formato de texto.
-->
<template>
  <div class="editor-widget">

    <!-- Barra superior: título, plantilla, guardar -->
    <div class="tarjeta-barra">
      <input v-model="titulo" class="input-titulo" placeholder="Título del documento" />

      <select v-model="plantillaSeleccionada" @change="alCambiarPlantilla" class="select-plantilla">
        <option value="">Seleccionar plantilla</option>
        <option v-for="plantilla in configuracionStore.plantillas" :key="plantilla.id" :value="plantilla.id">
          {{ plantilla.nombre }}
        </option>
      </select>

      <button class="btn-guardar" @click="guardarDocumento" :disabled="guardando">
        {{ guardando ? 'Guardando...' : '💾 Guardar' }}
      </button>
    </div>
    <p v-if="mensajeGuardado" class="mensaje-guardado">{{ mensajeGuardado }}</p>
    <p v-if="cargandoEpub" class="mensaje-guardado">Cargando contenido del documento...</p>

    <!-- Barra de formato de texto -->
    <div class="tarjeta-formato">
      <div class="grupo-formato">
        <button
          v-for="opcion in opcionesAlineacion"
          :key="opcion.valor"
          class="btn-formato"
          :class="{ activo: alineacion === opcion.valor }"
          :title="opcion.titulo"
          @click="alineacion = opcion.valor"
        >{{ opcion.icono }}</button>
      </div>

      <div class="grupo-formato">
        <button class="btn-formato" title="Viñetas" @click="insertarFormato('bullet')">•</button>
      </div>

      <div class="grupo-formato">
        <button class="btn-formato" title="Negrita" @click="insertarFormato('bold')"><b>B</b></button>
        <button class="btn-formato" title="Cursiva" @click="insertarFormato('italic')"><i>I</i></button>
        <button class="btn-formato" title="Tachado" @click="insertarFormato('strikethrough')"><s>S</s></button>
      </div>

      <div class="grupo-formato">
        <button class="btn-formato" title="Título 1" @click="insertarFormato('h1')">H1</button>
        <button class="btn-formato" title="Título 2" @click="insertarFormato('h2')">H2</button>
      </div>

      <button class="btn-formato" title="Insertar tabla" @click="insertarFormato('table')">▦</button>
    </div>

    <!-- Editor con corrector ortográfico -->
    <div class="editor-contenedor" :style="estilosPersonalizacion">
      <!-- contenteditable en vez de textarea: el subrayado de errores
           vive DENTRO del mismo elemento donde se escribe (como spans
           reales en el DOM), no en una capa aparte que se pueda
           desincronizar -->
      <div
        ref="contenidoRef"
        class="editor-textarea"
        :style="{ textAlign: alineacion }"
        contenteditable="true"
        spellcheck="false"
        autocorrect="off"
        autocapitalize="off"
        :data-placeholder="texto.length === 0 ? 'Empieza a escribir...' : ''"
        @input="alEscribir"
      ></div>

      <p class="editor-estado" v-if="revisando">Revisando ortografía...</p>

      <!-- Lista de errores encontrados, con acceso rápido a cada uno -->
      <div v-if="!revisando && errores.length > 0" class="lista-errores">
        <p class="titulo-lista-errores">{{ errores.length }} posible(s) error(es) ortográfico(s)</p>
        <div v-for="(error, indice) in errores" :key="indice" class="fila-error">
          <span class="palabra-con-error">{{ error.palabra }}</span>
          <div class="sugerencias-error">
            <button
              v-for="sugerencia in error.sugerencias"
              :key="sugerencia"
              class="btn-sugerencia"
              @click="aplicarSugerencia(error, sugerencia)"
            >
              {{ sugerencia }}
            </button>
            <span v-if="error.sugerencias.length === 0" class="sin-sugerencias">sin sugerencias</span>
            <button class="btn-ignorar" @click="ignorarPalabra(error)" title="Ignorar esta palabra">✕</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios'; // sigue haciendo falta solo para "fetch" del archivo EPUB en sí
import api from '@/servicios/api';
import Epub from 'epubjs';
import { useRoute } from 'vue-router';
import { useEstilosPersonalizacion } from '@/composables/useEstilosPersonalizacion';
import { useConfiguracionStore } from '@/store/configuracion.store';

const route = useRoute();
const configuracionStore = useConfiguracionStore();
const { estilosPersonalizacion } = useEstilosPersonalizacion();

const cargandoEpub = ref(false);

onMounted(async () => {
  if (!configuracionStore.config) {
    configuracionStore.cargarConfiguracion();
  }
  // Las plantillas ya existen como funcionalidad real (Configuración
  // Visual); aquí solo se reutilizan para poder aplicarlas al escribir
  if (configuracionStore.plantillas.length === 0) {
    configuracionStore.cargarPlantillas();
  }

  const idDocumento = route.query.documentoId;
  const nombreEpub = route.query.epub;

  if (idDocumento) {
    // Viene de "Editar" en Documentos, sobre un documento de texto YA
    // guardado antes — se carga desde el backend para seguir editándolo
    await cargarDocumentoGuardado(idDocumento);
  } else if (nombreEpub) {
    // Viene de "Editar" en Documentos, pero sobre un EPUB: se extrae
    // su texto (ver más abajo). Al guardar, esto crea un documento
    // de texto NUEVO — no puede sobreescribir el EPUB original.
    await cargarTextoDesdeEpub(nombreEpub);
  }
  // Si no viene ninguno de los dos, es un documento nuevo en blanco
});

// Descarga el EPUB y extrae su texto plano (sin las etiquetas HTML)
// para poder editarlo como texto normal. Es el mismo mecanismo que ya
// usa VistaLector.vue para leerlo, aquí solo se queda con el texto.
async function cargarTextoDesdeEpub(nombre) {
  cargandoEpub.value = true;
  try {
    const respuestaUrl = await api.get(`/lector/url/${nombre}`);
    const respuestaArchivo = await fetch(respuestaUrl.data.url);
    const arrayBuffer = await (await respuestaArchivo.blob()).arrayBuffer();

    const libro = Epub(arrayBuffer);
    const metadata = await libro.loaded.metadata;
    titulo.value = metadata.title && metadata.title.trim() !== '' ? metadata.title : nombre;

    await libro.ready;

    let textoCompleto = '';
    for (const item of libro.spine.items) {
      const seccion = await libro.spine.get(item.href);
      if (seccion) {
        await seccion.load(libro.load.bind(libro));
        const body = seccion.document?.body;
        if (body) {
          textoCompleto += body.textContent.trim() + '\n\n';
        }
        seccion.unload();
      }
    }

    texto.value = textoCompleto.trim();
    nextTick(pintarTextoInicial);
    revisarOrtografia();

    // idDocumentoActual se queda en null a propósito: al guardar esto
    // por primera vez, se CREA un documento de texto nuevo (no se
    // puede sobreescribir el EPUB original)
    libro.destroy();
  } catch (error) {
    console.error('No se pudo extraer el texto del EPUB:', error);
    mensajeGuardado.value = 'No se pudo cargar el contenido de este documento.';
  } finally {
    cargandoEpub.value = false;
  }
}

const titulo = ref('');
const texto = ref('');
const alineacion = ref('left');
const plantillaSeleccionada = ref('');
const mensajeGuardado = ref('');
const contenidoRef = ref(null);

// ===== Utilidades para trabajar con el cursor dentro de un contenteditable =====
//
// A diferencia de un <textarea> (que tiene selectionStart/selectionEnd
// listos para usarse), en un contenteditable hay que calcular la
// posición del cursor "a mano", contando caracteres desde el inicio
// del elemento hasta donde está el cursor. Esto es necesario para
// poder repintar el texto (agregando los <span> de los errores) sin
// que el cursor salte a otro lugar.

// Cuenta cuántos caracteres hay entre el inicio del elemento y la
// posición actual del cursor
function obtenerPosicionCursor(elemento) {
  const seleccion = window.getSelection();
  if (!seleccion.rangeCount) return 0;

  const rango = seleccion.getRangeAt(0);
  const rangoHastaElCursor = rango.cloneRange();
  rangoHastaElCursor.selectNodeContents(elemento);
  rangoHastaElCursor.setEnd(rango.endContainer, rango.endOffset);

  return rangoHastaElCursor.toString().length;
}

// Devuelve en qué caracteres empieza y termina el texto que el
// usuario tiene seleccionado (para negrita, cursiva, etc.)
function obtenerRangoSeleccionado(elemento) {
  const seleccion = window.getSelection();
  if (!seleccion.rangeCount) return { inicio: 0, fin: 0 };

  const rango = seleccion.getRangeAt(0);

  const antesDelInicio = document.createRange();
  antesDelInicio.selectNodeContents(elemento);
  antesDelInicio.setEnd(rango.startContainer, rango.startOffset);

  const antesDelFin = document.createRange();
  antesDelFin.selectNodeContents(elemento);
  antesDelFin.setEnd(rango.endContainer, rango.endOffset);

  return { inicio: antesDelInicio.toString().length, fin: antesDelFin.toString().length };
}

// La operación inversa: dado un número de caracteres, encuentra el
// nodo de texto exacto (y la posición dentro de él) y pone el cursor
// ahí. Recorre el contenido igual que se leería en voz alta, entrando
// a cada span y contando sus letras una por una.
function establecerPosicionCursor(elemento, posicion) {
  const seleccion = window.getSelection();
  const rango = document.createRange();
  let restante = posicion;
  let encontrado = false;

  function recorrer(nodo) {
    if (encontrado) return;

    if (nodo.nodeType === Node.TEXT_NODE) {
      const longitud = nodo.textContent.length;
      if (restante <= longitud) {
        rango.setStart(nodo, restante);
        rango.setEnd(nodo, restante);
        encontrado = true;
      } else {
        restante -= longitud;
      }
      return;
    }

    for (const hijo of nodo.childNodes) {
      recorrer(hijo);
      if (encontrado) return;
    }
  }

  recorrer(elemento);

  if (encontrado) {
    seleccion.removeAllRanges();
    seleccion.addRange(rango);
  }
}

function escaparHtml(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Reconstruye el HTML del editor: el texto normal tal cual, y las
// palabras marcadas como error envueltas en un <span> con el
// subrayado ondulado. Se usa solo en momentos puntuales (no en cada
// tecla), guardando y restaurando el cursor alrededor de la llamada.
function construirHtmlConErrores() {
  if (errores.value.length === 0) return escaparHtml(texto.value);

  let resultado = '';
  let ultimaPosicion = 0;

  const erroresOrdenados = [...errores.value].sort((a, b) => a.posicion - b.posicion);

  erroresOrdenados.forEach((error) => {
    const antes = texto.value.slice(ultimaPosicion, error.posicion);
    const palabra = texto.value.slice(error.posicion, error.posicion + error.palabra.length);

    resultado += escaparHtml(antes);
    resultado += `<span class="palabra-error">${escaparHtml(palabra)}</span>`;

    ultimaPosicion = error.posicion + error.palabra.length;
  });

  resultado += escaparHtml(texto.value.slice(ultimaPosicion));
  return resultado;
}

// Repinta el contenido del editor (con o sin subrayados) SIN mover
// el cursor: primero anota dónde estaba, reconstruye el HTML, y
// vuelve a poner el cursor exactamente en ese mismo lugar.
function repintarManteniendoCursor() {
  const el = contenidoRef.value;
  if (!el) return;

  const posicionGuardada = obtenerPosicionCursor(el);
  el.innerHTML = construirHtmlConErrores();
  establecerPosicionCursor(el, posicionGuardada);
}

// Pone texto nuevo en el editor desde fuera (al cargar un borrador o
// un EPUB), sin necesidad de conservar ningún cursor previo
function pintarTextoInicial() {
  const el = contenidoRef.value;
  if (!el) return;
  el.innerHTML = construirHtmlConErrores();
}

const opcionesAlineacion = [
  { valor: 'left', icono: '≡', titulo: 'Alinear izquierda' },
  { valor: 'center', icono: '≣', titulo: 'Alinear centro' },
  { valor: 'right', icono: '≡', titulo: 'Alinear derecha' },
  { valor: 'justify', icono: '☰', titulo: 'Justificar' },
];

function alCambiarPlantilla() {
  if (plantillaSeleccionada.value) {
    configuracionStore.aplicarPlantilla(plantillaSeleccionada.value);
  }
}

// Guardado real en el backend (tabla documentos_texto). Si ya existe
// un id (porque se cargó un documento guardado antes, o porque ya se
// guardó una vez en esta misma sesión), se actualiza ese mismo
// documento; si no, se crea uno nuevo.
const idDocumentoActual = ref(null);
const guardando = ref(false);

async function guardarDocumento() {
  guardando.value = true;
  mensajeGuardado.value = '';

  try {
    if (idDocumentoActual.value) {
      await api.put(`/documentos/${idDocumentoActual.value}`, {
        titulo: titulo.value,
        contenido: texto.value,
      });
      mensajeGuardado.value = 'Documento actualizado';
    } else {
      const respuesta = await api.post('/documentos', {
        titulo: titulo.value,
        contenido: texto.value,
      });
      idDocumentoActual.value = respuesta.data.documento.id;
      mensajeGuardado.value = 'Documento guardado — ya aparece en Documentos';
    }
  } catch (error) {
    console.error('Error al guardar el documento:', error);
    mensajeGuardado.value = 'No se pudo guardar el documento.';
  } finally {
    guardando.value = false;
    setTimeout(() => (mensajeGuardado.value = ''), 4000);
  }
}

// Carga un documento de texto que ya se había guardado antes (llega
// aquí con ?documentoId=X en la URL, típicamente desde "Editar" en
// la lista de Documentos)
async function cargarDocumentoGuardado(id) {
  try {
    const respuesta = await api.get(`/documentos/${id}`);
    idDocumentoActual.value = respuesta.data.documento.id;
    titulo.value = respuesta.data.documento.titulo;
    texto.value = respuesta.data.documento.contenido;
    nextTick(pintarTextoInicial);
    revisarOrtografia();
  } catch (error) {
    console.error('No se pudo cargar el documento:', error);
    mensajeGuardado.value = 'No se pudo cargar ese documento.';
  }
}

// Inserta el marcador de formato correspondiente alrededor del texto
// que el usuario tiene seleccionado (mismo patrón que un editor tipo
// Markdown). Como esto pasa de un clic, no mientras se escribe, se
// puede repintar todo el editor sin riesgo de interrumpir al usuario.
function insertarFormato(tipo) {
  const el = contenidoRef.value;
  if (!el) return;

  const { inicio, fin } = obtenerRangoSeleccionado(el);
  const seleccionado = texto.value.substring(inicio, fin);
  let nuevoTexto = texto.value;
  let segmentoInsertado = seleccionado; // el texto que reemplaza a la selección

  switch (tipo) {
    case 'bold':
      segmentoInsertado = '**' + seleccionado + '**';
      break;
    case 'italic':
      segmentoInsertado = '*' + seleccionado + '*';
      break;
    case 'strikethrough':
      segmentoInsertado = '~~' + seleccionado + '~~';
      break;
    case 'h1':
      segmentoInsertado = '# ' + seleccionado;
      break;
    case 'h2':
      segmentoInsertado = '## ' + seleccionado;
      break;
    case 'bullet':
      segmentoInsertado = '• ' + seleccionado;
      break;
    case 'table':
      segmentoInsertado = '\n| Columna 1 | Columna 2 | Columna 3 |\n|---|---|---|\n| Dato 1 | Dato 2 | Dato 3 |\n';
      break;
  }

  nuevoTexto = texto.value.slice(0, inicio) + segmentoInsertado + texto.value.slice(fin);
  // El cursor queda justo después de lo que se acaba de insertar
  const posicionCursorFinal = inicio + segmentoInsertado.length;

  texto.value = nuevoTexto;
  nextTick(() => {
    pintarTextoInicial();
    el.focus();
    establecerPosicionCursor(el, posicionCursorFinal);
  });
  revisarOrtografia();
}

// ===== Corrector ortográfico =====

const errores = ref([]);
const revisando = ref(false);
const palabrasIgnoradas = ref(new Set());

let temporizadorDebounce = null;

// Se llama en cada tecla que se presiona dentro del editor. A
// propósito NO toca el HTML del editor aquí (eso movería el cursor);
// solo lee el texto plano que el navegador ya escribió de forma
// nativa, y programa la revisión 600ms después de la última tecla.
function alEscribir() {
  const el = contenidoRef.value;
  texto.value = el.textContent;

  // Los errores mostrados en la lista de abajo corresponden al texto
  // de la última revisión, que ya quedó desactualizada apenas se
  // escribió algo más — se limpian para no mostrar sugerencias que
  // ya no aplican, hasta que llegue una revisión fresca.
  errores.value = [];

  clearTimeout(temporizadorDebounce);
  temporizadorDebounce = setTimeout(revisarOrtografia, 600);
}

// Si el usuario escribe rápido, se pueden mandar varias peticiones de
// revisión casi seguidas. Como la red no garantiza que las respuestas
// lleguen en el mismo orden en que se enviaron, una respuesta "vieja"
// podría llegar DESPUÉS de la más reciente y pisarla con datos que ya
// no aplican. Por eso cada petición lleva un número de turno: al
// regresar, solo se usa su resultado si sigue siendo la más reciente.
let numeroDeTurno = 0;

async function revisarOrtografia() {
  const miTurno = ++numeroDeTurno;

  if (texto.value.trim().length === 0) {
    errores.value = [];
    return;
  }

  revisando.value = true;

  try {
    const respuesta = await api.post('/escritura/revisar', { texto: texto.value });

    if (miTurno !== numeroDeTurno) return; // ya quedó obsoleta, se ignora

    errores.value = respuesta.data.errores.filter(
      (error) => !palabrasIgnoradas.value.has(error.palabra.toLowerCase())
    );

    // Recién aquí, con errores ya calculados sobre el texto actual
    // (y con el usuario presumiblemente en pausa, no a media tecla),
    // se repinta el editor con los subrayados — sin mover el cursor.
    repintarManteniendoCursor();
  } catch (error) {
    console.error('No se pudo revisar el texto:', error);
    // Visible en pantalla, no solo en la consola, para no depender de
    // que alguien abra las herramientas de desarrollador para notarlo
    mensajeGuardado.value = 'No se pudo conectar con el corrector ortográfico.';
    setTimeout(() => (mensajeGuardado.value = ''), 5000);
  } finally {
    if (miTurno === numeroDeTurno) {
      revisando.value = false;
    }
  }
}

// Reemplaza esa palabra específica (por su posición) con la sugerencia
// elegida desde la lista de errores
function aplicarSugerencia(error, sugerencia) {
  texto.value =
    texto.value.slice(0, error.posicion) +
    sugerencia +
    texto.value.slice(error.posicion + error.palabra.length);

  errores.value = errores.value.filter((e) => e !== error);

  nextTick(() => {
    const el = contenidoRef.value;
    pintarTextoInicial();
    el.focus();
    establecerPosicionCursor(el, error.posicion + sugerencia.length);
  });

  revisarOrtografia();
}

function ignorarPalabra(error) {
  palabrasIgnoradas.value.add(error.palabra.toLowerCase());
  errores.value = errores.value.filter((e) => e !== error);

  nextTick(() => {
    const el = contenidoRef.value;
    const posicionCursor = obtenerPosicionCursor(el);
    pintarTextoInicial();
    establecerPosicionCursor(el, posicionCursor);
  });
}
</script>

<style scoped>
.editor-widget {
  max-width: 900px;
  margin: 0 auto;
}

/* ---- Barra superior ---- */
.tarjeta-barra {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
}

.input-titulo {
  flex: 1;
  min-width: 180px;
  border: none;
  font-size: 1.2rem;
  padding: 0.4rem;
}

.input-titulo:focus {
  outline: none;
  border-bottom: 2px solid var(--color-primario);
}

.select-plantilla {
  padding: 0.5rem 0.8rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
}

.btn-guardar {
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: var(--radio-boton);
  padding: 0.5rem 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-guardar:hover {
  background-color: var(--color-primario-hover);
}

.mensaje-guardado {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
  margin: -0.5rem 0 1rem 0.3rem;
}

/* ---- Barra de formato ---- */
.tarjeta-formato {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 0.6rem 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
}

.grupo-formato {
  display: flex;
  gap: 0.3rem;
  border-right: 1px solid var(--color-borde);
  padding-right: 0.8rem;
}

.btn-formato {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-formato:hover {
  background: #f0f0e8;
}

.btn-formato.activo {
  background: var(--color-primario);
  color: white;
}

/* ---- Editor ---- */
.editor-textarea {
  width: 100%;
  min-height: 350px;
  padding: 1.5rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-tarjeta);
  background: white;
  font: inherit;
  line-height: 1.6;
  box-sizing: border-box;
  white-space: pre-wrap; /* respeta espacios y saltos de línea, igual que un textarea */
  word-wrap: break-word;
}

.editor-textarea:focus {
  outline: 2px solid var(--color-primario);
  border-color: var(--color-primario);
}

/* Placeholder: como un contenteditable no tiene el atributo
   "placeholder" de un input/textarea, se simula con CSS mostrando
   el texto de data-placeholder solo cuando el editor está vacío */
.editor-textarea:empty:before {
  content: attr(data-placeholder);
  color: #999;
  pointer-events: none;
}

/* El subrayado de las palabras con error. Van con :deep() porque
   estos <span> los inserta JavaScript directamente (innerHTML), no
   Vue a través del template — por eso no tienen el atributo especial
   que usan los estilos "scoped" para saber a qué aplicarse. */
.editor-textarea :deep(.palabra-error) {
  text-decoration: underline wavy #e53e3e;
  text-decoration-thickness: 2px;
}

.editor-estado {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-texto-secundario);
}

/* ---- Lista de errores (reemplaza el subrayado sobre el texto) ---- */
.lista-errores {
  margin-top: 1rem;
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1rem 1.2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.titulo-lista-errores {
  font-weight: 600;
  margin-bottom: 0.6rem;
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
}

.fila-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0;
  border-top: 1px solid var(--color-borde);
}

.fila-error:first-of-type {
  border-top: none;
}

.palabra-con-error {
  text-decoration: underline wavy #e53e3e;
  text-decoration-thickness: 2px;
  font-weight: 600;
  min-width: 100px;
}

.sugerencias-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.btn-sugerencia {
  background: #f0f4e8;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-boton);
  padding: 0.3rem 0.8rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-sugerencia:hover {
  background: var(--color-primario);
  color: white;
  border-color: var(--color-primario);
}

.sin-sugerencias {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
  font-style: italic;
}

.btn-ignorar {
  background: none;
  border: 1px solid var(--color-borde);
  border-radius: 50%;
  width: 26px;
  height: 26px;
  cursor: pointer;
  color: var(--color-texto-secundario);
  font-size: 0.8rem;
}

.btn-ignorar:hover {
  background: #fdecea;
  color: #c0392b;
  border-color: #c0392b;
}

/* ===== Responsivo: pantallas angostas (celular) ===== */
@media (max-width: 640px) {
  .tarjeta-barra {
    flex-direction: column;
    align-items: stretch;
  }

  .select-plantilla,
  .btn-guardar {
    width: 100%;
  }

  .tarjeta-formato {
    justify-content: center;
  }

  .grupo-formato {
    border-right: none;
    padding-right: 0;
  }

  .editor-textarea {
    padding: 1rem;
  }
}
</style>