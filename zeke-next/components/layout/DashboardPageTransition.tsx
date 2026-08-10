import { ViewTransition } from "react";

export function DashboardPageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{
        "dashboard-forward": "dashboard-forward",
        "dashboard-back": "dashboard-back",
        default: "dashboard-fade",
      }}
      exit={{
        "dashboard-forward": "dashboard-forward",
        "dashboard-back": "dashboard-back",
        default: "dashboard-fade",
      }}
      default="dashboard-fade"
    >
      <div className="dashboard-page-frame">{children}</div>
    </ViewTransition>
  );
}
