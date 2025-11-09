const listeners = {};
export function subscribe(event, fn) {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(fn);
  return () => { listeners[event].delete(fn); };
}
export function emit(event, payload) {
  const set = listeners[event];
  if (!set) return;
  set.forEach(fn => {
    try { fn(payload); } catch (e) { console.warn('event handler error', e); }
  });
}
export default { subscribe, emit };