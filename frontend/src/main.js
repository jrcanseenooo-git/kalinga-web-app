import { createApp }    from 'vue'
import { createPinia }  from 'pinia'
import vue3GoogleLogin  from 'vue3-google-login'
import App              from './App.vue'
import router           from './router'
import './style.css'

if (new URLSearchParams(window.location.search).get('demoScreenshots') === '1') {
  localStorage.setItem('cefmu_demo_screenshots', '1')
  localStorage.setItem('cefmu_token', 'ses_demo_screenshot_token')
  localStorage.setItem('cefmu_user', JSON.stringify({
    email: 'admin.demo@dswd.gov.ph',
    name: 'Demo Admin',
    role: 'admin',
    lgu_code: '',
  }))
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID
})

app.mount('#app')
