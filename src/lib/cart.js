/**
 * @typedef {Object} CartItem
 * @property {string} _id
 * @property {string} name
 * @property {number} unitPrice
 * @property {number} qty
 * @property {number} subtotal
 */

/**
 * @typedef {Object} CartPayload
 * @property {string} store
 * @property {CartItem[]} items
 * @property {number} itemsTotal
 * @property {number} [helpFee]
 * @property {number} total
 */

/**
 * Build a normalized cart payload from store name and items.
 * @param {string} storeName
 * @param {CartItem[]} items
 * @returns {CartPayload}
 */
export function buildCartPayload(storeName, items) {
  const itemsTotal = (items || []).reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);
  const helpFee = 0;
  return {
    store: storeName,
    items,
    itemsTotal,
    helpFee,
    total: itemsTotal,
  };
}

/**
 * Persist cart payload to localStorage.
 * @param {CartPayload} cart
 */
export function saveCart(cart) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('quickclean_cart', JSON.stringify(cart));
    window.__quickclean_cart = cart;
  } catch (e) {
    // ignore storage errors
  }
}

/**
 * Load cart payload from localStorage if available.
 * @returns {CartPayload | null}
 */
export function loadCart() {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem('quickclean_cart');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.items)) return null;
    return obj;
  } catch (e) {
    return null;
  }
}
