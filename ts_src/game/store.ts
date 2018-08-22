import Vue from 'vue'
import Vuex from 'vuex'

import gameManager from './planarally';
import { socket, sendClientOptions } from './socket';
import { GlobalPoint } from './geom';
import { g2l, l2g } from './units';

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        // This is a limited view of selectable layers that is used to generate the layer selection UI and ability to switch layers
        // See the GameManager.LayerManager for proper layer management tools
        layers: <string[]> [],
        selectedLayerIndex: -1,

        IS_DM: false,
        gridSize: 50,
        username: '',
        roomName: '',
        roomCreator: '',
        invitationCode: '',

        gridColour: 'rgba("255, 255, 255, 1)',
        fowColour: 'rgba(255, 255, 255, 1)',
        panX: 0,
        panY: 0,
        zoomFactor: 1,

        unitSize: 5,
        useGrid: true,
        fullFOW: false,
        fowOpacity: 0.3,
        fowLOS: false,
        locationName: '',
    },
    getters: {
        selectedLayer: state => state.layers[state.selectedLayerIndex]
    },
    mutations: {
        setDM (state, isDM) {
            state.IS_DM = isDM;
        },
        setUsername(state, username) {
            state.username = username;
        },
        addLayer (state, name) {
            state.layers.push(name);
            if (state.selectedLayerIndex === -1)
                state.selectedLayerIndex = state.layers.indexOf(name);
        },
        selectLayer (state, name) {
            const index = state.layers.indexOf(name);
            if (index >= 0)
                state.selectedLayerIndex = index;
        },
        setGridSize(state, payload: {size: number, sync: boolean}): void {
            if (state.gridSize !== payload.size) {
                state.gridSize = payload.size;
                const gridLayer = gameManager.layerManager.getGridLayer();
                if (gridLayer !== undefined)
                    gridLayer.drawGrid();
                if (payload.sync)
                    socket.emit("set gridsize", payload.size);
            }
        },
        setRoomName (state, name) {
            state.roomName = name;
        },
        setRoomCreator (state, name) {
            state.roomCreator = name;
        },
        setInvitationCode (state, code) {
            state.invitationCode = code;
        },
        setGridColour (state, colour) {
            state.gridColour = colour;
        },
        setFOWColour (state, colour) {
            state.fowColour = colour;
            gameManager.layerManager.invalidate();
        },
        setPanX (state, x) {
            state.panX = x;
        },
        setPanY (state, y) {
            state.panY = y;
        },
        setZoomFactor (state, zoomFactor) {
            state.zoomFactor = zoomFactor;
        },
        increasePanX (state, increase) {
            state.panX += increase;
        },
        increasePanY (state, increase) {
            state.panY += increase;
        },
        updateZoom (state, payload: {newZoomValue: number, zoomLocation: GlobalPoint}) {
            if (payload.newZoomValue <= 0.01)
                payload.newZoomValue = 0.01;
        
            const oldLoc = g2l(payload.zoomLocation);
            
            state.zoomFactor = payload.newZoomValue;
        
            const newLoc = l2g(oldLoc);
        
            // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
            const diff = newLoc.subtract(payload.zoomLocation);
            state.panX += diff.x;
            state.panY += diff.y;
        
            gameManager.layerManager.invalidate();
            sendClientOptions();
            $("#zoomer").slider({ value: payload.newZoomValue });
        },
        setUnitSize (state, payload: {size: number, sync: boolean}) {
            if (state.unitSize !== payload.size) {
                state.unitSize = payload.size;
                if(gameManager.layerManager.getGridLayer() !== undefined)
                    gameManager.layerManager.getGridLayer()!.drawGrid();
                if(payload.sync)
                    socket.emit("set locationOptions", { 'unitSize': payload.size });
            }
        },
        setUseGrid(state, payload: {useGrid: boolean, sync: boolean}) {
            if (state.useGrid !== payload.useGrid) {
                state.useGrid = payload.useGrid;
                const gridLayer = gameManager.layerManager.getGridLayer()!;
                if (payload.useGrid)
                    gridLayer.canvas.style.display = 'block';
                else
                gridLayer.canvas.style.display = 'none';
                if (payload.sync)
                    socket.emit("set locationOptions", { 'useGrid': payload.useGrid });
            }
        },
        setFullFOW(state, payload: {fullFOW: boolean, sync: boolean}) {
            if (state.fullFOW !== payload.fullFOW) {
                state.fullFOW = payload.fullFOW;
                gameManager.layerManager.invalidateLight();
                if (payload.sync)
                    socket.emit("set locationOptions", { 'fullFOW': payload.fullFOW });
            }
        },
        setFOWOpacity(state, payload: {fowOpacity: number, sync: boolean}) {
            state.fowOpacity = payload.fowOpacity;
            gameManager.layerManager.invalidateLight();
            if (payload.sync)
                socket.emit("set locationOptions", { 'fowOpacity': payload.fowOpacity });
        },
        setLineOfSight(state, payload: {fowLOS: boolean, sync: boolean}) {
            if (state.fowLOS !== payload.fowLOS) {
                state.fowLOS = payload.fowLOS;
                gameManager.layerManager.invalidate();
                if (payload.sync)
                    socket.emit("set locationOptions", { 'fowLOS': payload.fowLOS });
            }
        },
        setLocationName (state, name) {
            state.locationName = name;
        }
    }
    
})