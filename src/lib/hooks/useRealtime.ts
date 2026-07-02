"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type OnChangeCallback = (
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>
) => void;

export function useRealtimeSubscription(
  table: string,
  filter?: string,
  onChange?: OnChangeCallback
) {
  const supabase = createClient();

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      onChange?.(payload);
    },
    [onChange]
  );

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        handleChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, supabase, handleChange]);
}
