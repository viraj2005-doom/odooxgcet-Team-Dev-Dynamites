import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useAttendance(filters?: { date?: string; userId?: string; month?: string }) {
  // Construct query string for filters
  const queryParams = new URLSearchParams();
  if (filters?.date) queryParams.append("date", filters.date);
  if (filters?.userId) queryParams.append("userId", filters.userId);
  if (filters?.month) queryParams.append("month", filters.month);

  const url = `${api.attendance.list.path}?${queryParams.toString()}`;

  return useQuery({
    queryKey: [api.attendance.list.path, filters],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return await res.json();
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.attendance.checkIn.path, {
        method: api.attendance.checkIn.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to check in");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attendance.list.path] });
      toast({ title: "Checked In", description: "Have a great day at work!" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Check-in failed", description: error.message });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.attendance.checkOut.path, {
        method: api.attendance.checkOut.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to check out");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attendance.list.path] });
      toast({ title: "Checked Out", description: "See you tomorrow!" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Check-out failed", description: error.message });
    },
  });
}
