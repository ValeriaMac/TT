<template>
  <div>
    <!-- Se está buscando la URL del archivo elegido -->
    <p v-if="cargando" style="padding: 20px;">Abriendo documento...</p>

    <!-- Con documento elegido (?epub=...) o sin él (texto predeterminado):
         en ambos casos VistaLector decide qué mostrar según si le llega
         una url o no -->
    <VistaLector
      v-else
      :url="archivoUrl"
      :nombreArchivo="nombreArchivo"
      @regresar="router.push('/documentos')"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import VistaLector from '../componentes/VistaLector.vue'
import { useConfiguracionStore } from '../store/configuracion.store'

const route = useRoute()
const router = useRouter()
const configuracionStore = useConfiguracionStore()

const archivoUrl = ref(null)
const nombreArchivo = ref('')
const cargando = ref(false)

// Busca la URL real del EPUB a partir del nombre que viene en ?epub=
async function cargarDesdeQuery() {
  const nombre = route.query.epub

  if (!nombre) {
    archivoUrl.value = null
    return
  }

  cargando.value = true
  try {
    const respuesta = await axios.get(`http://localhost:3000/api/lector/url/${nombre}`)
    archivoUrl.value = respuesta.data.url
    nombreArchivo.value = nombre
  } catch (err) {
    archivoUrl.value = null
  } finally {
    cargando.value = false
  }
}

// Si el usuario abre otro documento sin salir de /lectura (el query
// cambia pero el componente no se vuelve a montar), esto lo detecta
watch(() => route.query.epub, cargarDesdeQuery)

onMounted(async () => {
  if (!configuracionStore.config) {
    await configuracionStore.cargarConfiguracion()
  }
  cargarDesdeQuery()
})
</script>