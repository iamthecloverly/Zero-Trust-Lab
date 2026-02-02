import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

const TOUR_STORAGE_KEY = "zerotrustlab-tour-completed";

export function ProductTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
      setRun(false);
    }
  };

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Welcome to ZeroTrustLab!</h3>
          <p className="text-sm">
            This interactive simulator helps you understand <strong>Zero Trust Security</strong> - 
            a security model where no user or device is automatically trusted.
          </p>
          <p className="text-sm mt-2">
            Let's take a quick tour to learn how it works!
          </p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-testid="button-run-simulation"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Run Access Simulations</h3>
          <p className="text-sm">
            Click this button to simulate a user attempting to access a device. 
            You'll select a user, device, and action to test.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: ".network-graph-container",
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Network Visualization</h3>
          <p className="text-sm">
            This interactive graph shows your network topology. 
            <strong> Circles</strong> represent users, <strong>squares</strong> represent devices.
          </p>
          <p className="text-sm mt-2">
            Connections appear as colored lines based on the security verdict:
          </p>
          <ul className="text-sm mt-1 space-y-1">
            <li><strong>Green (ALLOW)</strong> - High trust, access granted</li>
            <li><strong>Orange (CHALLENGE_MFA)</strong> - Medium trust, requires MFA</li>
            <li><strong>Red (DENY)</strong> - Low trust, access denied</li>
          </ul>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[data-testid="text-trust-score"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Trust Score System</h3>
          <p className="text-sm">
            Every connection attempt gets a <strong>Trust Score</strong> from 0-100 points.
          </p>
          <p className="text-sm mt-2">
            The score starts at 100 and points are deducted based on:
          </p>
          <ul className="text-sm mt-1 space-y-1">
            <li>❌ No MFA enabled (-30 points)</li>
            <li>❌ Unverified device (-40 points)</li>
            <li>❌ Restricted location (-20 points)</li>
            <li>❌ Insufficient role (-10 points)</li>
          </ul>
        </div>
      ),
      placement: "left",
    },
    {
      target: '[data-testid^="switch-policy-"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Policy Controls</h3>
          <p className="text-sm">
            Toggle security policies on/off to see how they affect trust scores.
          </p>
          <p className="text-sm mt-2">
            Try disabling policies and running simulations to observe different outcomes!
          </p>
        </div>
      ),
      placement: "left",
    },
    {
      target: '[data-testid="text-network-status"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Quick Stats</h3>
          <p className="text-sm">
            Monitor your network status, active policies, and connection count at a glance.
          </p>
        </div>
      ),
      placement: "right",
    },
    {
      target: ".connection-history-container",
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Connection History</h3>
          <p className="text-sm">
            View a complete log of all connection attempts with timestamps, verdicts, and trust scores.
          </p>
          <p className="text-sm mt-2">
            This helps you track security decisions over time.
          </p>
        </div>
      ),
      placement: "left",
    },
    {
      target: '[data-testid="button-reset-network"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Reset Network</h3>
          <p className="text-sm">
            Clear all connection history to start fresh. Users, devices, and policies are preserved.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "body",
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Ready to Explore!</h3>
          <p className="text-sm">
            You're all set! Try running a simulation to see Zero Trust security in action.
          </p>
          <p className="text-sm mt-2">
            <strong>Pro tip:</strong> Start with different user-device combinations to see how 
            MFA status, device verification, and location affect access decisions.
          </p>
        </div>
      ),
      placement: "center",
    },
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#10b981",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
        },
        buttonNext: {
          backgroundColor: "#10b981",
          borderRadius: 6,
        },
        buttonBack: {
          color: "#6b7280",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}
