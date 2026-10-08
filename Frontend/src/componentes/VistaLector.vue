<template>
  <div style="padding: 20px;">

    <!-- Tarjeta de controles de lectura -->
    <div class="barra-lector">
      <button class="btn-redondo btn-play" :title="leyendo ? 'Pausar' : 'Reproducir'" @click="leyendo ? pausar() : reproducir()">
        {{ leyendo ? '⏸' : '▶' }}
      </button>
      <button class="btn-redondo" title="Detener" @click="detener">■</button>
      <button class="btn-redondo" title="Reiniciar" @click="reiniciar">↺</button>

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

      <button class="btn-barra" @click="emit('regresar')">↑ Subir EPUB</button>
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
import Epub from 'epubjs'
import { useConfiguracionStore } from '../store/configuracion.store'
import { useEstilosPersonalizacion } from '../composables/useEstilosPersonalizacion'
import api from '../servicios/api'

const props = defineProps({
  url: String,
  nombreArchivo: String
})

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

const claveProgreso = `progreso-${props.nombreArchivo || 'texto-predeterminado'}`

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
    .palabra-resaltada {
      background-color: yellow !important;
      color: black !important;
      border-radius: 3px;
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

const iniciarSintesis = (texto, desdeIndice) => {
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

  enunciado.onboundary = (evento) => {
    if (evento.name === 'word') {
      const anterior = contenedorLibro.value?.querySelector('.palabra-resaltada')
      if (anterior) anterior.classList.remove('palabra-resaltada')

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

      const indiceReal = desdeIndice + indice
      if (palabrasDOM[indiceReal]) {
        palabrasDOM[indiceReal].classList.add('palabra-resaltada')
        palabrasDOM[indiceReal].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
        indicePausa.value = indiceReal
      }
    }
  }

  enunciado.onend = () => {
    leyendo.value = false
    pausado.value = false
    ultimoIndice = 0
    const resaltada = contenedorLibro.value?.querySelector('.palabra-resaltada')
    if (resaltada) resaltada.classList.remove('palabra-resaltada')
  }

  window.speechSynthesis.speak(enunciado)
  leyendo.value = true
}

const pausar = () => {
  window.speechSynthesis.pause()
  leyendo.value = false
  pausado.value = true
  guardarProgreso()
}

const detener = () => {
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
</style>
