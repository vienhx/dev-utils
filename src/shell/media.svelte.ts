/** Viewport width below which the sidebar becomes a drawer. */
export const MOBILE_QUERY = '(max-width: 767.98px)';

const mql = typeof matchMedia === 'function' ? matchMedia(MOBILE_QUERY) : null;

export const viewport = $state({ mobile: mql?.matches ?? false });

mql?.addEventListener('change', (e) => {
  viewport.mobile = e.matches;
});
