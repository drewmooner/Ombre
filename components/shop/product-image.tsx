"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import {
  SHOP_IMAGE_PLACEHOLDER,
  resolveShopImageSrc,
  shouldUnoptimizeShopImage,
} from "@/lib/shop/image-url";

type ProductImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string | undefined | null;
  alt: string;
};

export function ProductImage({
  src: srcProp,
  alt,
  onError,
  unoptimized,
  ...rest
}: ProductImageProps) {
  const [src, setSrc] = useState(() => resolveShopImageSrc(srcProp));

  useEffect(() => {
    setSrc(resolveShopImageSrc(srcProp));
  }, [srcProp]);

  const resolvedUnoptimized =
    unoptimized ?? shouldUnoptimizeShopImage(src);

  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      unoptimized={resolvedUnoptimized}
      onError={(event) => {
        if (src !== SHOP_IMAGE_PLACEHOLDER) {
          setSrc(SHOP_IMAGE_PLACEHOLDER);
        }
        onError?.(event);
      }}
    />
  );
}
