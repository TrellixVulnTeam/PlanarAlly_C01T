import { throttle } from "lodash";

import type { GlobalPoint } from "../core/geometry";
import { SyncMode } from "../core/models/types";
import { Store } from "../core/store";
import { sendLgTokenConnect } from "../game/api/emits/lg";
import { sendShapePositionUpdate } from "../game/api/emits/shape/core";
import { getGlobalId, getShape } from "../game/id";
import type { LocalId } from "../game/id";
import type { IShape } from "../game/interfaces/shape";
import { LayerName } from "../game/models/floor";
import { rotateShapes } from "../game/operations/rotation";
import { accessSystem } from "../game/systems/access";
import type { ClientId } from "../game/systems/client/models";
import { floorSystem } from "../game/systems/floors";
import { floorState } from "../game/systems/floors/state";

type BoardInfo = Map<string, { client: ClientId; xOffset: number; yOffset: number }>;

interface LastGameboardState {
    lastGameboardShapes: number[];
    spawnMap: Map<number, { imageSource: string; assetId: number }>;
    boardInfo: BoardInfo;
}

const sendPosUpdate = throttle(sendShapePositionUpdate, 50);

class LastGameboardStore extends Store<LastGameboardState> {
    // Map<sessionId, typeId>
    private sessionMap: Map<number, number> = new Map();

    // Map<typeId, uuid>
    private shapeMap: Map<number, LocalId | null> = new Map();

    // Set of PA shapes that are actually attached to tokens
    private tokenShapes: Set<number> = new Set();

    private contourShapes: Map<number, LocalId> = new Map();
    private contourHistory: Map<number, [number, number][]> = new Map();

    protected data(): LastGameboardState {
        const boardInfo: BoardInfo = new Map();

        return {
            lastGameboardShapes: [],
            spawnMap: new Map(),
            boardInfo,
        };
    }

    clear(): void {
        this._state.spawnMap.clear();
        this._state.boardInfo.clear();
    }

    linkSession(sessionId: number, typeId: number): void {
        this.sessionMap.set(sessionId, typeId);
    }

    isLgShape(shape: LocalId): boolean {
        return [...this.shapeMap.values()].includes(shape);
    }

    getTypeId(sessionId: number): number | undefined {
        return this.sessionMap.get(sessionId);
    }

    // ATTACHING

    isTokenShape(typeId: number): boolean {
        return this.tokenShapes.has(typeId);
    }

    canAttach(position: GlobalPoint, typeId: number): IShape | null {
        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Tokens);
        for (const shape of layer?.getShapes({ includeComposites: false }) ?? []) {
            // skip if we're already attached
            if (this.shapeMap.get(typeId) === shape.id && shape.contains(position)) return null;
            if (!accessSystem.hasAccessTo(shape.id, false, { movement: true })) continue;

            // const type = [...this.shapeMap.entries()].find(([, uuid]) => uuid === shape.uuid);
            // if (type !== undefined) {
            //     if (type[1] !== null && [...this.contourShapes.values()].includes(type[1])) continue;
            // }

            if (shape.contains(position)) {
                return shape;
            }
        }
        return null;
    }

    addLgShape(typeId: number, id: LocalId, sync: boolean): void {
        this.shapeMap.set(typeId, id);
        if (sync) sendLgTokenConnect({ typeId, uuid: getGlobalId(id) });
        this.tokenShapes.add(typeId);

        // cleanup
        if (this.contourShapes.has(typeId)) {
            const oldUuid = this.contourShapes.get(typeId)!;
            const shape = getShape(oldUuid);
            this.contourHistory.delete(typeId);
            this.contourShapes.delete(typeId);
            if (shape === undefined) return;
            shape.layer.removeShape(shape, { sync: SyncMode.FULL_SYNC, recalculate: true, dropShapeId: true });
        }
    }

    // Position/Angle updates

    moveLgShape(sessionId: number, position: GlobalPoint): void {
        const typeId = this.sessionMap.get(sessionId);
        if (typeId === undefined) return;
        const uuid = this.shapeMap.get(typeId);
        if (uuid === undefined || uuid === null) return;

        const shape = getShape(uuid);
        if (shape === undefined) return;

        shape.center(position);
        shape.invalidate(false);
        sendPosUpdate([shape], false);
        // sendShapePositionUpdate([shape], false);
    }

    rotateShape(sessionId: number, angle: number): void {
        const typeId = this.sessionMap.get(sessionId);
        if (typeId === undefined) return;
        const uuid = this.shapeMap.get(typeId);
        if (uuid === undefined || uuid === null) return;

        const shape = getShape(uuid);

        // if (shape === undefined || !(shape.options.canRotate ?? false)) return;
        if (shape === undefined) return;

        rotateShapes([shape], angle - shape.angle - Math.PI / 2, shape.center(), false);
        sendPosUpdate([shape], false);
    }
}

export const lastGameboardStore = new LastGameboardStore();
(window as any).lastGameboardStore = lastGameboardStore;
