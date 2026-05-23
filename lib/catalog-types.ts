export type Catalog = {
  id: string;
  slug: string;
  name: string;
  image: string;
  defaultPrice: number;
  /** Default listing name when adding a product in this catalog */
  defaultProductName: string;
  /** Display order on admin catalogs page and shop home (lower = earlier). */
  sortOrder: number;
};

export type CatalogWithProducts = Catalog & {
  products: import("./product-types").Product[];
};

export type CatalogWithCount = Catalog & {
  productCount: number;
};
