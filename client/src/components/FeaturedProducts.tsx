import { FC } from "react";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  brand: string;
  description: string;
  colors: string[];
  sizes: string[];
  discount: number;
}

interface FeaturedProductsProps {
  products: Product[];
}

const FeaturedProducts: FC<FeaturedProductsProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="bg-blue-100/50 dark:bg-blue-900/10 rounded-xl shadow-sm py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10">
          {products.map((product, index) => (
            <div key={product.id}>
              <ProductCard product={product} priority={index < 2} mode="user" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
