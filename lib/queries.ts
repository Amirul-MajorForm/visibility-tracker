export function generateQueries(brand: string, category: string): string[] {
  return [
    `best ${category} brands`,
    `${brand} review`,
    `top ${category} options`,
    `${brand} vs alternatives`,
    `${category} recommendation`,
    `is ${brand} worth buying`,
    `${category} for everyday use`,
    `${brand} quality`,
    `affordable ${category}`,
    `${category} market leaders`,
  ]
}
