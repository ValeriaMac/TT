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
  width: 100%;
  max-width: 1500px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 1.5rem;
}

.titulo-pagina {
  font-family: var(--fuente-encabezados);
  font-size: 1.8rem;
  margin-bottom: 1.2rem;
}
</style>