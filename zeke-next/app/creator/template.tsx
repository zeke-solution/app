import { DashboardPageTransition } from "@/components/layout/DashboardPageTransition";

export default function CreatorTemplate({ children }: { children: React.ReactNode }) {
  return <DashboardPageTransition>{children}</DashboardPageTransition>;
}
