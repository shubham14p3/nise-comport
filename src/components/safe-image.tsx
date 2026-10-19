"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { Images } from "lucide-react";

/**
 * An image that never shows the browser's broken-image icon. If the file or the Google photo
 * cannot be loaded, a tidy placeholder with the same shape is shown instead (optionally trying
 * a local `fallbackSrc` first).
 */
export default function SafeImage({ fallbackSrc, alt, width, height, className, ...rest }: ImageProps & { fallbackSrc?: string }) {
  const [src, setSrc] = useState(rest.src);
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className={`img-fallback ${className ?? ""}`} role="img" aria-label={alt} style={{ aspectRatio: width && height ? `${width} / ${height}` : "4 / 3", width: "100%" }}><Images size={28} aria-hidden="true"/></span>;
  }
  return <Image {...rest} src={src} alt={alt} width={width} height={height} className={className}
    onError={() => { if (fallbackSrc && src !== fallbackSrc) { setSrc(fallbackSrc); } else { setFailed(true); } }}/>;
}
