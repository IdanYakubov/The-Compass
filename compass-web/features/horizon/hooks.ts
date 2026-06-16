"use client";

import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useRoadmap(ventureId: string | undefined) {
  return useQuery({
    queryKey: ["roadmap", ventureId],
    queryFn: () => api.roadmap.get(ventureId!),
    enabled: !!ventureId,
  });
}

/**
 * Completes a milestone and surfaces the stage-gate result
 * (what just unlocked) back to the caller for celebration UI.
 */
export function useCompleteMilestone(ventureId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      api.roadmap.completeMilestone(ventureId!, milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap", ventureId] });
      queryClient.invalidateQueries({ queryKey: ["today", ventureId] });
      queryClient.invalidateQueries({ queryKey: ["ventures"] });
    },
  });
}
