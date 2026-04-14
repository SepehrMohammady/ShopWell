/**
 * Price comparison helper utilities
 * Works with brand-based pricing model with unit price support
 */

import {PriceComparison, ShopProductBrand, Shop, Product, UnitLabels, UnitType} from '../types';

/**
 * Normalize quantity to a base unit (g for weight, ml for volume)
 * Returns null if unit is not a weight/volume type
 */
const normalizeToBaseUnit = (quantity: number, unit: UnitType): {quantity: number; baseUnit: 'g' | 'ml' | 'cm'} | null => {
  switch (unit) {
    case 'g': return {quantity, baseUnit: 'g'};
    case 'kg': return {quantity: quantity * 1000, baseUnit: 'g'};
    case 'ml': return {quantity, baseUnit: 'ml'};
    case 'L': return {quantity: quantity * 1000, baseUnit: 'ml'};
    case 'cm': return {quantity, baseUnit: 'cm'};
    case 'm': return {quantity: quantity * 100, baseUnit: 'cm'};
    default: return null;
  }
};

/**
 * Format a price with currency symbol
 */
export const formatPrice = (amount: number, currency: string = '€'): string => {
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * Get unit price for a ShopProductBrand entry
 * Returns price per unit if quantity is set, otherwise just the price
 */
export const getUnitPrice = (spb: ShopProductBrand): number => {
  if (spb.quantity && spb.quantity > 0) {
    return spb.price / spb.quantity;
  }
  return spb.price;
};

/**
 * Format unit price string (e.g. "€8.54/kg", "€0.015/ml")
 * Shows per-kg for weight and per-L for volume for readability
 */
export const formatUnitPrice = (spb: ShopProductBrand, currency: string = '€'): string | null => {
  if (!spb.quantity || spb.quantity <= 0 || !spb.unit) {
    return null;
  }
  const norm = normalizeToBaseUnit(spb.quantity, spb.unit);
  if (norm) {
    // Calculate price per base unit, then convert to display unit
    const pricePerBase = spb.price / norm.quantity;
    if (norm.baseUnit === 'cm') {
      const pricePerDisplay = pricePerBase * 100; // per m
      return `${currency}${pricePerDisplay.toFixed(2)}/m`;
    }
    const pricePerDisplay = pricePerBase * 1000; // per kg or per L
    const displayUnit = norm.baseUnit === 'g' ? 'kg' : 'L';
    return `${currency}${pricePerDisplay.toFixed(2)}/${displayUnit}`;
  }
  // For 'pcs' or unknown units, use raw unit
  const unitPrice = spb.price / spb.quantity;
  return `${currency}${unitPrice.toFixed(3)}/${spb.unit}`;
};

/**
 * Check if two SPBs can be compared by unit price (same or convertible unit type)
 */
const canCompareByUnit = (a: ShopProductBrand, b: ShopProductBrand): boolean => {
  if (!(a.quantity && a.quantity > 0 && a.unit && b.quantity && b.quantity > 0 && b.unit)) {
    return false;
  }
  if (a.unit === b.unit) return true;
  // Check if units are convertible (kg/g or L/ml)
  const normA = normalizeToBaseUnit(a.quantity, a.unit);
  const normB = normalizeToBaseUnit(b.quantity, b.unit);
  return !!(normA && normB && normA.baseUnit === normB.baseUnit);
};

/**
 * Get normalized unit price (price per base unit: g, ml, or pcs)
 */
const getNormalizedUnitPrice = (spb: ShopProductBrand): number | null => {
  if (!spb.quantity || spb.quantity <= 0 || !spb.unit) return null;
  const norm = normalizeToBaseUnit(spb.quantity, spb.unit);
  if (norm) return spb.price / norm.quantity;
  // For pcs, return price per piece
  if (spb.unit === 'pcs') return spb.price / spb.quantity;
  return null;
};

/**
 * Compare two SPBs - use unit price if both have same/convertible units, otherwise absolute price
 */
const comparePrice = (a: ShopProductBrand, b: ShopProductBrand): number => {
  if (canCompareByUnit(a, b)) {
    const normA = getNormalizedUnitPrice(a);
    const normB = getNormalizedUnitPrice(b);
    if (normA !== null && normB !== null) {
      return normA - normB;
    }
  }
  return a.price - b.price;
};

/**
 * Get the effective comparison price for an SPB within a group of same-product brands
 * If brands in the group share convertible units, use normalized unit price; otherwise use absolute price
 */
export const getEffectivePrice = (spb: ShopProductBrand, allBrands: ShopProductBrand[]): number => {
  // Check if all brands with quantity info share convertible units
  const brandsWithUnit = allBrands.filter(b => b.quantity && b.quantity > 0 && b.unit);
  if (brandsWithUnit.length > 1) {
    const firstUnit = brandsWithUnit[0].unit;
    // Check if all share same unit (including pcs)
    const allSameUnit = brandsWithUnit.every(b => b.unit === firstUnit);
    if (allSameUnit && spb.quantity && spb.quantity > 0 && spb.unit) {
      const normPrice = getNormalizedUnitPrice(spb);
      if (normPrice !== null) return normPrice;
    }
    // Check if all are convertible weight/volume units
    const firstNorm = normalizeToBaseUnit(brandsWithUnit[0].quantity!, brandsWithUnit[0].unit!);
    const allConvertible = firstNorm && brandsWithUnit.every(b => {
      const norm = normalizeToBaseUnit(b.quantity!, b.unit!);
      return norm && norm.baseUnit === firstNorm.baseUnit;
    });
    if (allConvertible && spb.quantity && spb.quantity > 0 && spb.unit) {
      const normPrice = getNormalizedUnitPrice(spb);
      if (normPrice !== null) return normPrice;
    }
  }
  return spb.price;
};

/**
 * Get the cheapest brand option for a product at a specific shop
 * Uses unit price comparison when brands share the same unit
 */
export const getCheapestBrandAtShop = (
  productId: string,
  shopId: string,
  shopProductBrands: ShopProductBrand[],
): ShopProductBrand | null => {
  const brandsAtShop = shopProductBrands.filter(
    spb => spb.productId === productId && spb.shopId === shopId,
  );

  if (brandsAtShop.length === 0) {
    return null;
  }

  return brandsAtShop.reduce((min, spb) =>
    comparePrice(spb, min) < 0 ? spb : min,
  );
};

/**
 * Get price comparison for a product at a specific shop
 * Compares the cheapest brand at this shop vs cheapest brand anywhere
 * Uses unit price when brands share the same unit
 */
export const getPriceComparison = (
  productId: string,
  shopId: string,
  shopProductBrands: ShopProductBrand[],
  shops: Shop[],
): PriceComparison | null => {
  // Find the cheapest brand at this shop
  const cheapestAtThisShop = getCheapestBrandAtShop(productId, shopId, shopProductBrands);

  if (!cheapestAtThisShop) {
    return null;
  }

  // Find all brand options for this product across all shops
  const allBrandOptions = shopProductBrands.filter(spb => spb.productId === productId);

  if (allBrandOptions.length === 0) {
    return null;
  }

  // Find the cheapest option anywhere using unit-aware comparison
  const cheapestAnywhere = allBrandOptions.reduce((min, spb) =>
    comparePrice(spb, min) < 0 ? spb : min,
  );

  const cheapestShop = shops.find(s => s.id === cheapestAnywhere.shopId);
  
  // Use effective prices for savings calculation
  const currentEffective = getEffectivePrice(cheapestAtThisShop, allBrandOptions);
  const cheapestEffective = getEffectivePrice(cheapestAnywhere, allBrandOptions);
  const savings = currentEffective - cheapestEffective;
  const savingsPercent = currentEffective > 0 ? (savings / currentEffective) * 100 : 0;

  return {
    currentPrice: cheapestAtThisShop.price,
    cheapestPrice: cheapestAnywhere.price,
    cheapestShopId: cheapestAnywhere.shopId,
    cheapestShopName: cheapestShop?.name || 'Unknown',
    savings: cheapestAtThisShop.price - cheapestAnywhere.price,
    savingsPercent,
    isCheapest: cheapestAtThisShop.id === cheapestAnywhere.id,
  };
};

/**
 * Get the cheapest option for a product across all shops
 * Uses unit price comparison when brands share the same unit
 */
export const getCheapestOption = (
  productId: string,
  shopProductBrands: ShopProductBrand[],
  shops: Shop[],
): {shop: Shop; brand: ShopProductBrand; price: number} | null => {
  const allOptions = shopProductBrands.filter(spb => spb.productId === productId);

  if (allOptions.length === 0) {
    return null;
  }

  const cheapest = allOptions.reduce((min, spb) =>
    comparePrice(spb, min) < 0 ? spb : min,
  );

  const shop = shops.find(s => s.id === cheapest.shopId);

  if (!shop) {
    return null;
  }

  return {shop, brand: cheapest, price: cheapest.price};
};

/**
 * Get all prices for a product grouped by shop, sorted by cheapest option at each shop
 * Uses unit price comparison when brands share the same unit
 */
export const getAllPricesForProduct = (
  productId: string,
  shopProductBrands: ShopProductBrand[],
  shops: Shop[],
): Array<{shop: Shop; brands: ShopProductBrand[]; cheapestPrice: number; effectivePrice: number}> => {
  const allBrands = shopProductBrands.filter(spb => spb.productId === productId);
  
  // Group by shop
  const shopIds = [...new Set(
    allBrands.map(spb => spb.shopId)
  )];

  return shopIds
    .map(shopId => {
      const shop = shops.find(s => s.id === shopId);
      const brands = allBrands
        .filter(spb => spb.shopId === shopId)
        .sort((a, b) => comparePrice(a, b));
      const cheapestPrice = brands.length > 0 ? brands[0].price : Infinity;
      const effectivePrice = brands.length > 0 ? getEffectivePrice(brands[0], allBrands) : Infinity;
      return shop ? {shop, brands, cheapestPrice, effectivePrice} : null;
    })
    .filter((item): item is {shop: Shop; brands: ShopProductBrand[]; cheapestPrice: number; effectivePrice: number} => item !== null)
    .sort((a, b) => {
      // Sort shops by their cheapest brand using unit-aware comparison
      if (a.brands.length > 0 && b.brands.length > 0) {
        return comparePrice(a.brands[0], b.brands[0]);
      }
      return a.cheapestPrice - b.cheapestPrice;
    });
};

/**
 * Get products that are cheaper elsewhere (comparing cheapest options)
 * Uses unit price comparison when brands share the same unit
 */
export const getCheaperAlternatives = (
  shopId: string,
  shopProductBrands: ShopProductBrand[],
  shops: Shop[],
  products: Product[],
): Array<{
  product: Product;
  currentBrand: ShopProductBrand;
  currentPrice: number;
  cheapestPrice: number;
  cheapestShop: Shop;
  cheapestBrand: ShopProductBrand;
  savings: number;
}> => {
  const alternatives: Array<{
    product: Product;
    currentBrand: ShopProductBrand;
    currentPrice: number;
    cheapestPrice: number;
    cheapestShop: Shop;
    cheapestBrand: ShopProductBrand;
    savings: number;
  }> = [];

  // Get all unique products at this shop
  const productIds = [...new Set(
    shopProductBrands
      .filter(spb => spb.shopId === shopId)
      .map(spb => spb.productId)
  )];

  productIds.forEach(productId => {
    const cheapestAtThisShop = getCheapestBrandAtShop(productId, shopId, shopProductBrands);
    const cheapestAnywhere = getCheapestOption(productId, shopProductBrands, shops);
    
    if (cheapestAtThisShop && cheapestAnywhere && cheapestAnywhere.shop.id !== shopId) {
      // Use unit-aware comparison
      if (comparePrice(cheapestAtThisShop, cheapestAnywhere.brand) > 0) {
        const savings = cheapestAtThisShop.price - cheapestAnywhere.price;
        const product = products.find(p => p.id === productId);
        if (product) {
          alternatives.push({
            product,
            currentBrand: cheapestAtThisShop,
            currentPrice: cheapestAtThisShop.price,
            cheapestPrice: cheapestAnywhere.price,
            cheapestShop: cheapestAnywhere.shop,
            cheapestBrand: cheapestAnywhere.brand,
            savings,
          });
        }
      }
    }
  });

  // Sort by savings (highest first)
  return alternatives.sort((a, b) => b.savings - a.savings);
};

/**
 * Get price range for a product (cheapest and most expensive across all shops/brands)
 */
export const getPriceRange = (
  productId: string,
  shopProductBrands: ShopProductBrand[],
): {min: number; max: number} | null => {
  const allOptions = shopProductBrands.filter(spb => spb.productId === productId);

  if (allOptions.length === 0) {
    return null;
  }

  const prices = allOptions.map(spb => spb.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

/**
 * Get the best shop to buy needed products
 * Returns shops ranked by how many needed products they have at the best prices
 */
export const getBestShopsForShoppingList = (
  neededProducts: Product[],
  shopProductBrands: ShopProductBrand[],
  shops: Shop[],
): Array<{
  shop: Shop;
  productsAvailable: number;
  cheapestProducts: number;
  estimatedTotal: number;
}> => {
  return shops
    .map(shop => {
      let productsAvailable = 0;
      let cheapestProducts = 0;
      let estimatedTotal = 0;

      neededProducts.forEach(product => {
        const cheapestAtShop = getCheapestBrandAtShop(product.id, shop.id, shopProductBrands);
        if (cheapestAtShop) {
          productsAvailable++;
          estimatedTotal += cheapestAtShop.price;
          
          const cheapestAnywhere = getCheapestOption(product.id, shopProductBrands, shops);
          if (cheapestAnywhere && cheapestAnywhere.shop.id === shop.id) {
            cheapestProducts++;
          }
        }
      });

      return {
        shop,
        productsAvailable,
        cheapestProducts,
        estimatedTotal,
      };
    })
    .filter(item => item.productsAvailable > 0)
    .sort((a, b) => {
      // Sort by products available first, then by cheapest products
      if (b.productsAvailable !== a.productsAvailable) {
        return b.productsAvailable - a.productsAvailable;
      }
      return b.cheapestProducts - a.cheapestProducts;
    });
};
