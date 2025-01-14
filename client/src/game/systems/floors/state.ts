import { computed } from "vue";

import type { ILayer } from "../../interfaces/layer";
import type { Floor, FloorId } from "../../models/floor";
import { buildState } from "../state";

interface ReactiveFloorState {
    floors: Floor[];
    floorIndex: FloorId;

    layers: ILayer[];
    layerIndex: number;
}

interface StaticFloorState {
    iteration: number;
}

const state = buildState<ReactiveFloorState, StaticFloorState>(
    {
        floors: [],
        floorIndex: -1 as FloorId,
        layers: [],
        layerIndex: -1,
    },
    { iteration: 0 },
);

export const floorState = {
    ...state,
    currentFloor: computed(() => {
        if (state.reactive.floorIndex < 0) return undefined;
        return state.reactive.floors[state.reactive.floorIndex];
    }),

    currentLayer: computed(() => {
        if (state.reactive.layerIndex < 0) return undefined;
        return state.reactive.layers[state.reactive.layerIndex];
    }),
};
