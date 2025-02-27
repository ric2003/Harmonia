"use client";
import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface StationImageProps extends ImageProps {
  fallbackSrc?: string;
}

export default function StationImage({ 
  fallbackSrc = "/images/default.png",
  ...props 
}: StationImageProps) {
  const [src, setSrc] = useState(props.src);

  return (
    <Image
      {...props}
      src={src}
      onError={() => setSrc(fallbackSrc)}
      alt={props.alt || "Station image"}
    />
  );
}