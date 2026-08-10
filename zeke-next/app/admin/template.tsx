import { DashboardPageTransition } from "@/components/layout/DashboardPageTransition";

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <DashboardPageTransition>{children}</DashboardPageTransition>;
}
