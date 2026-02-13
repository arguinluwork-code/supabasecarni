import type { ProductFull } from '../../types/database';

export interface MarginBucket {
  range: string;
  count: number;
  percentage: number;
}

export function buildMarginDistribution(products: ProductFull[]): MarginBucket[] {
  const total = products.length;
  if (total === 0) return [];

  const buckets = [
    { range: '< 0%', min: Number.NEGATIVE_INFINITY, max: 0 },
    { range: '0-10%', min: 0, max: 10 },
    { range: '10-20%', min: 10, max: 20 },
    { range: '20-30%', min: 20, max: 30 },
    { range: '30-40%', min: 30, max: 40 },
    { range: '40-50%', min: 40, max: 50 },
    { range: '> 50%', min: 50, max: Number.POSITIVE_INFINITY }
  ];

  return buckets.map((bucket) => {
    const count = products.filter(
      (product) => product.margin_percent >= bucket.min && product.margin_percent < bucket.max
    ).length;

    return {
      range: bucket.range,
      count,
      percentage: (count / total) * 100
    };
  });
}

export function getTopProductsByMargin(products: ProductFull[], limit = 10): ProductFull[] {
  return [...products]
    .filter((product) => product.margin_percent > 0)
    .sort((a, b) => b.margin_percent - a.margin_percent)
    .slice(0, limit);
}

export function getNegativeMarginProducts(products: ProductFull[], limit = 10): ProductFull[] {
  return [...products]
    .filter((product) => product.margin_percent < 0)
    .sort((a, b) => a.margin_percent - b.margin_percent)
    .slice(0, limit);
}
