export const resolvePublicAssetPath = (assetPath: string) => {
  if (!assetPath) return assetPath;
  if (/^https?:\/\//.test(assetPath)) return assetPath;
  if (assetPath.startsWith('data:') || assetPath.startsWith('blob:')) return assetPath;
  if (assetPath.startsWith('//')) return assetPath;

  const normalizedInput = assetPath.replace(/\\/g, '/').trim();
  const basePath = import.meta.env.BASE_URL || '/';
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const baseNoSlash = normalizedBase.replace(/^\/+|\/+$/g, '');
  if (normalizedInput.startsWith(normalizedBase)) return normalizedInput;

  const cleanPath = normalizedInput.replace(/^\/+/, '');
  if (baseNoSlash && (cleanPath === baseNoSlash || cleanPath.startsWith(`${baseNoSlash}/`))) {
    return `/${cleanPath}`;
  }

  return `${normalizedBase}${cleanPath}`;
};
