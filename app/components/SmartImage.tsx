"use client";

import Image, { type ImageProps } from "next/image";

type SmartImageProps = Omit<ImageProps, "src" | "fill" | "width" | "height"> & {
  src: string;
  /** Passthrough für den Fallback-<img>-Tag (next/image erlaubt kein className direkt neben fill). */
  className?: string;
  /**
   * Fixe Pixel-Maße statt "fill" (z.B. für 64x64-Thumbnails in festen
   * Containern). Ohne Angabe wird "fill" verwendet (braucht
   * position:relative + definierte Höhe am Elternelement).
   */
  width?: number;
  height?: number;
};

/**
 * Automatische Bildkomprimierung (WebP/AVIF, responsive Größen, Lazy
 * Loading standardmäßig) über Next.js' next/image - ABER mit Fallback:
 * next/image kann keine Base64-Data-URLs verarbeiten (würde einen Fehler
 * werfen bzw. bräuchte unoptimized, was den Komprimierungs-Vorteil
 * zunichtemacht). Ältere Produkte könnten laut db/schema.ts noch
 * Base64-Bilder in der DB haben (vor der Umstellung auf Vercel Blob
 * Storage) - für die wird ganz normal <img> gerendert (Status quo, keine
 * Verschlechterung), für alle Blob-/externen URLs greift die echte
 * Optimierung.
 */
export default function SmartImage({ src, alt, className, sizes, width, height, ...props }: SmartImageProps) {
  if (src.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} width={width} height={height} />;
  }

  if (width && height) {
    return <Image src={src} alt={alt} width={width} height={height} className={className} {...props} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
      className={className}
      {...props}
    />
  );
}
