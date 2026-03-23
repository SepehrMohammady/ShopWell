/**
 * Price comparison helper utilities
 * Works with brand-based pricing model with unit price support
 */

import {PriceComparison, ShopProductBrand, Shop, Product, UnitLabels, UnitType} from '../types';

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
 * Format unit price string (e.g. "€0.08/pcs")
 */
export const formatUnitPrice = (spb: ShopProductBrand, currency: string = '€'): string | null => {
  if (!spb.quantity || spb.quantity <= 0 || !spb.unit) {
    return null;
  }
  const unitPrice = spb.price / spb.quantity;
  const unitLabel = spb.unit;
  return `${currency}${unitPrice.toFixed(3)}/${unitLabel}`;
};

/**
 * Check if two SPBs can be compared by unit price (same unit type)
 */
const canCompareByUnit = (a: ShopProductBrand, b: ShopProductBrand): boolean => {
  return !!(a.quantity && a.quantity > 0 && a.unit && b.quantity && b.quantity > 0 && b.unit && a.unit === b.unit);
};

/**
 * Compare two SPBs - use unit price if both have same unit, otherwise absolute price
 */
const comparePrice = (a: ShopProductBrand, b: ShopProductBrand): number => {
  if (canCompareByUnit(a, b)) {
    return getUnitPrice(a) - getUnitPrice(b);
  }
  return a.price - b.price;
};

/**
 * Get the effective comparison price for an SPB within a group of same-product brands
 * If brands in the group share the same unit, use unit price; otherwise use absolute price
 */
const getEffectivePrice = (spb: ShopProductBrand, allBrands: ShopProductBrand[]): number => {
  // Check if all brands with quantity info share the same unit
  const brandsWithUnit = allBrands.filter(b => b.quantity && b.quantity > 0 && b.unit);
  if (brandsWithUnit.length > 1) {
    const firstUnit = brandsWithUnit[0].unit;
    const allSameUnit = brandsWithUnit.every(b => b.unit === firstUnit);
    if (allSameUnit && spb.quantity && spb.quantity > 0 && spb.unit) {
      return getUnitPrice(spb);
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
): Array<{shop: Shop; brands: ShopProductBrand[]; cheapestPrice: number}> => {
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
      return shop ? {shop, brands, cheapestPrice} : null;
    })
    .filter((item): item is {shop: Shop; brands: ShopProductBrand[]; cheapestPrice: number} => item !== null)
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
