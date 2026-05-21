import {
  createProductRecord,
  deleteProductRecord,
  findProductById,
  findProductBySlug,
  listProducts,
  toggleProductStockRecord,
  updateProductRecord,
} from "./product-store";

export async function getProducts() {
  return listProducts();
}

export async function getProductBySlug(slug: string) {
  return findProductBySlug(slug);
}

export async function getProductById(id: string) {
  return findProductById(id);
}

export {
  createProductRecord,
  updateProductRecord,
  deleteProductRecord,
  toggleProductStockRecord,
};
