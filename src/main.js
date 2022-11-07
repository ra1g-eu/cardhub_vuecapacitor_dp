import 'vuetify/styles'
import { createApp } from 'vue'
import AppX from './App.vue'
import {routes} from './router'
import {createRouter, createWebHistory} from 'vue-router'
import axios from "axios";
import VueAxios from "vue-axios";
import {createVuetify} from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {loadFonts} from "@/plugins/webfontloader"
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import { App } from '@capacitor/app';

loadFonts()

const router = createRouter({
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    },
    history: createWebHistory(),
    routes: routes
});

let appV = createApp(AppX);

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'dark'
    },
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        }
    },
});

appV.use(vuetify);
appV.use(VueAxios, axios);
appV.use(router);
appV.mount('#app');

axios.defaults.headers.common['App-Request-Header'] = 'CardHub/REQ/CH/1.0.0';
appV.config.globalProperties.$axios = axios;
appV.config.globalProperties.$router = router;
//appV.config.globalProperties.$apiUrl = 'https://api.ra1g.eu/';
appV.config.globalProperties.$apiUrl = 'http://localhost:3000/';

router.beforeEach((to) => {
    if (!localStorage.getItem('CardHub_LoginCode')) {
        if (to.path.includes('/moje-karty')) {
            router.push({path: '/'});
        }
        if (to.path.includes('/nova-karta')) {
            router.push({path: '/'});
        }
        if (to.path.includes('/karta')) {
            router.push({path: '/'});
        }
        if (to.path.includes('/prevodnik')) {
            router.push({path: '/'});
        }
    }
});

App.addListener('backButton', ({ canGoBack }) => {
    if(canGoBack){
        window.history.back();
    } else {
        App.exitApp();
    }
});


