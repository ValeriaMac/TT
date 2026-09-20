<template>
  <div class="pagina-config" v-if="config">
    <h1>Configuración Visual</h1>

    <div class="layout-config">
      <!-- Columna izquierda: controles -->
      <div class="columna-controles">

        <!-- Plantillas -->
        <section class="tarjeta">
          <h3>Plantillas</h3>
          <p v-if="configuracionStore.plantillas.length === 0" class="texto-vacio">
            No tienes plantillas guardadas aún.
          </p>
          <div v-else class="lista-plantillas">
            <div v-for="plantilla in configuracionStore.plantillas" :key="plantilla.id" class="fila-plantilla">
              <div>
                <strong>{{ plantilla.nombre }}</strong>
                <p class="detalle-plantilla">
                  {{ plantilla.tipografia }} · {{ plantilla.tamano_fuente }}pt ·
                  {{ Object.keys(plantilla.letras_resaltadas || {}).length }} letras resaltadas
                </p>
              </div>
              <div class="acciones-plantilla">
                <button class="btn-secundario" @click="manejarAplicar(plantilla.id)">✎ Aplicar</button>
                <button class="btn-secundario btn-peligro" @click="manejarEliminar(plantilla.id)">🗑</button>
              </div>
            </div>
          </div>
        </section>

        <!-- Fuente -->
        <section class="tarjeta">
          <h3>Fuente</h3>
          <select class="campo-select" v-model="formulario.tipografia">
            <option value="OpenDyslexic">OpenDyslexic</option>
            <option value="Arial">Arial</option>
            <option value="Verdana">Verdana</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
          </select>
        </section>

        <!-- Tamaño -->
        <section class="tarjeta">
          <h3>Tamaño de fuente: {{ formulario.tamanoFuente }}pt</h3>
          <input type="range" min="12" max="24" v-model.number="formulario.tamanoFuente" class="deslizador" />
        </section>

        <!-- Paleta de colores (fondo) -->
        <section class="tarjeta">
          <h3>Paleta de colores</h3>
          <p class="texto-secundario">Cambia el color de fondo de toda la aplicación</p>
          <div class="rejilla-paleta">
            <button
              v-for="paleta in paletasFondo"
              :key="paleta.nombre"
              type="button"
              class="opcion-paleta"
              :class="{ activa: formulario.colorFondo === paleta.valor }"
              :style="{ backgroundColor: paleta.valor, color: paleta.colorTextoBoton }"
              @click="formulario.colorFondo = paleta.valor"
            >
              {{ paleta.nombre }}
            </button>
          </div>
        </section>

        <!-- Color del texto -->
        <section class="tarjeta">
          <h3>Color del texto</h3>
          <div class="rejilla-colores-texto">
            <button
              v-for="colorTexto in coloresTexto"
              :key="colorTexto"
              type="button"
              class="circulo-color"
              :class="{ activo: formulario.colorTexto === colorTexto }"
              :style="{ backgroundColor: colorTexto }"
              :aria-label="`Color de texto ${colorTexto}`"
              @click="formulario.colorTexto = colorTexto"
            ></button>
          </div>
        </section>

        <!-- Espaciados -->
        <section class="tarjeta">
          <h3>Espaciado entre letras: {{ formulario.espaciadoLetras }}em</h3>
          <input type="range" min="0" max="0.3" step="0.01" v-model.number="formulario.espaciadoLetras" class="deslizador" />

          <h3>Espaciado entre palabras: {{ formulario.espaciadoPalabras }}em</h3>
          <input type="range" min="0" max="0.5" step="0.05" v-model.number="formulario.espaciadoPalabras" class="deslizador" />

          <h3>Espaciado entre líneas: {{ formulario.espaciadoLineas }}</h3>
          <input type="range" min="1" max="3" step="0.1" v-model.number="formulario.espaciadoLineas" class="deslizador" />
        </section>

        <!-- Letras y números para resaltar -->
        <section class="tarjeta">
          <h3>Letras y números para resaltar</h3>
          <p class="texto-secundario">Toca una letra o número y elige un color para resaltarlo</p>

          <p class="etiqueta-grupo">LETRAS</p>
          <div class="rejilla-caracteres">
            <button
              v-for="letra in letrasAlfabeto"
              :key="letra"
              type="button"
              class="boton-caracter"
              :class="{ marcado: formulario.letrasResaltadas[letra] }"
              :style="formulario.letrasResaltadas[letra] ? { borderColor: formulario.letrasResaltadas[letra], color: formulario.letrasResaltadas[letra] } : {}"
              @click="alternarCaracter(letra)"
            >
              {{ letra }}
            </button>
          </div>

          <p class="etiqueta-grupo">NÚMEROS</p>
          <div class="rejilla-caracteres">
            <button
              v-for="numero in numeros"
              :key="numero"
              type="button"
              class="boton-caracter"
              :class="{ marcado: formulario.letrasResaltadas[numero] }"
              :style="formulario.letrasResaltadas[numero] ? { borderColor: formulario.letrasResaltadas[numero], color: formulario.letrasResaltadas[numero] } : {}"
              @click="alternarCaracter(numero)"
            >
              {{ numero }}
            </button>
          </div>

          <!-- Selector de color, aparece solo si hay un carácter seleccionado para asignarle color -->
          <div v-if="caracterEditando" class="selector-color-caracter">
            <label>Color para "{{ caracterEditando }}"</label>
            <input type="color" v-model="colorTemporal" @change="asignarColor" />
          </div>
        </section>

        <!-- Nombre y guardar como plantilla -->
        <section class="tarjeta">
          <h3>Nombre de la plantilla</h3>
          <input type="text" class="campo-input" v-model="nombrePlantillaNueva" placeholder="Mi configuración personalizada" />
          <div class="botones">
            <button type="button" class="btn-primario" :disabled="guardando" @click="manejarGuardarComoPlantilla">
              {{ guardando ? 'Guardando...' : 'Guardar' }}
            </button>
            <button type="button" class="btn-secundario" @click="sincronizarFormulario">Cancelar</button>
          </div>
        </section>

        <div class="botones-principales">
          <button type="button" class="btn-primario" :disabled="guardando" @click="manejarGuardar">
            {{ guardando ? 'Guardando...' : 'Guardar configuración' }}
          </button>
        </div>

        <p v-if="mensaje" class="mensaje-exito">{{ mensaje }}</p>
        <p v-if="mensajeError" class="error">{{ mensajeError }}</p>
      </div>

      <!-- Columna derecha: vista previa fija -->
      <div class="columna-previa">
        <section class="tarjeta tarjeta-previa">
          <h3>👁 Vista previa</h3>
          <div class="vista-previa" :style="estilosPreviaCalculados" v-html="textoPreviaConResaltado"></div>
        </section>
      </div>
    </div>
  </div>

  <p v-else>Cargando configuración...</p>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useConfiguracionStore } from '../store/configuracion.store';
import { useEstilosPersonalizacion } from '../composables/useEstilosPersonalizacion';

const configuracionStore = useConfiguracionStore();
const { resaltarCaracteres } = useEstilosPersonalizacion();

const textoPrevia = 'El aprendizaje es un viaje personal. Cada día descubrimos algo nuevo sobre nosotros mismos y el mundo que nos rodea. La lectura abre puertas a nuevas ideas y perspectivas.';

const letrasAlfabeto = 'abcdefghijklmnopqrstuvwxyz'.split('');
const numeros = '0123456789'.split('');

const paletasFondo = [
  { nombre: 'Claro', valor: '#FFFFFF', colorTextoBoton: '#333333' },
  { nombre: 'Crema', valor: '#FBF3E0', colorTextoBoton: '#333333' },
  { nombre: 'Azul suave', valor: '#DBEAFE', colorTextoBoton: '#333333' },
  { nombre: 'Oscuro', valor: '#1A1A1A', colorTextoBoton: '#FFFFFF' },
];

const coloresTexto = ['#1F2A1F', '#555555', '#1E3A5F', '#E8E8D8'];

const formulario = reactive({
  tipografia: 'OpenDyslexic',
  tamanoFuente: 16,
  colorFondo: '#FFFFFF',
  colorTexto: '#000000',
  espaciadoLetras: 0.02,
  espaciadoPalabras: 0.1,
  espaciadoLineas: 1.6,
  resaltadoLetrasConfusas: true,
  letrasResaltadas: {}, // ej: { m: '#c0392b', '3': '#2980b9' }
});

const guardando = ref(false);
const mensaje = ref('');
const mensajeError = ref('');
const nombrePlantillaNueva = ref('');
const caracterEditando = ref(null);
const colorTemporal = ref('#c0392b');

const config = computed(() => configuracionStore.config);

const estilosPreviaCalculados = computed(() => ({
  fontFamily: formulario.tipografia,
  fontSize: `${formulario.tamanoFuente}pt`,
  backgroundColor: formulario.colorFondo,
  color: formulario.colorTexto,
  letterSpacing: `${formulario.espaciadoLetras}em`,
  wordSpacing: `${formulario.espaciadoPalabras}em`,
  lineHeight: formulario.espaciadoLineas,
  padding: '1.5rem',
  borderRadius: '10px',
}));

const textoPreviaConResaltado = computed(() =>
  resaltarCaracteres(textoPrevia, formulario.letrasResaltadas)
);

onMounted(async () => {
  await configuracionStore.cargarConfiguracion();
  await configuracionStore.cargarPlantillas();
  sincronizarFormulario();
});

watch(config, sincronizarFormulario);

function sincronizarFormulario() {
  if (!config.value) return;
  formulario.tipografia = config.value.tipografia;
  formulario.tamanoFuente = config.value.tamano_fuente;
  formulario.colorFondo = config.value.color_fondo;
  formulario.colorTexto = config.value.color_texto;
  formulario.espaciadoLetras = config.value.espaciado_letras ?? 0.02;
  formulario.espaciadoPalabras = config.value.espaciado_palabras ?? 0.1;
  formulario.espaciadoLineas = config.value.espaciado_lineas ?? 1.6;
  formulario.resaltadoLetrasConfusas = config.value.resaltado_letras_confusas;
  formulario.letrasResaltadas = { ...(config.value.letras_resaltadas || {}) };
}

// Al tocar una letra/número: si ya tenía color, lo quita; si no tenía, abre el selector de color
function alternarCaracter(caracter) {
  if (formulario.letrasResaltadas[caracter]) {
    delete formulario.letrasResaltadas[caracter];
    caracterEditando.value = null;
  } else {
    caracterEditando.value = caracter;
    colorTemporal.value = '#c0392b';
  }
}

function asignarColor() {
  if (caracterEditando.value) {
    formulario.letrasResaltadas[caracterEditando.value] = colorTemporal.value;
    caracterEditando.value = null;
  }
}

async function manejarGuardar() {
  mensaje.value = '';
  mensajeError.value = '';
  guardando.value = true;
  try {
    await configuracionStore.guardarConfiguracion(formulario);
    mensaje.value = 'Configuración guardada';
    setTimeout(() => (mensaje.value = ''), 2500);
  } catch (error) {
    mensajeError.value = error.response?.data?.mensaje || 'No se pudo guardar la configuración';
  } finally {
    guardando.value = false;
  }
}

async function manejarGuardarComoPlantilla() {
  if (!nombrePlantillaNueva.value.trim()) {
    mensajeError.value = 'Ponle un nombre a la plantilla';
    return;
  }
  if (configuracionStore.plantillas.length >= 3) {
    mensajeError.value = 'Ya tienes el máximo de 3 plantillas. Elimina una para guardar otra.';
    return;
  }
  guardando.value = true;
  try {
    await configuracionStore.guardarConfiguracion(formulario);
    await configuracionStore.guardarComoPlantilla(nombrePlantillaNueva.value);
    nombrePlantillaNueva.value = '';
    mensaje.value = 'Plantilla guardada correctamente';
    setTimeout(() => (mensaje.value = ''), 2500);
  } catch (error) {
    mensajeError.value = error.response?.data?.mensaje || 'No se pudo guardar la plantilla';
  } finally {
    guardando.value = false;
  }
}

async function manejarAplicar(id) {
  try {
    await configuracionStore.aplicarPlantilla(id);
    mensaje.value = 'Plantilla aplicada';
    setTimeout(() => (mensaje.value = ''), 2500);
  } catch (error) {
    mensajeError.value = 'No se pudo aplicar la plantilla';
  }
}

async function manejarEliminar(id) {
  try {
    await configuracionStore.eliminarPlantilla(id);
  } catch (error) {
    mensajeError.value = 'No se pudo eliminar la plantilla';
  }
}
</script>

<style scoped>
.pagina-config {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.layout-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 800px) {
  .layout-config {
    grid-template-columns: 1fr;
  }
}

.columna-controles {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.columna-previa {
  position: sticky;
  top: 90px;
}

.tarjeta h3 {
  font-size: 1rem;
  margin-bottom: 0.6rem;
}

.texto-secundario {
  color: var(--color-texto-secundario, #7a7a6a);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.deslizador {
  width: 100%;
  margin-bottom: 1rem;
}

.rejilla-paleta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.opcion-paleta {
  padding: 0.9rem;
  border-radius: 12px;
  border: 2px solid transparent;
  font-weight: 600;
  cursor: pointer;
}
.opcion-paleta.activa {
  border-color: var(--color-primario, #5c7a3f);
}

.rejilla-colores-texto {
  display: flex;
  gap: 0.75rem;
}

.circulo-color {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
}
.circulo-color.activo {
  border-color: var(--color-primario, #5c7a3f);
}

.etiqueta-grupo {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-texto-secundario, #7a7a6a);
  margin: 0.75rem 0 0.5rem;
}

.rejilla-caracteres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.boton-caracter {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid var(--color-borde, #e0e0d0);
  background: white;
  cursor: pointer;
  font-weight: 600;
}
.boton-caracter.marcado {
  border-width: 3px;
}

.selector-color-caracter {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.fila-plantilla {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-borde, #e0e0d0);
}
.fila-plantilla:last-child {
  border-bottom: none;
}
.detalle-plantilla {
  font-size: 0.8rem;
  color: var(--color-texto-secundario, #7a7a6a);
}
.acciones-plantilla {
  display: flex;
  gap: 0.5rem;
}

.texto-vacio {
  color: var(--color-texto-secundario, #7a7a6a);
  font-size: 0.9rem;
}

.botones {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.botones-principales {
  display: flex;
  justify-content: center;
}

.vista-previa {
  transition: all 0.2s ease;
}

.mensaje-exito {
  color: #27ae60;
  text-align: center;
}
.error {
  color: #c0392b;
  text-align: center;
}
</style>