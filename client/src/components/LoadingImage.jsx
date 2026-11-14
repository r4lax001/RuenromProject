import { useState } from "react";

export default function LoadingImage({ src, ...props }) {
  const [settledSrc, setSettledSrc] = useState(null);
  const settle = () => setSettledSrc(src);
  return <img {...props} src={src} data-image-loading={settledSrc !== src || undefined}
    onLoad={settle} onError={settle} />;
}
