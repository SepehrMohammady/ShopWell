/**
 * Price comparison helper utilities
 * Works with brand-based pricing model
 */

import {PriceComparison, ShopProductBrand, Shop, Product} from '../types';

/**
 * Format a price with currency symbol
 */
export const formatPrice = (amount: number, currency: string = '€'): string => {
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * Get the cheapest brand option for a product at a specific shop
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
    spb.price < min.price ? spb : min,
  );
};

/**
 * Get price comparison for a product at a specific shop
 * Compares the cheapest brand at this shop vs cheapest brand anywhere
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

  // Find the cheapest option anywhere
  const cheapestAnywhere = allBrandOptions.reduce((min, spb) =>
    spb.price < min.price ? spb : min,
  );

  const cheapestShop = shops.find(s => s.id === cheapestAnywhere.shopId);
  const savings = cheapestAtThisShop.price - cheapestAnywhere.price;
  const savingsPercent =
    cheapestAtThisShop.price > 0
      ? (savings / cheapestAtThisShop.price) * 100
      : 0;

  return {
    currentPrice: cheapestAtThisShop.price,
    cheapestPrice: cheapestAnywhere.price,
    cheapestShopId: cheapestAnywhere.shopId,
    cheapestShopName: cheapestShop?.name || 'Unknown',
    savings,
    savingsPercent,
    isCheapest: cheapestAtThisShop.id === cheapestAnywhere.id,
  };
};

/**
 * Get the cheapest option for a product across all shops
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
    spb.price < min.price ? spb : min,
  );

  const shop = shops.find(s => s.id === cheapest.shopId);

  if (!shop) {
    return null;
  }

  return {shop, brand: cheapest, price: cheapest.price};
};

/**
 * Get all prices for a product grouped by shop, sorted by cheapest option at each shop
 */
export const getAllPricesForProduct = (
  productId: string,
  shopProductBrands: ShopProductBrand[],
  shops: Shop[],
): Array<{shop: Shop; brands: ShopProductBrand[]; cheapestPrice: number}> => {
  // Group by shop
  const shopIds = [...new Set(
    shopProductBrands
      .filter(spb => spb.productId === productId)
      .map(spb => spb.shopId)
  )];

  return shopIds
    .map(shopId => {
      const shop = shops.find(s => s.id === shopId);
      const brands = shopProductBrands
        .filter(spb => spb.productId === productId && spb.shopId === shopId)
        .sort((a, b) => a.price - b.price);
      const cheapestPrice = brands.length > 0 ? brands[0].price : Infinity;
      return shop ? {shop, brands, cheapestPrice} : null;
    })
    .filter((item): item is {shop: Shop; brands: ShopProductBrand[]; cheapestPrice: number} => item !== null)
    .sort((a, b) => a.cheapestPrice - b.cheapestPrice);
};

/**
 * Get products that are cheaper elsewhere (comparing cheapest options)
 * Useful for warnings when shopping at a specific shop
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
      const savings = cheapestAtThisShop.price - cheapestAnywhere.price;
      if (savings > 0) {
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
