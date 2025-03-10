import { registerSystem } from "../..";
import type { System } from "../..";
import { sendLocationOption } from "../../../api/emits/location";
import { updateFogColour } from "../../../colour";
import { getGlobalId } from "../../../id";
import type { LocalId } from "../../../id";
import { floorSystem } from "../../floors";
import { floorState } from "../../floors/state";

import { isDefaultWrapper } from "./helpers";
import type { WithLocationDefault } from "./models";
import { locationSettingsState } from "./state";

const { mutableReactive: $, raw, reset } = locationSettingsState;

class LocationSettingsSystem implements System {
    clear(partial: boolean): void {
        if (!partial) reset();
    }

    private resetValue(setting: WithLocationDefault<unknown>): void {
        setting.value = setting.location[raw.activeLocation] ?? setting.default;
    }

    private setValue<T>(
        setting: WithLocationDefault<T>,
        newValue: T | undefined,
        location: number | undefined,
    ): boolean {
        if (location === undefined) {
            if (newValue === undefined) {
                console.error("Location setting called with undefined default value");
                return false;
            }
            if (newValue === setting.default) return false;
            setting.default = newValue;
        } else {
            if (newValue === setting.location[location]) return false;
            setting.location[location] = newValue;
        }
        this.resetValue(setting);
        return true;
    }

    setActiveLocation(location: number): void {
        $.activeLocation = location;
        for (const setting of Object.values($)) {
            if (isDefaultWrapper(setting)) {
                this.resetValue(setting);
            }
        }
    }

    // GRID

    setUseGrid(useGrid: boolean | undefined, location: number | undefined, sync: boolean): void {
        if (!this.setValue($.useGrid, useGrid, location)) return;

        for (const floor of floorState.raw.floors) {
            const gridLayer = floorSystem.getGridLayer(floor)!;
            if ($.useGrid.value) gridLayer.canvas.style.display = "block";
            else gridLayer.canvas.style.display = "none";
            gridLayer.invalidate();
        }

        if (sync) sendLocationOption("use_grid", useGrid, location);
    }

    setGridType(gridType: string | undefined, location: number | undefined, sync: boolean): void {
        if (gridType !== undefined && !["SQUARE", "POINTY_HEX", "FLAT_HEX"].includes(gridType)) {
            throw new Error("Unknown grid type set");
        }
        if (!this.setValue($.gridType, gridType, location)) return;

        for (const floor of floorState.raw.floors) {
            const gridLayer = floorSystem.getGridLayer(floor)!;
            gridLayer.invalidate();
        }

        if (sync) sendLocationOption("grid_type", gridType, location);
    }

    setUnitSize(unitSize: number | undefined, location: number | undefined, sync: boolean): void {
        if (!this.setValue($.unitSize, unitSize, location)) return;

        floorSystem.invalidateAllFloors();

        if (sync) sendLocationOption("unit_size", unitSize, location);
    }

    setUnitSizeUnit(unitSizeUnit: string | undefined, location: number | undefined, sync: boolean): void {
        if (!this.setValue($.unitSizeUnit, unitSizeUnit, location)) return;

        floorSystem.invalidateAllFloors();

        if (sync) sendLocationOption("unit_size_unit", unitSizeUnit, location);
    }

    // VISION

    setFullFow(fullFow: boolean | undefined, location: number | undefined, sync: boolean): void {
        if (!this.setValue($.fullFow, fullFow, location)) return;

        floorSystem.invalidateLightAllFloors();

        if (sync) sendLocationOption("full_fow", fullFow, location);
    }

    setFowLos(fowLos: boolean | undefined, location: number | undefined, sync: boolean): void {
        if (!this.setValue($.fowLos, fowLos, location)) return;

        floorSystem.invalidateAllFloors();

        if (sync) sendLocationOption("fow_los", fowLos, location);
    }

    setFowOpacity(fowOpacity: number | undefined, location: number | undefined, sync: boolean): void {
        if (!this.setValue($.fowOpacity, fowOpacity, location)) return;

        updateFogColour();
        floorSystem.invalidateLightAllFloors();

        if (sync) sendLocationOption("fow_opacity", fowOpacity, location);
    }

    setVisionMinRange(visionMinRange: number | undefined, location: number | undefined, sync: boolean): void {
        if (!this.setValue($.visionMinRange, visionMinRange, location)) return;

        floorSystem.invalidateLightAllFloors();

        if (sync) sendLocationOption("vision_min_range", visionMinRange, location);
    }

    setVisionMaxRange(visionMaxRange: number | undefined, location: number | undefined, sync: boolean): void {
        if (!this.setValue($.visionMaxRange, visionMaxRange, location)) return;

        floorSystem.invalidateLightAllFloors();

        if (sync) sendLocationOption("vision_max_range", visionMaxRange, location);
    }

    // FLOOR

    setAirMapBackground(airMapBackground: string | undefined, location: number | undefined, sync: boolean): void {
        if (!this.setValue($.airMapBackground, airMapBackground, location)) return;

        floorSystem.invalidateAllFloors();

        if (sync) sendLocationOption("air_map_background", airMapBackground, location);
    }

    setGroundMapBackground(groundMapBackground: string | undefined, location: number | undefined, sync: boolean): void {
        if (!this.setValue($.groundMapBackground, groundMapBackground, location)) return;

        floorSystem.invalidateAllFloors();

        if (sync) sendLocationOption("ground_map_background", groundMapBackground, location);
    }

    setUndergroundMapBackground(
        undergroundMapBackground: string | undefined,
        location: number | undefined,
        sync: boolean,
    ): void {
        if (!this.setValue($.undergroundMapBackground, undergroundMapBackground, location)) return;

        floorSystem.invalidateAllFloors();

        if (sync) sendLocationOption("underground_map_background", undergroundMapBackground, location);
    }

    // VARIA

    setMovePlayerOnTokenChange(
        movePlayerOnTokenChange: boolean | undefined,
        location: number | undefined,
        sync: boolean,
    ): void {
        if (!this.setValue($.movePlayerOnTokenChange, movePlayerOnTokenChange, location)) return;

        if (sync) sendLocationOption("move_player_on_token_change", movePlayerOnTokenChange, location);
    }

    // SPAWN LOCATIONS

    setSpawnLocations(spawnLocations: LocalId[], location: number, sync: boolean): void {
        $.spawnLocations.location[location] = spawnLocations;
        if (location === $.activeLocation) $.spawnLocations.value = spawnLocations;

        floorSystem.invalidateAllFloors();

        if (sync)
            sendLocationOption("spawn_locations", JSON.stringify(spawnLocations.map((s) => getGlobalId(s))), location);
    }
}

export const locationSettingsSystem = new LocationSettingsSystem();
registerSystem("locationSettings", locationSettingsSystem, false, locationSettingsState);
