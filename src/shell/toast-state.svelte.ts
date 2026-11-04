export type ToastAction = { label: string; run: () => void };

export type ToastState = {
  id: number;
  message: string;
  tone: 'info' | 'error';
  action?: ToastAction;
};

export const toast: { current: ToastState | null } = $state({ current: null });

let timer: ReturnType<typeof setTimeout> | undefined;
let nextId = 1;

/** Shows a single toast, replacing any current one. */
export function showToast(
  message: string,
  opts: { tone?: 'info' | 'error'; action?: ToastAction; duration?: number } = {},
): void {
  clearTimeout(timer);
  const id = nextId++;
  toast.current = { id, message, tone: opts.tone ?? 'info', action: opts.action };
  timer = setTimeout(() => {
    if (toast.current?.id === id) toast.current = null;
  }, opts.duration ?? 3000);
}

export function dismissToast(): void {
  clearTimeout(timer);
  toast.current = null;
}
