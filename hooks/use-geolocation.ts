"use client";

import { useCallback, useEffect, useState } from "react";

export type GeoStatus =
  | "idle"
  | "loading"
  | "success"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unsupported";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeolocationState {
  status: GeoStatus;
  position: GeoPosition | null;
  /** Mensagem pronta para exibir ao usuário. */
  message: string | null;
}

const MESSAGES: Record<Exclude<GeoStatus, "idle" | "loading" | "success">, string> =
  {
    denied:
      "É necessário permitir o acesso à localização para registrar seu ponto.",
    unavailable:
      "Não foi possível obter sua localização. Verifique se o GPS está ativado.",
    timeout:
      "A busca pela sua localização demorou demais. Tente novamente.",
    unsupported:
      "Seu navegador não oferece acesso à localização.",
  };

/**
 * Localização atual do usuário.
 *
 * Usa `watchPosition` em vez de `getCurrentPosition`: o GPS refina a
 * precisão com o tempo, e acompanhar as atualizações mantém a distância
 * exibida (e o botão de ponto) sempre coerentes com a posição real.
 */
export function useGeolocation(enabled = true): GeolocationState & {
  retry: () => void;
} {
  const [state, setState] = useState<GeolocationState>({
    status: "idle",
    position: null,
    message: null,
  });
  const [tentativa, setTentativa] = useState(0);

  const retry = useCallback(() => setTentativa((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({
        status: "unsupported",
        position: null,
        message: MESSAGES.unsupported,
      });
      return;
    }

    setState({ status: "loading", position: null, message: null });

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setState({
          status: "success",
          position: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
          },
          message: null,
        });
      },
      (error) => {
        const status: GeoStatus =
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.TIMEOUT
              ? "timeout"
              : "unavailable";
        setState({
          status,
          position: null,
          message: MESSAGES[status as keyof typeof MESSAGES],
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 20_000,
        // Aceita uma leitura de até 30s para responder rápido na abertura.
        maximumAge: 30_000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, tentativa]);

  return { ...state, retry };
}
