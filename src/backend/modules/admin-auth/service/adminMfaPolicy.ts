export type AdminMfaPolicyInput = {
  hasSession: boolean;
  isAdminIdentity: boolean;
  currentLevel: string | null;
  verifiedTotpFactorId: string | null;
};

export type AdminMfaPolicyDecision = "signed-out" | "denied" | "complete" | "challenge" | "enroll";

export const decideAdminMfaStep = ({
  hasSession,
  isAdminIdentity,
  currentLevel,
  verifiedTotpFactorId,
}: AdminMfaPolicyInput): AdminMfaPolicyDecision => {
  if (!hasSession) return "signed-out";
  if (!isAdminIdentity) return "denied";
  if (currentLevel === "aal2") return "complete";
  if (verifiedTotpFactorId) return "challenge";
  return "enroll";
};
