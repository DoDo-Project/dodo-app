import { Client, type IMessage } from '@stomp/stompjs';
import { useEffect, useState } from 'react';

import { env } from '@/shared/config';
import * as tokenStorage from '@/shared/lib/auth/tokenStorage';

interface Envelope<T> {
  type: string;
  payload: T;
}

export function useStompTopic<T>(destination: string | null): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!destination) {
      setData(null);
      return;
    }

    let cancelled = false;

    console.log('[stomp] connecting…', destination);

    const client = new Client({
      brokerURL: env.WS_URL,

      // Android React Native의 STOMP 프레임 처리 문제 우회
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,

      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      debug: (str) => {
        const masked = str.replace(/Authorization:[^\r\n]*/gi, 'Authorization:[REDACTED]');
        console.log('[stomp:frame]', destination, masked);
      },

      beforeConnect: async () => {
        const accessToken = await tokenStorage.getAccessToken();
        client.connectHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      },

      onConnect: () => {
        if (cancelled) return;

        console.log('[stomp] connected, subscribing', destination);

        client.subscribe(destination, (message: IMessage) => {
          console.log('[stomp] message', destination, message.body);

          try {
            const parsed = JSON.parse(message.body) as Envelope<T>;
            if (!cancelled) setData(parsed.payload);
          } catch (err) {
            console.log('[stomp] parse error', destination, err);
          }
        });

        client.subscribe('/user/queue/reply', (message: IMessage) => {
          console.log('[stomp] /user/queue/reply message', message.body);
        });
      },

      onStompError: (frame) => {
        console.log('[stomp] STOMP error', destination, frame.headers, frame.body);
      },

      onWebSocketError: (event) => {
        console.log('[stomp] WS error', destination, event);
      },

      onWebSocketClose: (event) => {
        console.log('[stomp] WS closed', destination, event.code, event.reason);
      },
    });

    client.activate();

    return () => {
      cancelled = true;
      setData(null);
      void client.deactivate();
    };
  }, [destination]);

  return data;
}
