import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Signal {
    to: Principal;
    from: Principal;
    payload: string;
    signalType: SignalType;
}
export type UniqueCode = string;
export interface Session {
    startTime: Time;
    isPause: boolean;
    phase: Phase;
}
export type Time = bigint;
export interface SignalResponse {
    data: Array<Signal>;
}
export type RoomId = string;
export interface UserProfile {
    username: string;
}
export enum Phase {
    focus = "focus",
    pause = "pause"
}
export enum SignalType {
    iceCandidate = "iceCandidate",
    offer = "offer",
    answer = "answer"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearSignals(roomId: string): Promise<void>;
    createRoom(): Promise<string>;
    getBurntCategories(): Promise<Array<RoomId>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentCategory(): Promise<RoomId | null>;
    getPreviousCategories(): Promise<Array<RoomId>>;
    getRoomParticipants(roomId: string): Promise<Array<[Principal, string]>>;
    getTimerState(code: string): Promise<Session | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinRoom(code: string): Promise<void>;
    receiveSignals(roomId: string): Promise<SignalResponse>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendSignal(roomId: string, recipient: Principal, signalType: SignalType, payload: string): Promise<void>;
    startSession(code: string, phase: Phase): Promise<void>;
    storeEvent(name: string, phase: Phase | null, date: Time): Promise<UniqueCode>;
}
