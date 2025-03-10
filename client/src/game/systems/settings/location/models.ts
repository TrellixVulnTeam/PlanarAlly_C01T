import type { LocalId } from "../../../id";

export type WithDefault<T> = { default: T; override?: T; value: T };
export type WithLocationDefault<T> = { default: T; value: T; location: { [key: number]: T | undefined } };

export interface ServerLocationOptions {
    use_grid: boolean;
    grid_type: string;
    unit_size: number;
    unit_size_unit: string;
    full_fow: boolean;
    fow_opacity: number;
    fow_los: boolean;
    vision_mode: string;
    vision_min_range: number;
    vision_max_range: number;
    spawn_locations: string;
    move_player_on_token_change: boolean;

    air_map_background: string;
    ground_map_background: string;
    underground_map_background: string;
}

export interface LocationOptions {
    useGrid: boolean;
    gridType: string;
    unitSize: number;
    unitSizeUnit: string;
    fullFow: boolean;
    fowOpacity: number;
    fowLos: boolean;
    visionMode: string;
    visionMinRange: number;
    visionMaxRange: number;
    spawnLocations: LocalId[];
    movePlayerOnTokenChange: boolean;

    airMapBackground: string;
    groundMapBackground: string;
    undergroundMapBackground: string;
}

export interface ServerLocationInfo {
    default: ServerLocationOptions;
    active: number;
    locations: { [key: number]: Partial<ServerLocationOptions> };
}
