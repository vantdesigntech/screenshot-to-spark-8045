/**
 * Escalador de resolución HD para imágenes de marketplaces
 * Elimina la compresión y miniaturas de baja calidad, forzando la imagen original en 1600px o nativa sin recorte.
 */
export function upgradeToHighResImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  let clean = url.trim();
  if (clean.startsWith('//')) clean = `https:${clean}`;
  clean = clean.replace(/_\.avif$/i, '');

  // 1. eBay: cambia /s-l225. /s-l300. /s-l400. /s-l500. /s-l64. por /s-l1600. (resolución nativa original hasta 1600px)
  if (/ebayimg\.com/i.test(clean)) {
    return clean.replace(/\/s-l\d+\.([a-zA-Z0-9]+)/i, '/s-l1600.$1');
  }

  // 2. Wallapop: cambia /medium/ o /small/ por /original/ y limpia parámetros de recorte pictureSize
  if (/wallapop\.com/i.test(clean)) {
    return clean
      .replace(/\/(medium|small|picture)\//i, '/original/')
      .replace(/[?&]pictureSize=[^&]+/gi, '')
      .replace(/[?&]w=\d+/gi, '')
      .replace(/[?&]h=\d+/gi, '')
      .replace(/\?$/, '');
  }

  // 3. PicClick: pide tamaño máximo 1600
  if (/picclickimg\.com/i.test(clean)) {
    return clean.replace(/\/(200|400|500)\//, '/1600/');
  }

  return clean;
}
