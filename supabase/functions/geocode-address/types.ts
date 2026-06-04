export type AdminAccessResult = {
  ok: boolean;
  status: number;
  error: string | null;
};

export type GeocodeResult = {
  latitude: string | number;
  longitude: string | number;
  formattedAddress: string;
  provider: string;
};
