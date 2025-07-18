import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdWarning, MdClose } from 'react-icons/md';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDangerous = false
}: ConfirmationModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Un seul appel, pas de onClose() automatique
  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onConfirm(); // Seulement onConfirm, le parent gère la fermeture
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  // Empêcher la propagation sur le conteneur modal
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-auto transform transition-all duration-200 scale-100"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isDangerous ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
              <MdWarning className={`w-6 h-6 ${isDangerous ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MdClose className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            {cancelText || t('common.cancel', 'Annuler')}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              isDangerous
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {confirmText || t('common.confirm', 'Confirmer')}
          </button>
        </div>
      </div>
    </div>
  );
}