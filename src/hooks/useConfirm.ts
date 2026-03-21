import { createElement, useCallback, useRef, useState } from "react";
import { ConfirmModal } from "../components/common/ConfirmModal";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

type ModalState = ConfirmOptions & { open: true } | { open: false };

export const useConfirm = () => {
  const [modal, setModal] = useState<ModalState>({ open: false });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setModal({ ...options, open: true });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setModal({ open: false });
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setModal({ open: false });
  }, []);

  const ConfirmDialog = createElement(ConfirmModal, {
    open: modal.open,
    title: modal.open ? modal.title : "",
    message: modal.open ? modal.message : "",
    confirmLabel: modal.open ? modal.confirmLabel : undefined,
    cancelLabel: modal.open ? modal.cancelLabel : undefined,
    variant: modal.open ? modal.variant : undefined,
    onConfirm: handleConfirm,
    onCancel: handleCancel
  });

  return { confirm, ConfirmDialog } as const;
};
