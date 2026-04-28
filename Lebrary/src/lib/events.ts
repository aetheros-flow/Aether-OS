export const DATA_REFRESH = 'lumina:data-refresh';

export function triggerDataRefresh(): void {
  window.dispatchEvent(new CustomEvent(DATA_REFRESH));
}
