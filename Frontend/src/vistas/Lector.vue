<template>
  <div>
    <MisDocumentos
      v-if="!archivoUrl"
      @epub-cargado="manejarEpubCargado"
    />
    <VistaLector
      v-else
      :url="archivoUrl"
      :nombreArchivo="nombreArchivo"
      @regresar="archivoUrl = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MisDocumentos from '../componentes/MisDocumentos.vue'
import VistaLector from '../componentes/VistaLector.vue'
import { useConfiguracionStore } from '../store/configuracion.store'

const archivoUrl = ref(null)
const nombreArchivo = ref('')

const manejarEpubCargado = (datos) => {
  archivoUrl.value = datos.url
  nombreArchivo.value = datos.nombre
}

const configuracionStore = useConfiguracionStore()

onMounted(async () => {
  if (!configuracionStore.config) {
    await configuracionStore.cargarConfiguracion()
  }
})
</script>