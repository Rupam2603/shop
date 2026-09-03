import { DbProduct } from "./products";

export interface ScoredProduct {
  product: DbProduct;
  score: number;
  isExact: boolean;
  isBrandMatch: boolean;
  isSimilar: boolean;
  similarityReason?: "brand" | "name_token" | "category";
}

export interface SearchResultsPayload {
  query: string;
  tokens: string[];
  results: ScoredProduct[];
  exactCount: number;
  similarCount: number;
  isSimilarOnly: boolean;
  matchedBrands: string[];
  matchedCategories: string[];
}

/**
 * Clean & tokenize search query
 */
export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 1);
}

/**
 * Core relevance and similarity matching engine
 */
export function searchProducts(
  products: DbProduct[],
  rawQuery: string
): SearchResultsPayload {
  const query = (rawQuery || "").trim();
  const tokens = tokenizeQuery(query);

  if (!query || tokens.length === 0 || products.length === 0) {
    return {
      query,
      tokens: [],
      results: [],
      exactCount: 0,
      similarCount: 0,
      isSimilarOnly: false,
      matchedBrands: [],
      matchedCategories: [],
    };
  }

  const normQuery = query.toLowerCase();
  const topMatchedBrands = new Set<string>();
  const topMatchedCategories = new Set<string>();

  // Pass 1: Compute baseline score for each product
  const scoredItems = products.map((p) => {
    const nameLower = (p.name || "").toLowerCase();
    const brandLower = (p.brand || "").toLowerCase();
    const catLower = (p.category_name || "").toLowerCase();
    const detailsLower = (p.details || p.subtitle || "").toLowerCase();

    let score = 0;
    let exactNameMatch = false;
    let exactBrandMatch = false;

    // Full query string matches
    if (nameLower.includes(normQuery)) {
      score += 12;
      exactNameMatch = true;
    }
    if (brandLower.includes(normQuery)) {
      score += 10;
      exactBrandMatch = true;
    }
    if (catLower.includes(normQuery)) {
      score += 4;
    }
    if (detailsLower.includes(normQuery)) {
      score += 3;
    }

    // Token-based matching
    let matchedNameTokens = 0;
    let matchedBrandTokens = 0;
    let matchedDetailTokens = 0;

    for (const t of tokens) {
      if (t.length < 2 && tokens.length > 1) continue; // Skip single char noise if multi-token

      if (nameLower.includes(t)) {
        matchedNameTokens++;
        // Boost if word starts with token
        if (new RegExp(`\\b${t}`, "i").test(nameLower)) {
          score += 3;
        } else {
          score += 2;
        }
      }

      if (brandLower.includes(t)) {
        matchedBrandTokens++;
        score += 4;
      }

      if (detailsLower.includes(t) || catLower.includes(t)) {
        matchedDetailTokens++;
        score += 1;
      }
    }

    // All tokens present in name bonus
    if (tokens.length > 1 && matchedNameTokens === tokens.length) {
      score += 8;
      exactNameMatch = true;
    }

    // All tokens present across name + brand
    if (tokens.length > 1 && matchedNameTokens + matchedBrandTokens >= tokens.length) {
      score += 5;
    }

    const isExact = exactNameMatch || exactBrandMatch || score >= 8;

    if (isExact && p.brand) {
      topMatchedBrands.add(p.brand.toLowerCase());
    }
    if (isExact && p.category_name) {
      topMatchedCategories.add(p.category_name.toLowerCase());
    }

    return {
      product: p,
      score,
      isExact,
      isBrandMatch: exactBrandMatch || matchedBrandTokens > 0,
      isSimilar: false,
      similarityReason: undefined as ScoredProduct["similarityReason"],
    };
  });

  // Pass 2: Similar Products emphasis (same brand, shared tokens, or same category as top matches)
  const finalResults: ScoredProduct[] = scoredItems.map((item) => {
    const p = item.product;
    const brandLower = (p.brand || "").toLowerCase();
    const catLower = (p.category_name || "").toLowerCase();

    let boostedScore = item.score;
    let isSimilar = false;
    let similarityReason: ScoredProduct["similarityReason"] = undefined;

    // If product belongs to the same brand as any top-matching product
    if (!item.isExact && brandLower && topMatchedBrands.has(brandLower)) {
      boostedScore += 6;
      isSimilar = true;
      similarityReason = "brand";
    }

    // If product shares significant name tokens or category with query
    if (!item.isExact && boostedScore > 0 && !isSimilar) {
      isSimilar = true;
      similarityReason = "name_token";
    }

    // If product shares category of top matches and has non-zero query affinity
    if (!item.isExact && !isSimilar && catLower && topMatchedCategories.has(catLower) && boostedScore > 0) {
      boostedScore += 3;
      isSimilar = true;
      similarityReason = "category";
    }

    return {
      ...item,
      score: boostedScore,
      isSimilar: isSimilar || (!item.isExact && boostedScore > 0),
      similarityReason: similarityReason || item.similarityReason,
    };
  });

  // Filter products with score > 0
  let matched = finalResults.filter((r) => r.score > 0);

  // Fallback: If 0 results, expand broadly to any product matching any token (relaxed substring)
  if (matched.length === 0 && tokens.length > 0) {
    const fallbackResults = products
      .map((p) => {
        const text = `${p.name} ${p.brand} ${p.category_name} ${p.details || ""}`.toLowerCase();
        let fallbackScore = 0;
        for (const t of tokens) {
          if (t.length >= 2 && text.includes(t)) {
            fallbackScore += 2;
          }
        }
        return {
          product: p,
          score: fallbackScore,
          isExact: false,
          isBrandMatch: false,
          isSimilar: true,
          similarityReason: "name_token" as const,
        };
      })
      .filter((r) => r.score > 0);

    matched = fallbackResults;
  }

  // Sort by score DESC, in-stock first, then id DESC
  matched.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aInStock = (a.product.stock ?? 0) > 0 ? 1 : 0;
    const bInStock = (b.product.stock ?? 0) > 0 ? 1 : 0;
    if (bInStock !== aInStock) return bInStock - aInStock;
    return b.product.numeric_id - a.product.numeric_id;
  });

  const exactMatches = matched.filter((m) => m.isExact);
  const similarMatches = matched.filter((m) => !m.isExact);
  const isSimilarOnly = exactMatches.length === 0 && similarMatches.length > 0;

  const matchedBrands = Array.from(
    new Set(matched.map((m) => m.product.brand).filter(Boolean))
  );
  const matchedCategories = Array.from(
    new Set(matched.map((m) => m.product.category_name).filter(Boolean))
  );

  return {
    query,
    tokens,
    results: matched,
    exactCount: exactMatches.length,
    similarCount: similarMatches.length,
    isSimilarOnly,
    matchedBrands,
    matchedCategories,
  };
}
