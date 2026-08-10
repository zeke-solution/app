export function roleHome(role: string) {
  if (role === "admin") return "/admin";
  if (role === "brand") return "/brand";
  if (role === "influencer") return "/creator";
  return "/onboarding";
}
