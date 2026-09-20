<!-- vistas/Escritura.vue -->
<template>
  <div class="pagina-escritura">
    <h1 class="titulo-pagina">Escritura</h1>
    <Editor />
  </div>
</template>

<script setup>
import Editor from '@/componentes/Editor.vue'
</script>

<style scoped>
.pagina-escritura {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}

.titulo-pagina {
  margin-bottom: 1rem;
}
</style>