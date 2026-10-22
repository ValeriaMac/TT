import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { iniciarTema } from './composables/useTema'

// Antes de montar, para que no parpadee el tema equivocado
iniciarTema()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')