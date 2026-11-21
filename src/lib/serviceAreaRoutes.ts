const serviceAreaRoutes = {
  "/locations/kuala-lumpur/kitchen-renovation": "kitchen",
  "/locations/kuala-lumpur/office-renovation": "office-renovation",
  "/locations/kuala-lumpur/bathroom-renovation": "bathroom",
  "/locations/petaling-jaya/condo-renovation": "renovation",
  "/locations/selangor/landed-house-renovation": "renovation",
  "/locations/kuala-lumpur/condo-renovation": "renovation",
  "/locations/petaling-jaya/kitchen-renovation": "kitchen",
  "/locations/cheras/condo-renovation": "renovation",
  "/locations/subang-jaya/landed-house-renovation": "renovation",
  "/locations/kuala-lumpur/digital-lock": "digital-lock",
  "/locations/petaling-jaya/digital-lock": "digital-lock",
  "/locations/cheras/digital-lock": "digital-lock",
  "/locations/subang-jaya/digital-lock": "digital-lock",
  "/locations/mont-kiara/digital-lock": "digital-lock",
  "/locations/bangsar/digital-lock": "digital-lock",
  "/locations/puchong/digital-lock": "digital-lock",
  "/locations/selangor/digital-lock": "digital-lock",
  "/locations/shah-alam/digital-lock": "digital-lock",
  "/locations/kajang/digital-lock": "digital-lock",
  "/locations/selangor/office-renovation": "office-renovation",
  "/locations/petaling-jaya/landed-house-renovation": "renovation",
} as const;

type ServiceAreaPath = keyof typeof serviceAreaRoutes;

export function findServiceAreaRoute(area?: string, service?: string) {
  const path = `/locations/${area}/${service}`;
  if (!Object.prototype.hasOwnProperty.call(serviceAreaRoutes, path)) return null;

  return { path: path as ServiceAreaPath, parentService: serviceAreaRoutes[path as ServiceAreaPath] };
}
