import { useEffect, useRef, useCallback, useState } from 'react';
import { useActor } from './useActor';
import { SignalType } from '../backend';
import type { Principal } from '@dfinity/principal';

interface RemoteStream {
  peerId: string;
  stream: MediaStream;
}

interface UseWebRTCOptions {
  roomId: string;
  localStream: MediaStream | null;
  enabled: boolean;
  currentUserPrincipal: string;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const POLL_INTERVAL_MS = 2000;

export function useWebRTC({ roomId, localStream, enabled, currentUserPrincipal }: UseWebRTCOptions) {
  const { actor } = useActor();
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCleaningUpRef = useRef(false);
  const processedSignalsRef = useRef<Set<string>>(new Set());

  const addOrUpdateRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    setRemoteStreams(prev => {
      // Deduplicate: if this peerId already exists, replace it
      const filtered = prev.filter(rs => rs.peerId !== peerId);
      return [...filtered, { peerId, stream }];
    });
  }, []);

  const removeRemoteStream = useCallback((peerId: string) => {
    setRemoteStreams(prev => prev.filter(rs => rs.peerId !== peerId));
  }, []);

  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    // If a connection already exists for this peer, close and remove it first
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing) {
      existing.close();
      peerConnectionsRef.current.delete(peerId);
      removeRemoteStream(peerId);
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks if available
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    const remoteStream = new MediaStream();
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });
      addOrUpdateRemoteStream(peerId, remoteStream);
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (!event.candidate || !actor || isCleaningUpRef.current) return;
      try {
        const recipientPrincipal = { toString: () => peerId } as Principal;
        await actor.sendSignal(
          roomId,
          recipientPrincipal,
          SignalType.iceCandidate,
          JSON.stringify(event.candidate.toJSON())
        );
      } catch (err) {
        // Ignore send errors during cleanup
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        removeRemoteStream(peerId);
        peerConnectionsRef.current.delete(peerId);
      }
    };

    peerConnectionsRef.current.set(peerId, pc);
    return pc;
  }, [actor, localStream, roomId, addOrUpdateRemoteStream, removeRemoteStream]);

  const processSignals = useCallback(async () => {
    if (!actor || !enabled || isCleaningUpRef.current) return;

    let signals;
    try {
      const response = await actor.receiveSignals(roomId);
      signals = response.data;
    } catch {
      return;
    }

    if (!signals || signals.length === 0) return;

    // Clear processed signals after receiving
    try {
      await actor.clearSignals(roomId);
    } catch {
      // Ignore
    }

    for (const signal of signals) {
      const fromId = signal.from.toString();

      // Skip signals from ourselves
      if (fromId === currentUserPrincipal) continue;

      // Create a unique key for deduplication
      const signalKey = `${fromId}-${signal.signalType}-${signal.payload.substring(0, 50)}`;
      if (processedSignalsRef.current.has(signalKey)) continue;
      processedSignalsRef.current.add(signalKey);

      // Limit the processed signals set size
      if (processedSignalsRef.current.size > 500) {
        const entries = Array.from(processedSignalsRef.current);
        processedSignalsRef.current = new Set(entries.slice(-250));
      }

      try {
        if (signal.signalType === SignalType.offer) {
          const pc = createPeerConnection(fromId);
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.payload)));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const recipientPrincipal = { toString: () => fromId } as Principal;
          await actor.sendSignal(
            roomId,
            recipientPrincipal,
            SignalType.answer,
            JSON.stringify(answer)
          );
        } else if (signal.signalType === SignalType.answer) {
          const pc = peerConnectionsRef.current.get(fromId);
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.payload)));
          }
        } else if (signal.signalType === SignalType.iceCandidate) {
          const pc = peerConnectionsRef.current.get(fromId);
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(signal.payload)));
          }
        }
      } catch (err) {
        // Ignore individual signal processing errors
      }
    }
  }, [actor, enabled, roomId, currentUserPrincipal, createPeerConnection]);

  const initiateCallToPeer = useCallback(async (peerId: string) => {
    if (!actor || isCleaningUpRef.current) return;

    // Don't call ourselves
    if (peerId === currentUserPrincipal) return;

    // Don't create duplicate connections
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing && (existing.signalingState !== 'closed')) return;

    const pc = createPeerConnection(peerId);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const recipientPrincipal = { toString: () => peerId } as Principal;
      await actor.sendSignal(
        roomId,
        recipientPrincipal,
        SignalType.offer,
        JSON.stringify(offer)
      );
    } catch (err) {
      // Ignore offer errors
    }
  }, [actor, currentUserPrincipal, createPeerConnection, roomId]);

  // Start/stop polling
  useEffect(() => {
    if (!enabled || !actor) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    isCleaningUpRef.current = false;
    pollingIntervalRef.current = setInterval(processSignals, POLL_INTERVAL_MS);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, actor, processSignals]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCleaningUpRef.current = true;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      setRemoteStreams([]);
    };
  }, []);

  return {
    remoteStreams,
    initiateCallToPeer,
  };
}
