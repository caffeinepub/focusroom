import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Phase, type Session } from '../backend';
import type { Principal } from '@dfinity/principal';

const LAST_ROOM_KEY = 'focusroom_last_room';

// ─── Room ────────────────────────────────────────────────────────────────────

export function useCreateRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!actor) throw new Error('Actor not available. Please wait and try again.');
      const code = await actor.createRoom();
      if (!code || typeof code !== 'string') {
        throw new Error('Invalid room code returned from server.');
      }
      // Join the room immediately after creating it so the creator is a participant
      await actor.joinRoom(code);
      // Persist for instant rejoin
      localStorage.setItem(LAST_ROOM_KEY, code);
      return code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useJoinRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string): Promise<void> => {
      if (!actor) throw new Error('Actor not available. Please wait and try again.');
      await actor.joinRoom(code);
      // Persist for instant rejoin
      localStorage.setItem(LAST_ROOM_KEY, code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

// ─── Timer ───────────────────────────────────────────────────────────────────

export function useTimerState(code: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Session | null>({
    queryKey: ['timerState', code],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTimerState(code);
    },
    enabled: !!actor && !actorFetching && !!code,
    refetchInterval: 2000,
    staleTime: 0,
  });
}

export function useStartSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, phase }: { code: string; phase: Phase }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.startSession(code, phase);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timerState', variables.code] });
    },
  });
}

// ─── Events (chat messages & goals) ──────────────────────────────────────────

export function useStoreEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      phase,
      date,
      roomCode,
    }: {
      name: string;
      phase: Phase | null;
      date: bigint;
      roomCode: string;
    }): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      return actor.storeEvent(name, phase, date);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.roomCode] });
    },
  });
}

// ─── Participants ─────────────────────────────────────────────────────────────

export function useGetRoomParticipants(roomId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[Principal, string]>>({
    queryKey: ['roomParticipants', roomId],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getRoomParticipants(roomId);
      return result as Array<[Principal, string]>;
    },
    enabled: !!actor && !actorFetching && !!roomId,
    refetchInterval: 4000,
    staleTime: 0,
  });
}
