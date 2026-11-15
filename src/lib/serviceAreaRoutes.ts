const serviceAreaRoutes = {
  "/locations/kuala-lumpur/kitchen-renovation": "kitchen",
  "/locations/kuala-lumpur/office-renovation": "office-renovation",
  "/locations/kuala-lumpur/bathroom-renovation": "bathroom",
  "/locations/petaling-jaya/condo-renovation": "renovation",
  "/locations/selangor/landed-house-renovation": "renovation",
} as const;

type ServiceAreaPath = keyof typeof serviceAreaRoutes;

export function findServiceAreaRoute(area?: string, service?: string) {
  const path = `/locations/${area}/${service}`;
  if (!Object.prototype.hasOwnProperty.call(serviceAreaRoutes, path)) return null;

  return { path: path as ServiceAreaPath, parentService: serviceAreaRoutes[path as ServiceAreaPath] };
}
