<template>
  <div class="pagina-documentos">
    <div class="encabezado-documentos">
      <h1>Documentos</h1>
      <div class="botones-encabezado">
        <button class="btn-secundario" @click="inputArchivo.click()">
          ⬆ Subir EPUB
        </button>
        <button class="btn-secundario" @click="router.push('/escritura')">
          ✎ Crear nuevo
        </button>
      </div>
    </div>

    <input
      type="file"
      accept=".epub"
      ref="inputArchivo"
      style="display: none;"
      @change="seleccionarArchivo"
    />

    <p v-if="cargando" class="mensaje-info">Subiendo archivo...</p>
    <p v-if="error" class="mensaje-error">{{ error }}</p>

    <!-- Lista de documentos -->
    <div v-if="epubsDisponibles.length > 0" class="grid-documentos">
      <div v-for="epub in epubsDisponibles" :key="epub.name" class="tarjeta-documento">
        <div class="encabezado-tarjeta">
          <div class="icono-documento">📄</div>
          <div class="info-documento">
            <p class="titulo-documento">{{ epub.name }}</p>
            <p class="subtitulo-documento">Subido</p>
            <p class="fecha-documento">{{ formatearFecha(epub.created_at) }}</p>
          </div>
        </div>

        <p class="descripcion-documento">Archivo EPUB</p>

        <div class="acciones-documento">
          <button class="btn-accion" @click="abrirEpub(epub.name)">
            📖 Leer
          </button>
          <button class="btn-accion" @click="editarEpub(epub.name)">
            ✎ Editar
          </button>
          <button class="btn-eliminar" @click="eliminarEpub(epub.name)">
            🗑
          </button>
        </div>
      </div>
    </div>

    <!-- Sin documentos -->
    <div v-else-if="!cargando" class="estado-vacio">
      <div class="emoji-vacio">📄</div>
      <h2>Sin documentos</h2>
      <div class="botones-vacio">
        <button class="btn-primario" @click="router.push('/escritura')">
          ✎ Crear documento
        </button>
        <button class="btn-secundario" @click="inputArchivo.click()">
          ⬆ Subir EPUB
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

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

const abrirEpub = (nombre) => {
  // Navega a /lectura con el nombre del archivo en la URL; Lector.vue
  // se encarga de resolver la URL real y abrir el libro
  router.push({ path: '/lectura', query: { epub: nombre } })
}

const editarEpub = (nombre) => {
  // Igual que abrirEpub, pero hacia /escritura: Editor.vue extrae el
  // texto del EPUB y lo carga en el editor
  router.push({ path: '/escritura', query: { epub: nombre } })
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

<style scoped>
.pagina-documentos {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem;
}

.encabezado-documentos {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.encabezado-documentos h1 {
  font-family: var(--fuente-encabezados);
  font-size: 1.8rem;
}

.botones-encabezado {
  display: flex;
  gap: 0.6rem;
}

.btn-secundario {
  background: white;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-boton);
  padding: 0.6rem 1.1rem;
  cursor: pointer;
  font-weight: 500;
}

.btn-secundario:hover {
  background: #f5f5f0;
}

.btn-primario {
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: var(--radio-boton);
  padding: 0.6rem 1.1rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-primario:hover {
  background-color: var(--color-primario-hover);
}

.mensaje-info {
  color: var(--color-texto-secundario);
  margin-bottom: 1rem;
}

.mensaje-error {
  color: #c0392b;
  margin-bottom: 1rem;
}

.grid-documentos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.2rem;
}

.tarjeta-documento {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 1.3rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.encabezado-tarjeta {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin-bottom: 0.8rem;
}

.icono-documento {
  background: #f0f4e8;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.info-documento {
  min-width: 0;
}

.titulo-documento {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subtitulo-documento,
.fecha-documento {
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
}

.descripcion-documento {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
  margin-bottom: 1rem;
}

.acciones-documento {
  display: flex;
  gap: 0.5rem;
}

.btn-accion {
  flex: 1;
  background: white;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  padding: 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-accion:hover:not(:disabled) {
  background: #f5f5f0;
}

.btn-accion:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-eliminar {
  background: white;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  padding: 0.5rem 0.7rem;
  cursor: pointer;
  color: #c0392b;
}

.btn-eliminar:hover {
  background: #fdecea;
}

.estado-vacio {
  text-align: center;
  padding: 4rem 1rem;
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
}

.emoji-vacio {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

.estado-vacio h2 {
  font-family: var(--fuente-encabezados);
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.botones-vacio {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
}
</style>