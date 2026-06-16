"use client";

import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Resolves the founder's venture. Single-venture UX for now: we take the
 * first venture on the account (the seeded one in dev).
 */
export function useVenture() {
  return useQuery({
    queryKey: ["ventures"],
    queryFn: api.ventures.list,
    select: (ventures) => ventures[0] ?? null,
  });
}

export function useUnlocks(ventureId: string | undefined) {
  return useQuery({
    queryKey: ["unlocks", ventureId],
    queryFn: () => api.ventures.unlocks(ventureId!),
    enabled: !!ventureId,
  });
}

export function useToday(ventureId: string | undefined) {
  return useQuery({
    queryKey: ["today", ventureId],
    queryFn: () => api.ventures.today(ventureId!),
    enabled: !!ventureId,
  });
}

/** Completes a task, then refreshes everything derived from the roadmap. */
export function useCompleteTask(ventureId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.roadmap.completeTask(ventureId!, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today", ventureId] });
      queryClient.invalidateQueries({ queryKey: ["roadmap", ventureId] });
    },
  });
}
