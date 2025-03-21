import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import VueKonva from 'vue-konva'

createApp(App).use(VueKonva).use(ElementPlus).mount('#app')
