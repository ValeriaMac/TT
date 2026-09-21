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
  max-width: 950px;
  margin: 0 auto;
  padding: 1.5rem;
}

.titulo-pagina {
  font-family: var(--fuente-encabezados);
  font-size: 1.8rem;
  margin-bottom: 1.2rem;
}
</style>