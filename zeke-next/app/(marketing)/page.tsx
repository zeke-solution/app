import { Hero } from "@/components/marketing/Hero";
import { LandingSections } from "@/components/marketing/LandingSections";
import { CtaBanner } from "@/components/marketing/CtaBanner";

export default function LandingPage() {
  return (
    <div>
      <Hero />
      <LandingSections />
      <CtaBanner />
    </div>
  );
}
