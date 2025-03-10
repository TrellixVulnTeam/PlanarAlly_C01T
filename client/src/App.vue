<script setup lang="ts">
import { computed, ref } from "vue";

import { baseAdjust } from "./core/http";
import { coreStore } from "./store/core";

const webmError = ref(false);
const webmStart = 2 * Math.floor(Math.random() * 5);

const loading = computed(() => coreStore.state.loading);
</script>

<template>
    <div id="app">
        <div id="loading" v-if="loading">
            <video
                v-if="!webmError"
                autoplay
                loop
                muted
                playsinline
                style="height: 20vh"
                :src="baseAdjust('/static/img/loading.webm#t=' + webmStart)"
                @error="webmError = true"
            />
            <img v-else :src="baseAdjust('/static/img/loading.gif')" style="height: 20vh" />
        </div>
        <router-view v-slot="{ Component }">
            <component :is="Component" />
        </router-view>
    </div>
</template>

<style lang="scss">
@import "vue-toastification/dist/index.css";
@font-face {
    font-family: "Open Sans";
    src: local("OpenSans"), url("./core/fonts/OpenSans-Regular.ttf") format("truetype");
}

* {
    box-sizing: border-box;
}

@media (width: 2560px) and (height: 2560px) {
    html {
        font-size: calc(100% * 4 / 3);
    }
}

@media (max-device-width: 1024px) {
    html {
        font-size: calc(100% * 2 / 3);
    }
}

body {
    overscroll-behavior: contain;
}

html,
body,
#app {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 100%;
    min-height: 100%;
    font-family: "Open Sans", sans-serif;
    font-weight: 200;

    display: flex;
    background-repeat: repeat;
    background-attachment: fixed;

    #loading {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    svg {
        cursor: pointer;
    }
}

// don't move these inside the above or it will have higher specificity
a,
a:visited,
a:hover,
a:active {
    color: inherit;
}
</style>
