import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Principal } from '@dfinity/principal';

const LAST_ROOM_KEY = 'studyroom_last_room';

// ─── Room ────────────────────────────────────────────────────────────────────

export function useCreateRoom() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!actor || actorFetching) {
        throw new Error('Actor not available. Please wait for the network connection to be established.');
      }
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
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string): Promise<void> => {
      if (!actor || actorFetching) {
        throw new Error('Backend actor not yet initialized. Please wait a moment and try again.');
      }
      await actor.joinRoom(code);
      // Persist for instant rejoin
      localStorage.setItem(LAST_ROOM_KEY, code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

// ─── Events (chat messages) ───────────────────────────────────────────────────

export function useStoreEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      date,
      roomCode,
    }: {
      name: string;
      date: bigint;
      roomCode: string;
    }): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      return actor.storeEvent(name, date);
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

// ─── XP ──────────────────────────────────────────────────────────────────────

export function useAwardXp() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, amount }: { recipient: Principal; amount: bigint }): Promise<void> => {
      if (!actor) throw new Error('Actor not available');
      await actor.awardXp(recipient, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
