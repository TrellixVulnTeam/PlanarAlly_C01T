import { uuidv4 } from "../core/utils";
import {
    requestGroupInfo,
    sendCreateGroup,
    sendGroupJoin,
    sendGroupLeave,
    sendGroupUpdate,
    sendMemberBadgeUpdate,
    sendRemoveGroup,
} from "./api/emits/groups";
import { CREATION_ORDER_TYPES, Group, groupToClient, groupToServer, ServerGroup } from "./comm/types/groups";
import { layerManager } from "./layers/manager";
import { Shape } from "./shapes/shape";

const numberCharacterSet = "0123456789".split("");
const latinCharacterSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const CHARACTER_SETS = [numberCharacterSet, latinCharacterSet];

const groupMap: Map<string, Group> = new Map();
const memberMap: Map<string, Set<string>> = new Map();

export function addNewGroup(group: Group, sync: boolean): void {
    groupMap.set(group.uuid, group);
    memberMap.set(group.uuid, new Set());
    if (sync) {
        sendCreateGroup(groupToServer(group));
    }
}

export function removeGroup(groupId: string, sync: boolean): void {
    const members = getGroupMembers(groupId);
    for (const member of members) {
        member.groupId = undefined;
        member.setShowBadge(false, false);
    }
    if (sync) sendRemoveGroup(groupId);
    memberMap.delete(groupId);
    groupMap.delete(groupId);
}

export function createNewGroupForShape(shape: Shape): void {
    const group: Group = {
        uuid: uuidv4(),
        characterSet: numberCharacterSet,
        creationOrder: "incrementing",
    };
    addNewGroup(group, true);
    addGroupMember(group.uuid, shape.uuid, true);
}

export function updateGroupFromServer(serverGroup: ServerGroup): void {
    const group = groupToClient(serverGroup);
    groupMap.set(group.uuid, group);
    for (const layer of new Set(getGroupMembers(group.uuid).map(s => s.layer))) {
        layer.invalidate(true);
    }
}

export function hasGroup(groupId: string): boolean {
    return groupMap.has(groupId);
}

export async function fetchGroup(groupId: string): Promise<Group> {
    const groupInfo = groupToClient(await requestGroupInfo(groupId));
    addNewGroup(groupInfo, false);
    return groupInfo;
}

export function getGroupMembers(groupId: string): Shape[] {
    const members = memberMap.get(groupId);
    if (members === undefined) return [];
    return [...members].map(m => layerManager.UUIDMap.get(m)!);
}

export function addGroupMember(groupId: string, member: string, sync: boolean, badge?: number): void {
    if (badge === undefined) {
        badge = generateNewBadge(groupId);
    }
    const shape = layerManager.UUIDMap.get(member);
    if (shape && shape.groupId !== groupId) {
        shape.groupId = groupId;
        shape.badge = badge;
    }
    memberMap.get(groupId)?.add(member);
    if (sync) {
        sendGroupJoin([{ uuid: member, group_id: groupId, badge }]);
    }
}

export function removeGroupMember(groupId: string, member: string, sync: boolean): void {
    const members = memberMap.get(groupId);
    members?.delete(member);
    const shape = layerManager.UUIDMap.get(member);
    if (shape !== undefined) shape.setShowBadge(false, false);
    if (sync) {
        sendGroupLeave([{ uuid: member, group_id: groupId }]);
    }
}

export function getGroup(groupId: string): Group | undefined {
    return groupMap.get(groupId);
}

export function setCharacterSet(groupId: string, characterSet: string[]): void {
    const newGroupInfo = { ...groupMap.get(groupId)!, characterSet };
    groupMap.set(groupId, newGroupInfo);
    sendGroupUpdate(groupToServer(newGroupInfo));
}

export function setCreationOrder(groupId: string, creationOrder: CREATION_ORDER_TYPES): void {
    const newGroupInfo = { ...groupMap.get(groupId)!, creationOrder };
    groupMap.set(groupId, newGroupInfo);
    sendGroupUpdate(groupToServer(newGroupInfo));

    const members = getGroupMembers(groupId);

    const alphabet = Array.from({ length: members.length * 2 }, (_, i) => i);

    for (const [i, member] of members.entries()) {
        if (creationOrder === "incrementing") {
            member.badge = i;
        } else {
            const index = Math.floor(Math.random() * alphabet.length);
            member.badge = alphabet[index];
            alphabet.splice(index, 1);
        }
    }

    sendMemberBadgeUpdate(
        members.map(m => ({
            uuid: m.uuid,
            badge: m.badge,
        })),
    );
}

export function getBadgeCharacters(shape: Shape): string {
    if (shape.groupId === undefined) return "0";

    const group = getGroup(shape.groupId)!;

    if (group.characterSet.join("") === numberCharacterSet.join("")) return (shape.badge + 1).toString();

    const csLength = group.characterSet.length;
    const message: string[] = [];
    let badge = shape.badge;
    while (badge >= 0) {
        const mod = badge % csLength;
        message.unshift(group.characterSet[mod]);
        if (badge === 0) break;
        badge = (badge - mod) / csLength - 1;
    }
    return message.join("");
}

export function generateNewBadge(groupId: string): number {
    const group = getGroup(groupId)!;
    const members = getGroupMembers(groupId);
    const badges = members.map(m => m.badge);
    const membersLength = Math.max(2 * members.length + 1, 10);

    if (group.creationOrder === "incrementing") {
        return Math.max(-1, ...badges) + 1;
    } else {
        let value: number | undefined;
        while (!value || badges.includes(value)) {
            value = Math.floor(Math.random() * membersLength);
        }
        return value;
    }
}
