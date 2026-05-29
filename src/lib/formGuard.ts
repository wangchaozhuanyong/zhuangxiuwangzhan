/** Client-side anti-spam fields passed to submit-lead Edge Function. */
export type FormGuardFields = {
  website: string;
  startedAt: number;
};

export const emptyFormGuard = (): FormGuardFields => ({
  website: "",
  startedAt: Date.now(),
});
