<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { watchEffect } from "vue";

import { socket } from "../../../assetManager/socket";
import { assetStore } from "../../../assetManager/state";
import { changeDirectory, getIdImageSrc, showIdName } from "../../../assetManager/utils";
import { i18n } from "../../../i18n";

import Modal from "./Modal.vue";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(["submit", "close"]);

const { t } = i18n.global;

const state = assetStore.state;

watchEffect(() => {
    if (props.visible) {
        assetStore.clear();
        assetStore.clearSelected();
        assetStore.clearFolderPath();
        assetStore.setModalActive(true);
        if (!socket.connected) socket.connect();
        socket.emit("Folder.Get");
    } else {
        if (socket.connected) socket.disconnect();
    }
});

function select(event: MouseEvent, inode: number): void {
    assetStore.clearSelected();
    if (assetStore.state.files.includes(inode)) {
        assetStore.addSelectedInode(inode);
    }
}
</script>

<template>
    <modal :visible="visible" @close="emit('close')">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                Asset Picker
                <div class="header-close" @click="emit('close')" :title="t('common.close')">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <div id="assets">
                <div id="breadcrumbs">
                    <div>/</div>
                    <div v-for="dir in state.folderPath" :key="dir">{{ showIdName(dir) }}</div>
                </div>
                <div id="explorer">
                    <div class="inode folder" v-if="state.folderPath.length" @dblclick="changeDirectory(-1)">
                        <font-awesome-icon icon="folder" style="font-size: 50px" />
                        <div class="title">..</div>
                    </div>
                    <div
                        class="inode folder"
                        draggable="true"
                        v-for="key in state.folders"
                        :key="key"
                        :class="{ 'inode-selected': state.selected.includes(key) }"
                        @click="select($event, key)"
                        @dblclick="changeDirectory(key)"
                    >
                        <font-awesome-icon icon="folder" style="font-size: 50px" />
                        <div class="title">{{ showIdName(key) }}</div>
                    </div>
                    <div
                        class="inode file"
                        draggable="true"
                        v-for="file in state.files"
                        :key="file"
                        :class="{ 'inode-selected': state.selected.includes(file) }"
                        @click="select($event, file)"
                    >
                        <img :src="getIdImageSrc(file)" width="50" alt="" />
                        <div class="title">{{ showIdName(file) }}</div>
                    </div>
                </div>
            </div>
            <div class="buttons">
                <button @click="emit('submit')">Select</button>
                <button @click="emit('close')">Cancel</button>
            </div>
        </div>
    </modal>
</template>

<style scoped lang="scss">
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    max-width: 30vw;
    padding: 10px;
    padding-top: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
}

#assets {
    display: flex;
    max-height: 50vh;
    width: 30vw;
    flex-grow: 1;
    background-color: white;
    position: relative;
    padding-top: 45px;

    #breadcrumbs {
        position: absolute;
        left: 0;
        top: 0;
        display: flex;
        overflow: hidden;
        z-index: 1;
        background-color: #ff7052;
        color: white;
        align-items: center;
        padding: 5px;
        border-bottom-right-radius: 10px;

        > div {
            position: relative;
            padding: 10px;
            padding-left: 20px;
            text-align: center;

            &:first-child {
                padding-left: 10px;
            }
        }

        div {
            &:last-child::after {
                content: none;
            }

            &::after {
                content: "";
                position: absolute;
                display: inline-block;
                width: 30px;
                height: 30px;
                top: 3px;
                right: -10px;
                background-color: transparent;
                border-top-right-radius: 5px;
                -webkit-transform: scale(0.707) rotate(45deg);
                transform: scale(0.707) rotate(45deg);
                box-shadow: 1px -1px rgba(0, 0, 0, 0.25);
                z-index: 1;
            }
        }
    }

    #explorer {
        position: relative;
        left: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
        max-width: 100%;
        max-height: 54vh;
        overflow: auto;

        .inode {
            user-select: none;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 15px;

            * {
                pointer-events: none;
            }
        }

        .inode:hover,
        .inode-selected {
            cursor: pointer;
            background-color: #ff7052;
        }
        .title {
            word-break: break-all;
        }
    }
}

.buttons {
    align-self: flex-end;
    margin-top: 15px;
}

button:first-of-type {
    margin-right: 10px;
}

.focus {
    color: #7c253e;
    font-weight: bold;
}
</style>
