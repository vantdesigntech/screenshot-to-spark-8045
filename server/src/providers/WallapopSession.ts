import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(stealthPlugin());

let cachedCookie: string | null = null;
let cookieTimestamp: number = 0;
const COOKIE_TTL_MS = 25 * 60 * 1000; // Refrescar cada 25 minutos

/**
 * Obtiene o renueva de forma ligera y transparente las cookies y tokens de sesión de Wallapop.
 * Se lanza en headless shell para superar Cloudflare/Datadome de manera limpia.
 */
export async function getWallapopSessionCookies(): Promise<string> {
  const now = Date.now();
  if (cachedCookie && now - cookieTimestamp < COOKIE_TTL_MS) {
    return cachedCookie;
  }

  console.log('[WallapopSession] Refrescando cookies de sesión vivas...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'es-ES'
    });

    const page = await context.newPage();
    await page.goto('https://es.wallapop.com/app/search?keywords=reloj', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    // Pequeña pausa para permitir que Datadome/Cloudflare valide la huella de navegación
    await page.waitForTimeout(2500);

    const cookies = await context.cookies();
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    if (cookieString) {
      cachedCookie = cookieString;
      cookieTimestamp = now;
      console.log('[WallapopSession] Cookies de sesión renovadas con éxito.');
    }

    await browser.close();
    return cachedCookie || '';
  } catch (error) {
    console.error('[WallapopSession] Error obteniendo cookies vivas:', error);
    await browser.close();
    return cachedCookie || '';
  }
}
