import type { ReactNode } from "react";
import { Dialog } from "radix-ui";

interface ModalProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
  hideClose?: boolean;
  className?: string;
}

export function Modal({ title, children, footer, onClose, wide, hideClose = false, className }: ModalProps) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-backdrop" />
        <Dialog.Content
          className={`modal${wide ? " modal--wide" : ""}${className ? ` ${className}` : ""}`}
          aria-describedby={undefined}
        >
          <header className="modal__header">
            <Dialog.Title asChild><h2>{title}</h2></Dialog.Title>
            {!hideClose && <Dialog.Close asChild><button type="button" className="icon-button" aria-label="Close">×</button></Dialog.Close>}
          </header>
          <div className="modal__body">{children}</div>
          {footer && <footer className="modal__footer">{footer}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
