<template>
  <div style="padding: 20px;">
    <h1>Módulo de lectura</h1>

    <!-- Tarjeta de controles -->
    <div style="border: 1px solid #444; border-radius: 8px; padding: 15px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap; margin-bottom: 20px;">
      
      <!-- Botón play -->
      <button
        @click="abrirSeleccionado"
        :disabled="!epubSeleccionado"
        style="width: 40px; height: 40px; border-radius: 50%; font-size: 16px;"
      >
        ▶
      </button>

      <!-- Velocidad -->
      <div style="display: flex; align-items: center; gap: 8px;">
        <label>Velocidad: 1x</label>
        <input type="range" min="0.5" max="2" step="0.1" style="width: 80px;" />
      </div>

      <!-- Selector de libro -->
      <select v-model="epubSeleccionado" style="flex: 1; min-width: 150px;">
        <option value="" disabled>Seleccionar libro</option>
        <option v-for="epub in epubsDisponibles" :key="epub.name" :value="epub.name">
          {{ epub.name }}
        </option>
      </select>

      <!-- Selector de plantilla -->
      <select style="min-width: 150px;">
        <option>Seleccionar plantilla</option>
      </select>

      <!-- Botón subir EPUB -->
      <div>
        <input
          type="file"
          accept=".epub"
          ref="inputArchivo"
          style="display: none;"
          @change="seleccionarArchivo"
        />
        <button @click="inputArchivo.click()">↑ Subir EPUB</button>
      </div>

    </div>

    <!-- Mensaje de cargando -->
    <div v-if="cargando" style="text-align: center; padding: 20px;">
      <p>Subiendo archivo...</p>
    </div>

    <p v-if="error" style="color: red;">{{ error }}</p>

    <!-- Área de contenido del libro seleccionado -->
    <div v-if="epubSeleccionado" style="border: 1px solid #444; border-radius: 8px; padding: 20px;">
      <p style="color: #888;">{{ epubSeleccionado }}</p>
    </div>

    <div v-else style="border: 1px solid #444; border-radius: 8px; padding: 40px; text-align: center; color: #888;">
      <p>Selecciona un libro para comenzar a leer</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const emit = defineEmits(['epub-cargado'])

const archivo = ref(null)
const cargando = ref(false)
const error = ref(null)
const epubsDisponibles = ref([])
const epubSeleccionado = ref('')
const inputArchivo = ref(null)

const seleccionarArchivo = async (evento) => {
  archivo.value = evento.target.files[0]
  error.value = null
  if (archivo.value) {
    await subirArchivo()
  }
}

const subirArchivo = async () => {
  if (!archivo.value) return

  cargando.value = true
  error.value = null

  try {
    const formData = new FormData()
    formData.append('epub', archivo.value)

    await axios.post('http://localhost:3000/api/lector/subir', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    await cargarLista()
  } catch (err) {
    error.value = 'Error al subir el archivo. Intenta de nuevo.'
  } finally {
    cargando.value = false
  }
}

const cargarLista = async () => {
  try {
    const respuesta = await axios.get('http://localhost:3000/api/lector/lista')
    epubsDisponibles.value = respuesta.data.archivos
  } catch (err) {
    error.value = 'Error al cargar la lista de archivos.'
  }
}

const abrirSeleccionado = async () => {
  if (!epubSeleccionado.value) return
  try {
    const respuesta = await axios.get(`http://localhost:3000/api/lector/url/${epubSeleccionado.value}`)
    emit('epub-cargado', respuesta.data.url)
  } catch (err) {
    error.value = 'Error al abrir el archivo.'
  }
}

const eliminarEpub = async (nombre) => {
  if (!confirm(`¿Seguro que quieres eliminar "${nombre}"?`)) return
  try {
    await axios.delete(`http://localhost:3000/api/lector/eliminar/${nombre}`)
    if (epubSeleccionado.value === nombre) epubSeleccionado.value = ''
    await cargarLista()
  } catch (err) {
    error.value = 'Error al eliminar el archivo.'
  }
}

onMounted(() => {
  cargarLista()
})
</script>