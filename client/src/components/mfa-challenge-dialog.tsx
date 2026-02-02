import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MFAChallengeDialogProps {
  open: boolean;
  onVerify: (code: string) => Promise<any>;
  onCancel: () => void;
  isPending?: boolean;
}

export function MFAChallengeDialog({
  open,
  onVerify,
  onCancel,
  isPending = false,
}: MFAChallengeDialogProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (code.length !== 6) {
      setError("Please enter a 6-digit verification code");
      setIsSubmitting(false);
      return;
    }

    try {
      await onVerify(code);
      setCode("");
    } catch (err: any) {
      setError(err.message || "Invalid verification code. Please try again.");
      setCode("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCode("");
    setError("");
    onCancel();
  };

  return (
    <Dialog open={open} modal>
      <DialogContent 
        className="sm:max-w-md" 
        data-testid="dialog-mfa-challenge"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle>MFA Challenge Required</DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Additional verification needed for this connection
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mfa-code">Verification Code</Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit code"
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
                disabled={isSubmitting}
                data-testid="input-mfa-code"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit verification code from your authenticator app.
              </p>
              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                <p className="text-muted-foreground">
                  💡 <strong>Demo Mode:</strong> Use code <code className="px-1 py-0.5 bg-background rounded">123456</code> or <code className="px-1 py-0.5 bg-background rounded">000000</code>
                </p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" data-testid="alert-mfa-error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              data-testid="button-mfa-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              data-testid="button-mfa-verify"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
