export const isServiceConceptImage = (imageAlt: string): boolean =>
  /\bconcept\b|概念|效果图|示意/i.test(imageAlt);
