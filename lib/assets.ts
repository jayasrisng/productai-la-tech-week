export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetUrl(path: string) {
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}
