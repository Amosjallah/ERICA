/** Use with next/image `unoptimized` for API uploads on loopback (any port) so images always load in dev. */
export function isLoopbackImageUrl(src: string): boolean {
  if (!src.startsWith("http://") && !src.startsWith("https://")) return false;
  try {
    const { hostname } = new URL(src);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

export function productImageUnoptimized(src: string): boolean {
  return src.endsWith(".svg") || isLoopbackImageUrl(src);
}
