import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, HelpCircle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  isConfirming = false
}) => {
  const isDanger = confirmVariant === 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onClose={isConfirming ? () => {} : onClose}
      size="sm"
      className="border-slate-800"
      ariaLabel={title}
    >
      <div className="flex flex-col items-center text-center p-2">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
            isDanger
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
          }`}
        >
          {isDanger ? (
            <AlertTriangle className="w-7 h-7" />
          ) : (
            <HelpCircle className="w-7 h-7" />
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">{message}</p>

        <div className="grid grid-cols-2 gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming}
            fullWidth
          >
            {cancelText}
          </Button>

          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isConfirming}
            fullWidth
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
