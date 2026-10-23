<template>
  <div style="padding: 20px;">

    <!-- Tarjeta de controles de lectura -->
    <div class="barra-lector">
      <button class="btn-redondo btn-play" :title="leyendo ? 'Pausar' : 'Reproducir'" @click="leyendo ? pausar() : reproducir()">
        {{ leyendo ? '⏸' : '▶' }}
      </button>
      <button class="btn-redondo" title="Detener" @click="detener">■</button>
      <button class="btn-redondo" title="Reiniciar" @click="reiniciar">↺</button>
      <button
        class="btn-redondo btn-ajustes"
        :class="{ activo: opcionesAbiertas }"
        title="Ajustes de lectura"
        :aria-expanded="opcionesAbiertas"
        @click="opcionesAbiertas = !opcionesAbiertas"
      >⚙</button>

      <div class="opciones-barra" :class="{ abierto: opcionesAbiertas }">
      <select v-model="vozSeleccionada" class="campo-barra" title="Voz">
        <option v-for="voz in vocesDisponibles" :key="voz.name" :value="voz.name">
          {{ voz.name }}
        </option>
      </select>

      <div class="grupo-velocidad">
        <label>Velocidad: {{ velocidad }}x</label>
        <input type="range" min="0.5" max="2" step="0.1" v-model="velocidad" />
      </div>

      <h2 class="titulo-barra">{{ titulo }}</h2>

      <select v-model="plantillaSeleccionada" @change="alCambiarPlantilla" class="campo-barra">
        <option value="">Seleccionar plantilla</option>
        <option v-for="plantilla in configuracionStore.plantillas" :key="plantilla.id" :value="plantilla.id">
          {{ plantilla.nombre }}
        </option>
      </select>
      </div>

      <button class="btn-barra btn-docs" @click="emit('regresar')">← <span class="txt-docs">Documentos</span></button>
    </div>

    <p v-if="cargando">Cargando libro...</p>
    <p v-if="errorMsg" style="color: red;">{{ errorMsg }}</p>

    <div v-if="!cargando && progresoGuardado" class="aviso-progreso">
      📖 Continuando desde donde te quedaste...
    </div>

    <!-- Contenido del libro con formato -->
    <div
      v-show="!cargando"
      ref="contenedorLibro"
      id="contenedor-libro"
      :style="progresoGuardado ? 'margin-top: 10px;' : 'margin-top: 0;'"
      style="max-width: 700px; margin-left: auto; margin-right: auto; line-height: 1.8;"
    ></div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// En celular los ajustes (voz, velocidad, plantilla) se muestran solo al abrir ⚙
const opcionesAbiertas = ref(false)
import Epub from 'epubjs'
import { useConfiguracionStore } from '../store/configuracion.store'
import { useEstilosPersonalizacion } from '../composables/useEstilosPersonalizacion'
import api from '../servicios/api'

const props = defineProps({
  url: String,
  nombreArchivo: String,
  // Texto de un documento creado en Escritura (en lugar de un EPUB)
  contenidoTexto: { type: String, default: null },
  tituloDocumento: { type: String, default: '' }
})

// Convierte el texto plano del editor (con sus marcas **negrita**, *cursiva*,
// # títulos) en HTML sencillo para poder leerlo y resaltar palabra por palabra
const escaparHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const textoAHtml = (texto) => {
  return texto
    .split(/\n+/)
    .map((linea) => linea.trim())
    .filter((linea) => linea !== '')
    .map((linea) => {
      let etiqueta = 'p'
      if (linea.startsWith('## ')) { etiqueta = 'h3'; linea = linea.slice(3) }
      else if (linea.startsWith('# ')) { etiqueta = 'h2'; linea = linea.slice(2) }
      const html = escaparHtml(linea)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/~~(.+?)~~/g, '<s>$1</s>')
      return `<${etiqueta}>${html}</${etiqueta}>`
    })
    .join('')
}

// Texto de muestra que se usa cuando no hay ningún documento elegido
// (por ejemplo, al entrar a /lectura directo desde el menú, sin pasar
// primero por Documentos)
const TEXTO_PREDETERMINADO = {
  titulo: 'El Principito - Fragmento',
  html: `<p>Todas las personas mayores fueron al principio niños, aunque pocas
    de ellas lo recuerdan. Cuando yo tenía seis años vi en un libro sobre la
    selva virgen que se titulaba "Historias vividas", una magnífica lámina.
    Representaba una serpiente boa que se tragaba a una fiera.</p>`
}

const emit = defineEmits(['regresar'])

const titulo = ref('Cargando...')
const leyendo = ref(false)
const cargando = ref(true)
const errorMsg = ref(null)
const pausado = ref(false)
const velocidad = ref(0.9)
const plantillaSeleccionada = ref('')
const indicePausa = ref(0)
const contenedorLibro = ref(null)
const vozSeleccionada = ref('')
const vocesDisponibles = ref([])
const progresoGuardado = ref(false)

let libro = null
let palabrasDOM = []

const claveProgreso = `progreso-${props.nombreArchivo || props.tituloDocumento || 'texto-predeterminado'}`

// ===== Personalización visual (RF_05-RF_08) =====
const configuracionStore = useConfiguracionStore()
const { estilosPersonalizacion } = useEstilosPersonalizacion()

const guardarProgreso = () => {
  if (indicePausa.value > 0) {
    localStorage.setItem(
      claveProgreso,
      JSON.stringify({
        indice: indicePausa.value,
        fecha: new Date().toISOString()
      })
    )
  }
  localStorage.setItem('config-lector', JSON.stringify({
    velocidad: velocidad.value,
    voz: vozSeleccionada.value
  }))
}

const cargarProgreso = () => {
  const guardado = localStorage.getItem(claveProgreso)
  if (guardado) {
    const datos = JSON.parse(guardado)
    return datos.indice
  }
  return 0
}

const agregarEstilos = () => {
  const est = estilosPersonalizacion.value

  document.getElementById('estilos-libro')?.remove() // evita estilos duplicados
  const estilos = document.createElement('style')
  estilos.id = 'estilos-libro'
  estilos.textContent = `
    #contenedor-libro {
      color: ${est.color} !important;
      background-color: ${est.backgroundColor} !important;
      font-family: ${est.fontFamily} !important;
      font-size: ${est.fontSize} !important;
      letter-spacing: ${est.letterSpacing} !important;
      padding: 1.5rem;
      border-radius: 12px;
    }
    #contenedor-libro h1, #contenedor-libro h2,
    #contenedor-libro h3, #contenedor-libro h4 {
      color: ${est.color} !important; font-family: ${est.fontFamily} !important; margin-top: 24px; margin-bottom: 12px;
    }
    #contenedor-libro p {
      color: ${est.color} !important; margin-bottom: 14px; text-align: left;
    }
    #contenedor-libro span { color: ${est.color} !important; }
    #contenedor-libro img {
      max-width: 100%; height: auto;
      display: block; margin: 10px auto;
    }
    #contenedor-libro hr { border-color: #ccc; margin: 30px 0; }
    #contenedor-libro em, #contenedor-libro i { color: ${est.color} !important; }
    #contenedor-libro strong, #contenedor-libro b { color: ${est.color} !important; }
    #contenedor-libro .palabra.palabra-resaltada,
    #contenedor-libro span.palabra-resaltada {
      background-color: #ffe600 !important;
      color: #000000 !important;
      border-radius: 3px;
      box-shadow: 0 0 0 2px #ffe600;
      text-decoration: underline;
      text-decoration-thickness: 3px;
      text-underline-offset: 4px;
    }
  `
  document.head.appendChild(estilos)
}

const cargarVoces = () => {
  const voces = window.speechSynthesis.getVoices()
  vocesDisponibles.value = voces.filter(v => v.lang.startsWith('es'))

  const configGuardada = localStorage.getItem('config-lector')
  if (configGuardada) {
    const config = JSON.parse(configGuardada)
    velocidad.value = config.velocidad || 0.9
    const vozEncontrada = vocesDisponibles.value.find(v => v.name === config.voz)
    if (vozEncontrada) {
      vozSeleccionada.value = vozEncontrada.name
    } else if (vocesDisponibles.value.length > 0) {
      vozSeleccionada.value = vocesDisponibles.value[0].name
    }
  } else if (vocesDisponibles.value.length > 0 && !vozSeleccionada.value) {
    vozSeleccionada.value = vocesDisponibles.value[0].name
  }
}

// Recorre cada palabra ya envuelta por envolverPalabras() y, dentro de ella,
// pinta con su color asignado las letras/números que el usuario marcó
// en Configuración Visual (tabla configuracion_visual.letras_resaltadas).
const resaltarCaracteresConfigurados = (contenedor, mapaColores) => {
  if (!mapaColores || Object.keys(mapaColores).length === 0) return

  const palabras = contenedor.querySelectorAll('.palabra')

  palabras.forEach((elementoPalabra) => {
    const textoOriginal = elementoPalabra.textContent
    let huboCoincidencia = false

    const htmlNuevo = textoOriginal
      .split('')
      .map((caracter) => {
        const color = mapaColores[caracter.toLowerCase()]
        if (color) {
          huboCoincidencia = true
          return `<span style="color:${color} !important; font-weight:600;">${caracter}</span>`
        }
        return caracter
      })
      .join('')

    if (huboCoincidencia) {
      elementoPalabra.innerHTML = htmlNuevo
    }
  })
}

// Toma el HTML ya listo (sea el de un EPUB o el texto predeterminado)
// y le aplica el mismo tratamiento: estilos, envolver palabras para
// el resaltado de TTS, progreso guardado, etc.
const mostrarContenido = (html) => {
  if (!contenedorLibro.value) return

  contenedorLibro.value.innerHTML = html

  const est = estilosPersonalizacion.value
  Array.from(contenedorLibro.value.querySelectorAll('*')).forEach(el => {
    el.style.color = est.color
    el.style.backgroundColor = 'transparent'
    el.style.fontFamily = est.fontFamily
    el.style.letterSpacing = est.letterSpacing
  })

  envolverPalabras(contenedorLibro.value)
  palabrasDOM = contenedorLibro.value.querySelectorAll('.palabra')

  resaltarCaracteresConfigurados(contenedorLibro.value, configuracionStore.config?.letras_resaltadas)

  const indiceGuardado = cargarProgreso()
  if (indiceGuardado > 0) {
    progresoGuardado.value = true
    indicePausa.value = indiceGuardado

    setTimeout(() => {
      if (palabrasDOM[indiceGuardado]) {
        palabrasDOM[indiceGuardado].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }, 500)
  }

  cargando.value = false
}

const cargarLibro = async () => {
  // Documento de texto creado por la persona en Escritura
  if (props.contenidoTexto !== null && props.contenidoTexto !== undefined) {
    titulo.value = props.tituloDocumento || 'Documento'
    mostrarContenido(textoAHtml(props.contenidoTexto) || '<p>Este documento está vacío.</p>')
    return
  }

  // Sin documento elegido: se muestra el texto predeterminado
  // y no se intenta cargar ningún EPUB
  if (!props.url) {
    titulo.value = TEXTO_PREDETERMINADO.titulo
    mostrarContenido(TEXTO_PREDETERMINADO.html)
    return
  }

  try {
    const respuesta = await fetch(props.url)
    const blob = await respuesta.blob()
    const arrayBuffer = await blob.arrayBuffer()

    libro = Epub(arrayBuffer)

    const metadata = await libro.loaded.metadata
    titulo.value = metadata.title && metadata.title.trim() !== ''
      ? metadata.title
      : props.url.split('/').pop().split('?')[0]

    await libro.ready

    const spine = libro.spine
    let htmlCompleto = ''

    for (const item of spine.items) {
      const seccion = await libro.spine.get(item.href)
      if (seccion) {
        await seccion.load(libro.load.bind(libro))
        const body = seccion.document?.body
        if (body) {
          htmlCompleto += body.innerHTML + '<hr/>'
        }
        seccion.unload()
      }
    }

    mostrarContenido(htmlCompleto)

    // Solo se registra cuando es un EPUB real (props.nombreArchivo
    // viene lleno), nunca con el texto de demostración. Es
    // "fire-and-forget": si falla, no debe romper la lectura, por
    // eso solo se manda a consola.
    if (props.nombreArchivo) {
      api.post('/mascotas/registrar-lectura', { nombreArchivo: props.nombreArchivo }).catch((err) => {
        console.warn('No se pudo registrar la lectura para las recompensas:', err)
      })
    }

  } catch (err) {
    console.log('Error:', err)
    errorMsg.value = 'Error al cargar el libro: ' + err.message
    cargando.value = false
  }
}

onMounted(async () => {
  if (configuracionStore.plantillas.length === 0) {
    try { await configuracionStore.cargarPlantillas() } catch (e) { /* sin plantillas */ }
  }
  if (!configuracionStore.config) {
    await configuracionStore.cargarConfiguracion()
  }

  agregarEstilos()
  await cargarLibro()
  cargarVoces()
  window.speechSynthesis.onvoiceschanged = cargarVoces
})

const envolverPalabras = (elemento) => {
  const nodos = Array.from(elemento.childNodes)
  for (const nodo of nodos) {
    if (nodo.nodeType === Node.TEXT_NODE) {
      const texto = nodo.textContent
      if (texto.trim()) {
        const fragment = document.createDocumentFragment()
        const partes = texto.split(/(\s+)/)
        for (const parte of partes) {
          if (parte.trim()) {
            const span = document.createElement('span')
            span.className = 'palabra'
            span.textContent = parte
            fragment.appendChild(span)
          } else {
            fragment.appendChild(document.createTextNode(parte))
          }
        }
        nodo.parentNode.replaceChild(fragment, nodo)
      }
    } else if (nodo.nodeType === Node.ELEMENT_NODE && nodo.tagName !== 'IMG') {
      envolverPalabras(nodo)
    }
  }
}

const reproducir = () => {
  if (palabrasDOM.length === 0) return

  if (pausado.value || indicePausa.value > 0) {
    window.speechSynthesis.cancel()
    pausado.value = false
    const palabrasDesde = Array.from(palabrasDOM).slice(indicePausa.value)
    const texto = palabrasDesde.map(p => p.textContent).join(' ')
    iniciarSintesis(texto, indicePausa.value)
    return
  }

  const texto = Array.from(palabrasDOM).map(p => p.textContent).join(' ')
  iniciarSintesis(texto, 0)
}

// ===== Resaltado tipo karaoke =====
// Lo normal es que el navegador avise cada palabra con el evento "boundary".
// Pero algunas voces (por ejemplo las de Google en Chrome, o varias de celular)
// NO mandan ese evento, y entonces nada se resaltaba. Para esos casos hay un
// respaldo: si en 1.2 segundos no llega ningún aviso, el resaltado avanza solo,
// calculando el tiempo de cada palabra según su largo y la velocidad elegida.
let temporizadorRespaldo = null
let temporizadorAvance = null

const detenerKaraoke = () => {
  if (temporizadorRespaldo) { clearTimeout(temporizadorRespaldo); temporizadorRespaldo = null }
  if (temporizadorAvance) { clearTimeout(temporizadorAvance); temporizadorAvance = null }
}

const quitarResaltado = () => {
  const anterior = contenedorLibro.value?.querySelector('.palabra-resaltada')
  if (anterior) anterior.classList.remove('palabra-resaltada')
}

const resaltarPalabra = (indiceReal) => {
  quitarResaltado()
  const elemento = palabrasDOM[indiceReal]
  if (!elemento) return
  elemento.classList.add('palabra-resaltada')
  elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
  indicePausa.value = indiceReal
}

const iniciarSintesis = (texto, desdeIndice) => {
  detenerKaraoke()

  const enunciado = new SpeechSynthesisUtterance(texto)
  enunciado.lang = 'es-MX'
  enunciado.rate = parseFloat(velocidad.value)

  const voz = window.speechSynthesis.getVoices().find(v => v.name === vozSeleccionada.value)
  if (voz) enunciado.voice = voz

  const palabras = Array.from(palabrasDOM).slice(desdeIndice)
  const posiciones = []
  let pos = 0
  for (const palabra of palabras) {
    posiciones.push(pos)
    pos += palabra.textContent.trim().length + 1
  }

  let ultimoIndice = 0
  let llegoBoundary = false

  // Respaldo: avanza palabra por palabra con un temporizador
  const avanzarPorTiempo = (i) => {
    if (i >= palabras.length) return
    resaltarPalabra(desdeIndice + i)
    const letras = palabras[i].textContent.trim().length
    const duracion = Math.max(180, (letras + 1) * 70 / enunciado.rate)
    temporizadorAvance = setTimeout(() => avanzarPorTiempo(i + 1), duracion)
  }

  enunciado.onboundary = (evento) => {
    if (evento.name !== 'word') return
    llegoBoundary = true
    detenerKaraoke() // el navegador sí avisa: se usa su sincronización real

    const charIndex = evento.charIndex
    let indice = ultimoIndice
    for (let i = ultimoIndice; i < posiciones.length; i++) {
      if (posiciones[i] <= charIndex) {
        indice = i
      } else {
        break
      }
    }
    ultimoIndice = indice
    resaltarPalabra(desdeIndice + indice)
  }

  enunciado.onend = () => {
    detenerKaraoke()
    leyendo.value = false
    pausado.value = false
    ultimoIndice = 0
    quitarResaltado()
  }

  enunciado.onerror = () => { detenerKaraoke() }

  window.speechSynthesis.speak(enunciado)
  leyendo.value = true

  // Si en 1.2 s no llegó ningún aviso de palabra, se usa el respaldo por tiempo
  temporizadorRespaldo = setTimeout(() => {
    if (!llegoBoundary && leyendo.value) avanzarPorTiempo(0)
  }, 1200)
}

const pausar = () => {
  detenerKaraoke()
  window.speechSynthesis.pause()
  leyendo.value = false
  pausado.value = true
  guardarProgreso()
}

const detener = () => {
  detenerKaraoke()
  window.speechSynthesis.cancel()
  leyendo.value = false
  pausado.value = false
  guardarProgreso()
  indicePausa.value = 0
  const resaltada = contenedorLibro.value?.querySelector('.palabra-resaltada')
  if (resaltada) resaltada.classList.remove('palabra-resaltada')
}

// Aplica la plantilla elegida (cambia la personalización de lectura)
const alCambiarPlantilla = async () => {
  if (!plantillaSeleccionada.value) return
  await configuracionStore.aplicarPlantilla(plantillaSeleccionada.value)
}

const reiniciar = () => {
  detenerKaraoke()
  window.speechSynthesis.cancel()
  leyendo.value = false
  pausado.value = false
  indicePausa.value = 0
  progresoGuardado.value = false
  localStorage.removeItem(claveProgreso)
  const resaltada = contenedorLibro.value?.querySelector('.palabra-resaltada')
  if (resaltada) resaltada.classList.remove('palabra-resaltada')
  contenedorLibro.value?.scrollTo({ top: 0, behavior: 'smooth' })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onUnmounted(() => {
  detenerKaraoke()
  guardarProgreso()
  window.speechSynthesis.cancel()
  const estilos = document.getElementById('estilos-libro')
  if (estilos) estilos.remove()
  if (libro) libro.destroy()
})
</script>

<style scoped>
.aviso-progreso {
  padding: 4px 4px;
  margin-bottom: 4px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  background: transparent;
  color: var(--color-texto-secundario, #7a7a6a);
  font-size: 0.75rem;
}
.barra-lector {
  position: sticky;
  top: calc(var(--alto-nav, 62px) + 8px);
  z-index: 100;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-bottom: 16px;
  padding: 12px 18px;
  background: var(--color-tarjeta, #fff);
  color: var(--color-texto-principal, #3a3a2c);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radio-tarjeta, 16px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.btn-redondo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: var(--color-tarjeta, #fff);
  color: var(--color-texto-secundario, #7a7a6a);
  font-size: 15px;
  cursor: pointer;
}
.btn-redondo.btn-play {
  background: var(--color-primario, #5c7a3f);
  border-color: var(--color-primario, #5c7a3f);
  color: #fff;
}
.btn-redondo.btn-play:hover { background: var(--color-primario-hover, #4a6532); }
.campo-barra {
  max-width: 220px;
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: var(--color-texto-principal, #3a3a2c);
  font-size: 0.8rem;
}
.grupo-velocidad { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
.grupo-velocidad input { width: 90px; accent-color: var(--color-primario, #5c7a3f); }
.titulo-barra { flex: 1; margin: 0; min-width: 120px; font-size: 0.85rem; font-weight: 400; }
.btn-barra {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: var(--color-tarjeta, #fff);
  color: var(--color-texto-principal, #3a3a2c);
  font-size: 0.8rem;
  cursor: pointer;
}

/* En pantallas grandes, el contenedor de opciones no afecta el diseño */
.opciones-barra { display: contents; }
.btn-ajustes { display: none; }

/* Celular: barra compacta, los ajustes se abren con el botón ⚙ */
@media (max-width: 640px) {
  .barra-lector {
    gap: 8px;
    padding: 8px 10px;
    margin-bottom: 10px;
  }
  .btn-redondo { width: 36px; height: 36px; font-size: 14px; }
  .btn-ajustes { display: inline-block; }
  .btn-ajustes.activo {
    background: var(--color-suave, #eef2e6);
    border-color: var(--color-primario, #5c7a3f);
  }
  .btn-docs { margin-left: auto; padding: 6px 12px; }
  .opciones-barra {
    display: none;
    order: 10;
    flex: 0 0 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
  .opciones-barra.abierto { display: flex; }
  .campo-barra {
    max-width: none;
    width: 100%;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 8px;
  }
  .grupo-velocidad { justify-content: space-between; }
  .grupo-velocidad input { flex: 1; width: auto; }
  .titulo-barra { min-width: 0; font-size: 0.8rem; }
}
</style>