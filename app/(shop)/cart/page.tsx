import { CartPageView } from "@/components/shop/cart-page-view";
import { getShopCustomer } from "@/lib/shop-auth";

export default async function CartPage() {
  const customer = await getShopCustomer();
  return <CartPageView signedIn={Boolean(customer)} />;
}
