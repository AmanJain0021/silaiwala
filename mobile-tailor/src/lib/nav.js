/*
 * react-router-dom compatible helpers on top of expo-router, so ported screens
 * keep the web's navigation code: navigate(path, { replace, state }), navigate(-1),
 * useLocation().state / .pathname / .search, useParams(), useSearchParams().
 * Route files mirror web paths, so web paths work unchanged.
 * `state` objects can't travel in URLs, so they are kept in memory keyed by an id param.
 */
import { useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useLocalSearchParams, router as globalRouter } from 'expo-router';

const stateStore = new Map();
let seq = 0;
const STATE_PARAM = '__s';
export const TAB_ROOTS = ['/partner', '/partner/orders', '/partner/wallet', '/partner/products', '/partner/settings'];

let currentPath = null;

/** Rendered once in the root layout, so navigateTo knows the current route without re-rendering screens. */
export function NavPathTracker() {
  const pathname = usePathname();
  useEffect(() => { currentPath = pathname; }, [pathname]);
  return null;
}

function buildHref(to, state) {
  const [pathPart, query = ''] = String(to).split('?');
  const params = {};
  new URLSearchParams(query).forEach((v, k) => { params[k] = v; });
  if (state !== undefined && state !== null) {
    const id = `${Date.now().toString(36)}${(seq++).toString(36)}`;
    stateStore.set(id, state);
    if (stateStore.size > 60) stateStore.delete(stateStore.keys().next().value);
    params[STATE_PARAM] = id;
  }
  let pathname = pathPart || '/partner';
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  return Object.keys(params).length ? { pathname, params } : pathname;
}

export function navigateTo(r, to, opts = {}) {
  if (typeof to === 'number') {
    if (to < 0 && r.canGoBack()) r.back();
    else if (to < 0) r.replace('/partner');
    return;
  }
  const href = buildHref(to, opts.state);
  // Tab roots live in one tab navigator (app/user/(tabs)): switch to the mounted tab
  // (popping back to it from deeper screens) instead of pushing a second copy.
  if (typeof href === 'string' && TAB_ROOTS.includes(href)) {
    if (TAB_ROOTS.includes(currentPath)) r.navigate(href); // already inside the tab navigator
    else if (opts.replace) { // leaving login etc.: nothing should stay underneath the tabs
      if (r.canDismiss()) r.dismissAll();
      r.replace(href);
    } else if (r.canDismiss()) r.dismissTo(href);
    else r.navigate(href);
    return;
  }
  if (opts.replace) r.replace(href);
  else r.push(href);
}

export function useNavigate() {
  const r = useRouter();
  return useCallback((to, opts) => navigateTo(r, to, opts), [r]);
}

/** Imperative navigation outside components (stores, interceptors). */
export const navigate = (to, opts) => navigateTo(globalRouter, to, opts);

export function useLocation() {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  return useMemo(() => {
    const { [STATE_PARAM]: sid, ...rest } = params;
    const qs = new URLSearchParams();
    Object.entries(rest).forEach(([k, v]) => { if (v != null && !Array.isArray(v)) qs.set(k, v); });
    const search = qs.toString();
    return { pathname, search: search ? `?${search}` : '', state: sid ? stateStore.get(sid) ?? null : null, hash: '' };
  }, [pathname, params]);
}

export function useParams() {
  const params = useLocalSearchParams();
  return useMemo(() => {
    const { [STATE_PARAM]: _s, ...rest } = params;
    return rest;
  }, [params]);
}

export function useSearchParams() {
  const params = useLocalSearchParams();
  const r = useRouter();
  const sp = useMemo(() => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (k !== STATE_PARAM && v != null && !Array.isArray(v)) qs.set(k, v); });
    return qs;
  }, [params]);
  const setSearchParams = useCallback((next) => {
    const obj = {};
    const src = next instanceof URLSearchParams ? next : new URLSearchParams(next);
    src.forEach((v, k) => { obj[k] = v; });
    r.setParams(obj);
  }, [r]);
  return [sp, setSearchParams];
}
