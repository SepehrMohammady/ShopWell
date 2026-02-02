/**
 * Price comparison helper utilities
 */

import {PriceComparison, ShopProduct, Shop, Product} from '../types';

/**
 * Format a price with currency symbol
 */
export const formatPrice = (amount: number, currency: string = '€'): string => {
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * Get price comparison for a product at a specific shop
 * Returns comparison data including savings vs cheapest option
 */
export const getPriceComparison = (
  productId: string,
  shopId: string,
  shopProducts: ShopProduct[],
  shops: Shop[],
): PriceComparison | null => {
  // Find the current shop-product price
  const currentShopProduct = shopProducts.find(
    sp => sp.productId === productId && sp.shopId === shopId,
  );

  if (!currentShopProduct) {
    return null;
  }

  // Find all shops that carry this product
  const productPrices = shopProducts.filter(sp => sp.productId === productId);

  if (productPrices.length === 0) {
    return null;
  }

  // Find the cheapest option
  const cheapest = productPrices.reduce((min, sp) =>
    sp.price < min.price ? sp : min,
  );

  const cheapestShop = shops.find(s => s.id === cheapest.shopId);
  const savings = currentShopProduct.price - cheapest.price;
  const savingsPercent =
    currentShopProduct.price > 0
      ? (savings / currentShopProduct.price) * 100
      : 0;

  return {
    currentPrice: currentShopProduct.price,
    cheapestPrice: cheapest.price,
    cheapestShopId: cheapest.shopId,
    cheapestShopName: cheapestShop?.name || 'Unknown',
    savings,
    savingsPercent,
    isCheapest: currentShopProduct.shopId === cheapest.shopId,
  };
};

/**
 * Get the cheapest shop for a product
 */
export const getCheapestShop = (
  productId: string,
  shopProducts: ShopProduct[],
  shops: Shop[],
): {shop: Shop; price: number} | null => {
  const productPrices = shopProducts.filter(sp => sp.productId === productId);

  if (productPrices.length === 0) {
    return null;
  }

  const cheapest = productPrices.reduce((min, sp) =>
    sp.price < min.price ? sp : min,
  );

  const shop = shops.find(s => s.id === cheapest.shopId);

  if (!shop) {
    return null;
  }

  return {shop, price: cheapest.price};
};

/**
 * Get all prices for a product sorted by price (cheapest first)
 */
export const getAllPricesForProduct = (
  productId: string,
  shopProducts: ShopProduct[],
  shops: Shop[],
): Array<{shop: Shop; price: number; shopProduct: ShopProduct}> => {
  return shopProducts
    .filter(sp => sp.productId === productId)
    .map(sp => {
      const shop = shops.find(s => s.id === sp.shopId);
      return shop ? {shop, price: sp.price, shopProduct: sp} : null;
    })
    .filter((item): item is {shop: Shop; price: number; shopProduct: ShopProduct} => item !== null)
    .sort((a, b) => a.price - b.price);
};

/**
 * Calculate total cost for a shopping list at a specific shop
 */
export const calculateListTotalAtShop = (
  items: Array<{productId?: string; quantity: number}>,
  shopId: string,
  shopProducts: ShopProduct[],
): {total: number; itemsWithPrices: number; itemsWithoutPrices: number} => {
  let total = 0;
  let itemsWithPrices = 0;
  let itemsWithoutPrices = 0;

  items.forEach(item => {
    if (item.productId) {
      const shopProduct = shopProducts.find(
        sp => sp.productId === item.productId && sp.shopId === shopId,
      );
      if (shopProduct) {
        total += shopProduct.price * item.quantity;
        itemsWithPrices++;
      } else {
        itemsWithoutPrices++;
      }
    } else {
      itemsWithoutPrices++;
    }
  });

  return {total, itemsWithPrices, itemsWithoutPrices};
};

/**
 * Get products that are cheaper elsewhere
 * Useful for warnings when shopping at a specific shop
 */
export const getCheaperAlternatives = (
  shopId: string,
  shopProducts: ShopProduct[],
  shops: Shop[],
  products: Product[],
): Array<{
  product: Product;
  currentPrice: number;
  cheapestPrice: number;
  cheapestShop: Shop;
  savings: number;
}> => {
  const alternatives: Array<{
    product: Product;
    currentPrice: number;
    cheapestPrice: number;
    cheapestShop: Shop;
    savings: number;
  }> = [];

  // Get all products at this shop
  const productsAtShop = shopProducts.filter(sp => sp.shopId === shopId);

  productsAtShop.forEach(sp => {
    const comparison = getPriceComparison(sp.productId, shopId, shopProducts, shops);
    if (comparison && !comparison.isCheapest && comparison.savings > 0) {
      const product = products.find(p => p.id === sp.productId);
      const cheapestShop = shops.find(s => s.id === comparison.cheapestShopId);
      if (product && cheapestShop) {
        alternatives.push({
          product,
          currentPrice: comparison.currentPrice,
          cheapestPrice: comparison.cheapestPrice,
          cheapestShop,
          savings: comparison.savings,
        });
      }
    }
  });

  // Sort by savings (highest first)
  return alternatives.sort((a, b) => b.savings - a.savings);
};
