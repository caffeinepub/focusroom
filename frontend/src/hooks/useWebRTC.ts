import { useEffect, useRef, useCallback, useState } from 'react';
import { useActor } from './useActor';
import { SignalType } from '../backend';
import type { Principal } from '@dfinity/principal';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const POLL_INTERVAL_MS = 1500;

export interface RemoteStream {
  peerId: string;
  username: string;
  stream: MediaStream;
}

interface UseWebRTCOptions {
  roomId: string;
  localStream: MediaStream | null;
  isEnabled: boolean;
  participants: Array<[Principal, string]>;
  localPrincipal: string;
}

export function useWebRTC({
  roomId,
  localStream,
  isEnabled,
  participants,
  localPrincipal,
}: UseWebRTCOptions) {
  const { actor } = useActor();

  // Map of peerId -> RTCPeerConnection
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  // Map of peerId -> username
  const peerUsernamesRef = useRef<Map<string, string>>(new Map());
  // Track which peers we've already sent offers to (to avoid duplicate offers)
  const offeredPeersRef = useRef<Set<string>>(new Set());
  // Pending ICE candidates queued before remote description is set
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isEnabledRef = useRef(isEnabled);
  const localStreamRef = useRef(localStream);
  const actorRef = useRef(actor);

  // Keep refs in sync
  useEffect(() => { isEnabledRef.current = isEnabled; }, [isEnabled]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { actorRef.current = actor; }, [actor]);

  const removeRemoteStream = useCallback((peerId: string) => {
    setRemoteStreams((prev) => prev.filter((s) => s.peerId !== peerId));
  }, []);

  const closePeerConnection = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    offeredPeersRef.current.delete(peerId);
    pendingCandidatesRef.current.delete(peerId);
    removeRemoteStream(peerId);
  }, [removeRemoteStream]);

  const createPeerConnection = useCallback(
    (peerId: string, username: string): RTCPeerConnection => {
      // Close existing connection if any
      if (peerConnectionsRef.current.has(peerId)) {
        closePeerConnection(peerId);
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionsRef.current.set(peerId, pc);
      peerUsernamesRef.current.set(peerId, username);

      // Add local tracks if camera is active
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // Handle incoming remote tracks
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;
        setRemoteStreams((prev) => {
          const existing = prev.find((s) => s.peerId === peerId);
          if (existing) {
            return prev.map((s) =>
              s.peerId === peerId ? { ...s, stream: remoteStream } : s
            );
          }
          return [...prev, { peerId, username, stream: remoteStream }];
        });
      };

      // Send ICE candidates via backend signaling
      pc.onicecandidate = async (event) => {
        if (!event.candidate) return;
        const currentActor = actorRef.current;
        if (!currentActor) return;
        try {
          await currentActor.sendSignal(
            roomId,
            { toString: () => peerId } as unknown as import('@dfinity/principal').Principal,
            SignalType.iceCandidate,
            JSON.stringify(event.candidate.toJSON())
          );
        } catch {
          // Ignore send errors silently
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          removeRemoteStream(peerId);
        }
      };

      return pc;
    },
    [roomId, closePeerConnection, removeRemoteStream]
  );

  // Initiate offers to all remote participants when camera is enabled
  const initiateConnections = useCallback(async () => {
    const currentActor = actorRef.current;
    if (!currentActor || !isEnabledRef.current) return;

    for (const [principal, username] of participants) {
      const peerId = principal.toString();
      if (peerId === localPrincipal) continue;
      if (offeredPeersRef.current.has(peerId)) continue;

      offeredPeersRef.current.add(peerId);

      const pc = createPeerConnection(peerId, username);

      try {
        const offer = await pc.createOffer({ offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);

        await currentActor.sendSignal(
          roomId,
          principal,
          SignalType.offer,
          JSON.stringify(pc.localDescription)
        );
      } catch {
        offeredPeersRef.current.delete(peerId);
        closePeerConnection(peerId);
      }
    }
  }, [participants, localPrincipal, roomId, createPeerConnection, closePeerConnection]);

  // Process incoming signals
  const processSignals = useCallback(async () => {
    const currentActor = actorRef.current;
    if (!currentActor) return;

    let response;
    try {
      response = await currentActor.receiveSignals(roomId);
    } catch {
      return;
    }

    const signals = response.data;
    if (!signals || signals.length === 0) return;

    // Clear signals after receiving
    try {
      await currentActor.clearSignals(roomId);
    } catch {
      // Ignore
    }

    for (const signal of signals) {
      const peerId = signal.from.toString();
      const username = peerUsernamesRef.current.get(peerId) ||
        participants.find(([p]) => p.toString() === peerId)?.[1] || peerId.slice(0, 8);

      if (signal.signalType === SignalType.offer) {
        // We received an offer — create answer
        let pc = peerConnectionsRef.current.get(peerId);
        if (!pc) {
          pc = createPeerConnection(peerId, username);
        }

        try {
          const offerDesc = JSON.parse(signal.payload) as RTCSessionDescriptionInit;
          await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));

          // Flush pending ICE candidates
          const pending = pendingCandidatesRef.current.get(peerId) || [];
          for (const candidate of pending) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* ignore */ }
          }
          pendingCandidatesRef.current.delete(peerId);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const fromPrincipal = signal.from;
          await currentActor.sendSignal(
            roomId,
            fromPrincipal,
            SignalType.answer,
            JSON.stringify(pc.localDescription)
          );
        } catch {
          // Ignore negotiation errors
        }
      } else if (signal.signalType === SignalType.answer) {
        const pc = peerConnectionsRef.current.get(peerId);
        if (!pc) continue;

        try {
          if (pc.signalingState === 'have-local-offer') {
            const answerDesc = JSON.parse(signal.payload) as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(new RTCSessionDescription(answerDesc));

            // Flush pending ICE candidates
            const pending = pendingCandidatesRef.current.get(peerId) || [];
            for (const candidate of pending) {
              try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* ignore */ }
            }
            pendingCandidatesRef.current.delete(peerId);
          }
        } catch {
          // Ignore
        }
      } else if (signal.signalType === SignalType.iceCandidate) {
        const pc = peerConnectionsRef.current.get(peerId);
        const candidateInit = JSON.parse(signal.payload) as RTCIceCandidateInit;

        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
          } catch {
            // Ignore
          }
        } else {
          // Queue candidate until remote description is set
          const existing = pendingCandidatesRef.current.get(peerId) || [];
          pendingCandidatesRef.current.set(peerId, [...existing, candidateInit]);
        }
      }
    }
  }, [roomId, participants, createPeerConnection]);

  // Start/stop polling for signals
  useEffect(() => {
    if (!actor || !roomId) return;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      processSignals();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [actor, roomId, processSignals]);

  // When camera is enabled, initiate connections to all current participants
  useEffect(() => {
    if (isEnabled && localStream && participants.length > 0) {
      initiateConnections();
    }
  }, [isEnabled, localStream, participants, initiateConnections]);

  // When new participants join, connect to them if camera is active
  useEffect(() => {
    if (!isEnabled || !localStream) return;

    for (const [principal, username] of participants) {
      const peerId = principal.toString();
      if (peerId === localPrincipal) continue;
      if (!offeredPeersRef.current.has(peerId)) {
        offeredPeersRef.current.add(peerId);
        const pc = createPeerConnection(peerId, username);
        (async () => {
          try {
            const offer = await pc.createOffer({ offerToReceiveVideo: true });
            await pc.setLocalDescription(offer);
            const currentActor = actorRef.current;
            if (currentActor) {
              await currentActor.sendSignal(
                roomId,
                principal,
                SignalType.offer,
                JSON.stringify(pc.localDescription)
              );
            }
          } catch {
            offeredPeersRef.current.delete(peerId);
            closePeerConnection(peerId);
          }
        })();
      }
    }
  }, [participants, isEnabled, localStream, localPrincipal, roomId, createPeerConnection, closePeerConnection]);

  // When camera is disabled, close all peer connections
  useEffect(() => {
    if (!isEnabled) {
      const peerIds = Array.from(peerConnectionsRef.current.keys());
      peerIds.forEach(closePeerConnection);
      offeredPeersRef.current.clear();
      setRemoteStreams([]);
    }
  }, [isEnabled, closePeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      peerConnectionsRef.current.forEach((pc) => {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onconnectionstatechange = null;
        pc.close();
      });
      peerConnectionsRef.current.clear();
      offeredPeersRef.current.clear();
      pendingCandidatesRef.current.clear();
    };
  }, []);

  return { remoteStreams };
}
