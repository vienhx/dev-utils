export type PromptRequest = {
  kind: 'prompt';
  title: string;
  label: string;
  initial: string;
  submitLabel: string;
  /** Returns an error message to keep the dialog open, or null to accept. */
  validate: (value: string) => string | null;
  resolve: (value: string | null) => void;
};

export type ConfirmRequest = {
  kind: 'confirm';
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
};

export const dialogs: { current: PromptRequest | ConfirmRequest | null } = $state({
  current: null,
});

/** Asks for a line of text in a modal dialog. Resolves null on cancel. */
export function askText(opts: {
  title: string;
  label: string;
  initial?: string;
  submitLabel?: string;
  validate?: (value: string) => string | null;
}): Promise<string | null> {
  return new Promise((resolve) => {
    dialogs.current = {
      kind: 'prompt',
      title: opts.title,
      label: opts.label,
      initial: opts.initial ?? '',
      submitLabel: opts.submitLabel ?? 'Save',
      validate: opts.validate ?? (() => null),
      resolve,
    };
  });
}

/** Asks the user to confirm an action in a modal dialog. */
export function askConfirm(opts: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    dialogs.current = {
      kind: 'confirm',
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? 'OK',
      danger: opts.danger ?? false,
      resolve,
    };
  });
}
