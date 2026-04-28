<template>
  <div style="padding: 20px;">

    <!-- Encabezado -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h1>Mis documentos</h1>
      <div style="display: flex; gap: 10px;">
        <button @click="inputArchivo.click()">↑ Subir EPUB</button>
        <button disabled>✎ Crear nuevo</button>
      </div>
    </div>

    <!-- Input oculto -->
    <input
      type="file"
      accept=".epub"
      ref="inputArchivo"
      style="display: none;"
      @change="seleccionarArchivo"
    />

    <p v-if="cargando">Subiendo archivo...</p>
    <p v-if="error" style="color: red;">{{ error }}</p>

    <!-- Lista de documentos -->
    <div v-if="epubsDisponibles.length > 0" style="display: flex; flex-wrap: wrap; gap: 20px;">
      <div
        v-for="epub in epubsDisponibles"
        :key="epub.name"
        style="border: 1px solid #444; border-radius: 8px; padding: 20px; width: 280px;"
      >
        <!-- Encabezado tarjeta -->
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <span style="font-size: 24px;">📄</span>
          <div>
            <p style="margin: 0; font-weight: bold;">{{ epub.name }}</p>
            <p style="margin: 0; font-size: 12px; color: #888;">Subido</p>
            <p style="margin: 0; font-size: 12px; color: #888;">{{ formatearFecha(epub.created_at) }}</p>
          </div>
        </div>

        <!-- Preview -->
        <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;">
          Archivo EPUB
        </p>

        <!-- Botones -->
        <div style="display: flex; align-items: center; gap: 10px;">
          <button @click="abrirEpub(epub.name)">📖 Leer</button>
          <button disabled>✎ Editar</button>
          <button @click="eliminarEpub(epub.name)" style="color: red; margin-left: auto;">🗑</button>
        </div>
      </div>
    </div>

    <!-- Sin documentos -->
    <div v-else-if="!cargando" style="text-align: center; padding: 60px; color: #888;">
      <p>No tienes documentos aún. ¡Sube tu primer EPUB!</p>
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
const inputArchivo = ref(null)

const formatearFecha = (fecha) => {
  if (!fecha) return ''
  const d = new Date(fecha)
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

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

const abrirEpub = async (nombre) => {
  try {
    const respuesta = await axios.get(`http://localhost:3000/api/lector/url/${nombre}`)
    emit('epub-cargado', {
      url: respuesta.data.url,
      nombre: nombre
    })
  } catch (err) {
    error.value = 'Error al abrir el archivo.'
  }
}

const eliminarEpub = async (nombre) => {
  if (!confirm(`¿Seguro que quieres eliminar "${nombre}"?`)) return
  try {
    await axios.delete(`http://localhost:3000/api/lector/eliminar/${nombre}`)
    await cargarLista()
  } catch (err) {
    error.value = 'Error al eliminar el archivo.'
  }
}

onMounted(() => {
  cargarLista()
})
</script>