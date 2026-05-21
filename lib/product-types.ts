export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  catalogId: string;
  /** Units available — in stock while pieces > 0 */
  pieces: number;
  /** Available sizes, e.g. S, M, L or One size */
  sizes?: string[];
  inStock: boolean;
  details: string[];
  featured?: boolean;
};
