import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { User, Device } from "@shared/schema";

const simulationFormSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  deviceId: z.string().min(1, "Please select a device"),
  action: z.string().min(1, "Please select an action"),
});

type SimulationFormValues = z.infer<typeof simulationFormSchema>;

interface SimulationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  devices: Device[];
  onSubmit: (data: SimulationFormValues) => void;
  isPending: boolean;
  defaultValues?: { userId: string; deviceId: string; action: string };
}

export function SimulationForm({
  open,
  onOpenChange,
  users,
  devices,
  onSubmit,
  isPending,
  defaultValues,
}: SimulationFormProps) {
  const form = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationFormSchema),
    defaultValues: {
      userId: "",
      deviceId: "",
      action: "",
    },
  });

  // Populate form when a scenario pre-fills default values
  useEffect(() => {
    if (open && defaultValues) {
      form.reset(defaultValues);
    } else if (!open) {
      form.reset({ userId: "", deviceId: "", action: "" });
    }
  }, [open, defaultValues, form]);

  const handleSubmit = (data: SimulationFormValues) => {
    onSubmit(data);
    form.reset({ userId: "", deviceId: "", action: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run Access Simulation</DialogTitle>
          <DialogDescription>
            Select a user, device, and action to simulate a connection attempt
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-user">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.id} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-device">
                        <SelectValue placeholder="Select a device" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.id} ({device.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-action">
                        <SelectValue placeholder="Select an action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="write">Write</SelectItem>
                      <SelectItem value="access">Access</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel-simulation"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit-simulation"
              >
                {isPending ? "Simulating..." : "Run Simulation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
