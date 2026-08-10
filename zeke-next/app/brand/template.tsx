import { DashboardPageTransition } from "@/components/layout/DashboardPageTransition";

export default function BrandTemplate({ children }: { children: React.ReactNode }) {
  return <DashboardPageTransition>{children}</DashboardPageTransition>;
}
