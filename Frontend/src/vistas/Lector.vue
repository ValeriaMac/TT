<template>
  <div>
    <MisDocumentos 
      v-if="!archivoUrl" 
      @epub-cargado="manejarEpubCargado" 
    />
    <VistaLector 
      v-else 
      :url="archivoUrl" 
      @regresar="archivoUrl = null" 
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MisDocumentos from '../componentes/MisDocumentos.vue'
import VistaLector from '../componentes/VistaLector.vue'

const archivoUrl = ref(null)

const manejarEpubCargado = (url) => {
  archivoUrl.value = url
}
</script>