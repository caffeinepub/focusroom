import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type UniqueCode = string;
export interface Session {
    startTime: Time;
    isPause: boolean;
    phase: Phase;
}
export type Time = bigint;
export type RoomId = string;
export interface UserProfile {
    username: string;
}
export enum Phase {
    focus = "focus",
    pause = "pause"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createRoom(): Promise<string>;
    getBurntCategories(): Promise<Array<RoomId>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentCategory(): Promise<RoomId | null>;
    getPreviousCategories(): Promise<Array<RoomId>>;
    getTimerState(code: string): Promise<Session | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinRoom(code: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startSession(code: string, phase: Phase): Promise<void>;
    storeEvent(name: string, phase: Phase | null, date: Time): Promise<UniqueCode>;
}
