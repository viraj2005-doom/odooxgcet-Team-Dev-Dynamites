import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useLeaves() {
  return useQuery({
    queryKey: [api.leaves.list.path],
    queryFn: async () => {
      const res = await fetch(api.leaves.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaves");
      return await res.json();
    },
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.leaves.create.input>) => {
      const res = await fetch(api.leaves.create.path, {
        method: api.leaves.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to request leave");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leaves.list.path] });
      toast({ title: "Leave Requested", description: "Your request has been sent for approval." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Request failed", description: error.message });
    },
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'approved' | 'rejected' }) => {
      const url = buildUrl(api.leaves.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.leaves.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leaves.list.path] });
      toast({ title: "Status Updated", description: "Leave request has been updated." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
    },
  });
}
