import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdFlag, MdCheckCircle, MdError } from 'react-icons/md';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  userId?: string;
  userName?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
  show: boolean;
}

const REPORT_TYPES = [
  { value: 'spam', key: 'spam' },
  { value: 'harassment', key: 'harassment' },
  { value: 'inappropriate', key: 'inappropriate' },
  { value: 'hate_speech', key: 'hate_speech' },
  { value: 'violence', key: 'violence' },
  { value: 'other', key: 'other' }
];

// Composant de notification autonome (style badge rond)
const NotificationToast = ({ notification, onClose }: { notification: Notification; onClose: () => void }) => {
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification.show, onClose]);

  if (!notification.show) return null;

  const bgColor = notification.type === 'success' 
    ? 'bg-green-500' 
    : 'bg-red-500';

  const Icon = notification.type === 'success' ? MdCheckCircle : MdError;

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white rounded-full shadow-lg border-2 border-white dark:border-gray-800 z-[9999] flex items-center justify-center min-w-[48px] min-h-[48px] w-12 h-12 transform transition-all duration-300 ease-in-out hover:scale-110 cursor-pointer`} onClick={onClose}>
      <Icon className="w-6 h-6" />
    </div>
  );
};

export default function ReportModal({ isOpen, onClose, postId, userId, userName }: ReportModalProps) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedType('');
      setReason('');
      setIsSubmitting(false);
      setNotification(null);
    }
  }, [isOpen]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotification({
      id,
      type,
      message,
      show: true
    });
  };

  const hideNotification = () => {
    setNotification(prev => prev ? { ...prev, show: false } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const reportData: any = {
        type: selectedType,
        reason: reason.trim() || `Signalement: ${selectedType}`
      };

      // Signaler uniquement le post OU l'utilisateur, pas les deux
      if (postId) {
        reportData.postId = postId;
      } else if (userId) {
        reportData.userId = userId;
      }

      const response = await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reportData)
      });

      // Traitement de la réponse avec gestion d'erreur robuste
      let responseData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const responseText = await response.text();
          if (responseText.trim()) {
            responseData = JSON.parse(responseText);
          } else {
            responseData = { message: 'Signalement envoyé' };
          }
        } else {
          responseData = { message: 'Signalement envoyé' };
        }
      } catch (parseError) {
        console.warn('Erreur de parsing JSON:', parseError);
        responseData = { message: 'Signalement envoyé' };
      }

      if (response.ok || response.status === 201) {
        // Fermer le modal immédiatement
        onClose();
        
        // Afficher la notification de succès
        let successMessage;
        if (postId) {
          successMessage = t('report.post_success', 'Post signalé avec succès !');
        } else if (userName) {
          successMessage = t('report.success_with_user', `Utilisateur @${userName} signalé avec succès !`);
        } else {
          successMessage = t('report.success', 'Signalement envoyé avec succès !');
        }
        
        showNotification('success', successMessage);
      } else {
        // En cas d'erreur, garder le modal ouvert et afficher l'erreur
        const errorMessage = responseData.message || 
                            responseData.error || 
                            t('report.error', 'Erreur lors du signalement');
        showNotification('error', errorMessage);
      }
    } catch (error) {
      console.error('Erreur signalement:', error);
      showNotification('error', t('report.network_error', 'Erreur de connexion'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Détermine le titre en fonction du type de signalement
  const getModalTitle = () => {
    if (postId) {
      return t('report.title_post', 'Signaler ce post');
    } else if (userName) {
      return (
        <>
          {t('report.title_user', 'Signaler un utilisateur')}
          <span className="text-base font-normal">@{userName}</span>
        </>
      );
    } else {
      return t('report.title', 'Signaler un contenu');
    }
  };

  // Ne pas afficher le modal si pas ouvert
  if (!isOpen) {
    return (
      <>
        {notification && (
          <NotificationToast 
            notification={notification} 
            onClose={hideNotification} 
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MdFlag className="text-red-500" />
              {getModalTitle()}
            </h2>
            <button 
              onClick={handleClose} 
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <MdClose size={24} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('report.type', 'Type de signalement')} *
              </label>
              <div className="space-y-2">
                {REPORT_TYPES.map(({ value, key }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer" onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedType(value);
                  }}>
                    <input
                      type="radio"
                      name="reportType"
                      value={value}
                      checked={selectedType === value}
                      onChange={() => setSelectedType(value)}
                      disabled={isSubmitting}
                      className="form-radio"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t(`report.types.${key}`, key)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('report.additional_info', 'Informations supplémentaires')} ({t('common.optional', 'optionnel')})
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                maxLength={200}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder={t('report.additional_info_placeholder', 'Détails (optionnel)...')}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {reason.length}/200
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedType}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('common.processing', 'Traitement...')}</span>
                  </>
                ) : (
                  t('report.submit', 'Signaler')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <NotificationToast 
          notification={notification} 
          onClose={hideNotification} 
        />
      )}
    </>
  );
}