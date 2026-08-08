export interface ShieldMembership {
  shield_active?: boolean | null;
  shield_expires?: string | null;
}

export function isShieldMembershipActive(
  membership: ShieldMembership | null | undefined,
  today = new Date().toISOString().slice(0, 10)
): boolean {
  return !!membership?.shield_active &&
    (!membership.shield_expires || membership.shield_expires >= today);
}
