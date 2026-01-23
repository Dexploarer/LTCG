"use client";

/**
 * SeasonForm Component
 *
 * Reusable form for creating and editing seasons.
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

// =============================================================================
// Types
// =============================================================================

interface SeasonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function CreateSeasonDialog({ open, onOpenChange, onSuccess }: SeasonFormProps) {
  const [seasonId, setSeasonId] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activateNow, setActivateNow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSeason = useMutation(api.admin.admin.createSeason);

  const resetForm = () => {
    setSeasonId("");
    setName("");
    setStartDate("");
    setEndDate("");
    setActivateNow(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!seasonId.trim()) {
      toast.error("Season ID is required");
      return;
    }
    if (!name.trim()) {
      toast.error("Season name is required");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Start and end dates are required");
      return;
    }

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (start >= end) {
      toast.error("End date must be after start date");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSeason({
        seasonId: seasonId.trim(),
        name: name.trim(),
        startDate: start,
        endDate: end,
        activateNow,
      });
      toast.success(`Season "${name}" created successfully`);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create season");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Season</DialogTitle>
            <DialogDescription>
              Create a new ranked season. If activated, the current season will end.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="seasonId">Season ID</Label>
              <Input
                id="seasonId"
                placeholder="e.g., S1, S2026-Q1"
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Unique identifier for this season</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Season Name</Label>
              <Input
                id="name"
                placeholder="e.g., Season 1, Spring Championship"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="activateNow">Activate Immediately</Label>
                <p className="text-xs text-muted-foreground">
                  End current season and activate this one
                </p>
              </div>
              <Switch id="activateNow" checked={activateNow} onCheckedChange={setActivateNow} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Season"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
