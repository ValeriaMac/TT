<template>
  <div style="padding: 20px;">

    <!-- Barra fija de controles -->
    <div style="position: fixed; top: 0; left: 0; right: 0; background-color: #1e1e1e; padding: 10px 20px; z-index: 100; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <button @click="emit('regresar')">← Regresar</button>
      <h2 style="margin: 0; font-size: 16px; flex: 1;">{{ titulo }}</h2>
      <button @click="reproducir" :disabled="leyendo">▶ Reproducir</button>
      <button @click="pausar" :disabled="!leyendo">⏸ Pausar</button>
      <button @click="detener">⏹ Detener</button>
      <label style="color: white;">Velocidad:</label>
      <input
        type="range"
        min="0.5"
        max="2"
        step="0.1"
        v-model="velocidad"
        style="width: 80px;"
      />
      <span style="color: white;">{{ velocidad }}x</span>
      <label style="color: white;">Voz:</label>
      <select v-model="vozSeleccionada" style="max-width: 150px;">
        <option v-for="voz in vocesDisponibles" :key="voz.name" :value="voz.name">
          {{ voz.name }}
        </option>
      </select>
    </div>

    <p v-if="cargando" style="margin-top: 60px;">Cargando libro...</p>
    <p v-if="errorMsg" style="color: red; margin-top: 60px;">{{ errorMsg }}</p>

    <!-- Contenido del libro con formato -->
    <div
      v-show="!cargando"
      ref="contenedorLibro"
      id="contenedor-libro"
      style="margin-top: 60px; max-width: 700px; margin-left: auto; margin-right: auto; line-height: 1.8; font-size: 18px;"
    ></div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Epub from 'epubjs'

const props = defineProps({
  url: String
})

const emit = defineEmits(['regresar'])

const titulo = ref('Cargando...')
const leyendo = ref(false)
const cargando = ref(true)
const errorMsg = ref(null)
const pausado = ref(false)
const velocidad = ref(0.9)
const indicePausa = ref(0)
const contenedorLibro = ref(null)
const vozSeleccionada = ref('')
const vocesDisponibles = ref([])

let libro = null
let palabrasDOM = []

const agregarEstilos = () => {
  const estilos = document.createElement('style')
  estilos.id = 'estilos-libro'
  estilos.textContent = `
    #contenedor-libro { color: white; }
    #contenedor-libro h1, #contenedor-libro h2,
    #contenedor-libro h3, #contenedor-libro h4 {
      color: white; margin-top: 24px; margin-bottom: 12px;
    }
    #contenedor-libro p {
      color: white; margin-bottom: 14px; text-align: justify;
    }
    #contenedor-libro span { color: white; }
    #contenedor-libro img {
      max-width: 100%; height: auto;
      display: block; margin: 10px auto;
    }
    #contenedor-libro hr { border-color: #444; margin: 30px 0; }
    #contenedor-libro em, #contenedor-libro i { color: white; }
    #contenedor-libro strong, #contenedor-libro b { color: white; }
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
  if (vocesDisponibles.value.length > 0 && !vozSeleccionada.value) {
    vozSeleccionada.value = vocesDisponibles.value[0].name
  }
}

const cargarLibro = async () => {
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

    if (contenedorLibro.value) {
      contenedorLibro.value.innerHTML = htmlCompleto
      Array.from(contenedorLibro.value.querySelectorAll('*')).forEach(el => {
        el.style.color = 'white'
        el.style.backgroundColor = 'transparent'
      })
      envolverPalabras(contenedorLibro.value)
      palabrasDOM = contenedorLibro.value.querySelectorAll('.palabra')
    }

    cargando.value = false

  } catch (err) {
    console.log('Error:', err)
    errorMsg.value = 'Error al cargar el libro: ' + err.message
    cargando.value = false
  }
}

onMounted(() => {
  agregarEstilos()
  cargarLibro()
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

  if (pausado.value) {
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
}

const detener = () => {
  window.speechSynthesis.cancel()
  leyendo.value = false
  pausado.value = false
  indicePausa.value = 0
  const resaltada = contenedorLibro.value?.querySelector('.palabra-resaltada')
  if (resaltada) resaltada.classList.remove('palabra-resaltada')
}

onUnmounted(() => {
  detener()
  const estilos = document.getElementById('estilos-libro')
  if (estilos) estilos.remove()
  if (libro) libro.destroy()
})
</script>