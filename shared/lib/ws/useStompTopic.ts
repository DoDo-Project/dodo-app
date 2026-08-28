import { Client, type IMessage } from '@stomp/stompjs';
import { useEffect, useState } from 'react';

import { env } from '@/shared/config';
import * as tokenStorage from '@/shared/lib/auth/tokenStorage';

// 공통 STOMP 구독 로직. destination이 null이면 연결하지 않고, 값이 바뀌면 기존 연결을 정리하고 새로 만든다.
// 서버 프레임은 전부 { type, payload } 모양을 공유한다는 전제(웹/백엔드 공통 계약).

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
    // TODO: 실시간 안 뜨는 문제 진단용 임시 로그 — 확인되면 제거
    console.log('[stomp] connecting…', destination);
    const client = new Client({
      brokerURL: env.WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log('[stomp:frame]', destination, str),
      beforeConnect: async () => {
        const accessToken = await tokenStorage.getAccessToken();
        client.connectHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      },
      onConnect: () => {
        console.log('[stomp] connected, subscribing', destination);
        if (cancelled) return;
        client.subscribe(destination, (message: IMessage) => {
          console.log('[stomp] message', destination, message.body);
          try {
            const parsed = JSON.parse(message.body) as Envelope<T>;
            if (!cancelled) setData(parsed.payload);
          } catch (err) {
            console.log('[stomp] parse error', destination, err);
          }
        });
      },
      onStompError: (frame) => console.log('[stomp] STOMP error', destination, frame.headers, frame.body),
      onWebSocketError: (event) => console.log('[stomp] WS error', destination, event),
      onWebSocketClose: (event) => console.log('[stomp] WS closed', destination, event?.code, event?.reason),
    });

    client.activate();

    return () => {
      cancelled = true;
      setData(null);
      client.deactivate();
    };
  }, [destination]);

  return data;
}
