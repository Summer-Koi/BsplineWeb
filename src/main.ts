import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import VueKonva from 'vue-konva'

const pinia = createPinia()

const app = createApp(App)

app.use(VueKonva)
app.use(ElementPlus)
app.use(pinia)
app.mount('#app')
