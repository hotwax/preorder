import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every in-app link target is a registered route (preorder-maarg#106): a link to an unknown path falls through the
 * catch-all to the dashboard. The routes are read from src/router/index.ts; the targets from router-link, router.push and
 * router.replace, ion-back-button default-href and the menu's url, with each ${...} part read as a route parameter.
 */
const SRC = join(process.cwd(), 'src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(vue|ts)$/.test(name) ? [path] : [];
  });
}

const routerSource = readFileSync(join(SRC, 'router', 'index.ts'), 'utf8');
const routes = [...routerSource.matchAll(/(?:page\(\s*|path:\s*)'(\/[^']*)'/g)].map((m) => m[1]).filter((path) => !path.includes('pathMatch'));

const LINK_PATTERNS = [
  /router-link="(\/[^"]*)"/g,
  /:router-link="`(\/[^`]*)`"/g,
  /router\.(?:push|replace)\(\s*[`'"](\/[^`'"]*)[`'"]/g,
  /default-href="(\/[^"]*)"/g
];
// The menu's entries name app routes in url; elsewhere a url is an API path
const MENU_URL = /\burl:\s*["'`](\/[^"'`]*)["'`]/g;

const normalized = (target: string) => target.replace(/\$\{[^}]*\}/g, ':param').replace(/[?#].*$/, '');

function matchesRoute(target: string): boolean {
  const parts = target.split('/');
  return routes.some((route) => {
    const routeParts = route.split('/');
    return routeParts.length === parts.length && routeParts.every((part, i) => part.startsWith(':') || part === parts[i]);
  });
}

const targets = sourceFiles(SRC).filter((file) => !file.includes(`${join('src', 'router')}`)).flatMap((file) => {
  const text = readFileSync(file, 'utf8');
  const patterns = file.endsWith(join('layout', 'Menu.vue')) ? [...LINK_PATTERNS, MENU_URL] : LINK_PATTERNS;
  return patterns.flatMap((pattern) => [...text.matchAll(pattern)].map((m) => ({ file: file.replace(`${SRC}/`, ''), target: normalized(m[1]) })));
});

describe('in-app links (preorder-maarg#106)', () => {
  it('reads the routes and finds the links', () => {
    expect(routes).toContain('/purchase-orders/:orderId/shipments/new');
    expect(targets.length).toBeGreaterThan(10);
    expect(targets.some(({ file }) => file.endsWith('Menu.vue'))).toBe(true);
  });

  it('every link target is a registered route', () => {
    expect(targets.filter(({ target }) => !matchesRoute(target))).toEqual([]);
  });

  it('would catch the retired inbound-shipment link', () => {
    expect(matchesRoute(normalized('/purchase-orders/${orderId}/inbound-shipment'))).toBe(false);
    expect(matchesRoute(normalized('/purchase-orders/${encodeURIComponent(orderId)}/shipments/new'))).toBe(true);
  });
});
