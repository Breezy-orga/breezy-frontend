// components/AdminModerationPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFlag, MdPerson, MdBlock, MdCheck, MdClose, MdHistory, MdDelete, MdSchedule, MdCheckCircle, MdError, MdInfo, MdWarning } from 'react-icons/md';

interface Report {
  _id: string;
  reporter: { username: string; profilePicture?: string };
  reported?: { _id: string; username: string; profilePicture?: string };
  post?: { _id: string; content: string; author: string; createdAt: string };
  type: string;
  reason: string;
  status: string;
  moderator?: { username: string };
  moderatorAction?: string;
  createdAt: string;
}

interface AdminModerationPanelProps {
  userRole: 'admin' | 'moderator';
}

interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface PromptDialog {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  inputType?: 'text' | 'number';
}

// Composant d'alerte personnalisé
const CustomAlert = ({ alert, onClose }: { alert: Alert; onClose: () => void }) => {
  const icons = {
    success: <MdCheckCircle className="w-5 h-5" />,
    error: <MdError className="w-5 h-5" />,
    warning: <MdWarning className="w-5 h-5" />,
    info: <MdInfo className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200',
    warning: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-orange-500',
    info: 'text-blue-500'
  };

  useEffect(() => {
    if (alert.duration) {
      const timer = setTimeout(() => {
        onClose();
      }, alert.duration);
      return () => clearTimeout(timer);
    }
  }, [alert.duration, onClose]);

  return (
    <div className={`fixed top-4 right-4 max-w-md w-full border rounded-lg p-4 shadow-lg z-50 transform transition-all duration-300 ease-in-out ${colors[alert.type]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={iconColors[alert.type]}>
            {icons[alert.type]}
          </div>
          <p className="text-sm font-medium">{alert.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <MdClose className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Composant de dialogue de confirmation
const ConfirmDialog = ({ dialog, onClose }: { dialog: ConfirmDialog; onClose: () => void }) => {
  if (!dialog.isOpen) return null;

  const handleConfirm = () => {
    dialog.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    dialog.onCancel();
    onClose();
  };

  const typeColors = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    info: 'bg-blue-500 hover:bg-blue-600 text-white'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {dialog.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {dialog.message}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {dialog.cancelText || 'Annuler'}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-lg transition-colors ${typeColors[dialog.type || 'info']}`}
            >
              {dialog.confirmText || 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant de dialogue de saisie
const PromptDialog = ({ dialog, onClose }: { dialog: PromptDialog; onClose: () => void }) => {
  const [value, setValue] = useState('');

  if (!dialog.isOpen) return null;

  const handleConfirm = () => {
    if (value.trim()) {
      dialog.onConfirm(value);
      onClose();
      setValue('');
    }
  };

  const handleCancel = () => {
    dialog.onCancel();
    onClose();
    setValue('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {dialog.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {dialog.message}
          </p>
          <input
            type={dialog.inputType || 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={dialog.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminModerationPanel({ userRole }: AdminModerationPanelProps) {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [promptDialog, setPromptDialog] = useState<PromptDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const showAlert = (type: Alert['type'], message: string, duration: number = 5000) => {
    const id = Date.now().toString();
    const newAlert: Alert = { id, type, message, duration };
    setAlerts(prev => [...prev, newAlert]);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/moderation/reports?status=${filter}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        console.error('Erreur lors du chargement des signalements:', response.status);
        setReports([]);
        showAlert('error', 'Erreur lors du chargement des signalements');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des signalements:', error);
      setReports([]);
      showAlert('error', 'Erreur lors du chargement des signalements');
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, status: string, action?: string) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch(`/api/moderation/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status,
          moderatorAction: action
        })
      });

      if (response.status >= 200 && response.status < 300) {
        await fetchReports();
        showAlert('success', t('moderation.action_success', 'Action effectuée avec succès'));
      } else {
        let errorMessage = t('moderation.action_error', 'Erreur lors de l\'action');
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.warn('Impossible de parser la réponse d\'erreur:', parseError);
        }
        
        showAlert('error', errorMessage);
        // Rafraîchir quand même au cas où l'action aurait fonctionné
        await fetchReports();
      }
    } catch (error) {
      console.error('Erreur lors du traitement du signalement:', error);
      showAlert('error', t('moderation.action_error', 'Erreur lors de l\'action'));
      // Rafraîchir au cas où l'action aurait fonctionné malgré l'erreur
      await fetchReports();
    } finally {
      setIsProcessing(false);
    }
  };

const handleUserAction = async (userId: string, action: 'suspend' | 'ban' | 'unban', reason?: string, duration?: number) => {
    try {
      setIsProcessing(true);
      
      const endpoint = action === 'unban' ? 'unban' : action;
      const body: any = { reason: reason || `Action ${action} par ${userRole}` };
      
      if (duration && action === 'suspend') {
        body.duration = duration;
      }

      console.log(`Envoi de la requête ${endpoint} pour l'utilisateur ${userId}:`, body);

      const response = await fetch(`/api/moderation/users/${userId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      console.log(`Réponse du serveur:`, response.status, response.statusText);

      // Gestion robuste de la réponse
      let responseData;
      let errorMessage = '';

      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const responseText = await response.text();
          if (responseText.trim()) {
            responseData = JSON.parse(responseText);
          } else {
            responseData = { message: 'Action effectuée' };
          }
        } else {
          responseData = { message: 'Action effectuée' };
        }
      } catch (parseError) {
        console.warn('Erreur de parsing JSON:', parseError);
        responseData = { message: 'Action effectuée' };
      }

      // Vérifier le succès basé sur le code de statut
      if (response.status >= 200 && response.status < 300) {
        // Déterminer le message de succès
        let successMessage;
        switch (action) {
          case 'suspend':
            successMessage = duration 
              ? t('moderation.suspend_success_duration', `Utilisateur suspendu pour ${duration} jour(s)`)
              : t('moderation.suspend_success_indefinite', 'Utilisateur suspendu indéfiniment');
            break;
          case 'ban':
            successMessage = t('moderation.ban_success', 'Utilisateur banni avec succès');
            break;
          case 'unban':
            successMessage = t('moderation.unban_success', 'Utilisateur réactivé avec succès');
            break;
          default:
            successMessage = responseData.message || t('moderation.action_success', 'Action effectuée avec succès');
        }

        showAlert('success', successMessage);
        
        // Recharger les signalements pour refléter les changements
        await fetchReports();
        
      } else {
        // Gérer les erreurs
        errorMessage = responseData.message || 
                     responseData.error || 
                     t('moderation.action_error', `Erreur ${response.status}`);
        
        showAlert('error', errorMessage);
        
        // Toujours rafraîchir au cas où l'action aurait partiellement fonctionné
        await fetchReports();
      }
    } catch (error) {
      console.error(`Erreur lors du ${action}:`, error);
      
      // Message d'erreur adaptatif
      let errorMessage;
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = t('moderation.network_error', 'Erreur de connexion au serveur');
      } else {
        errorMessage = t('moderation.action_error', `Erreur lors de l'action: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
      
      showAlert('error', errorMessage);
      
      // Rafraîchir quand même au cas où
      await fetchReports();
    } finally {
      setIsProcessing(false);
    }
  };

  const deletePost = async (postId: string, reason: string) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch(`/api/moderation/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });

      // Accepter les codes 200, 201, 204 comme succès
      if (response.status >= 200 && response.status < 300) {
        showAlert('success', t('moderation.post_deleted', 'Post supprimé avec succès'));
        await fetchReports();
      } else {
        // Essayer de parser l'erreur, sinon message générique
        let errorMessage = t('moderation.action_error', 'Erreur lors de la suppression');
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // Si on ne peut pas parser la réponse, utiliser le message par défaut
          console.warn('Impossible de parser la réponse d\'erreur:', parseError);
        }
        
        showAlert('error', errorMessage);
        
        // Rafraîchir quand même les données au cas où la suppression aurait fonctionné
        await fetchReports();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du post:', error);
      showAlert('error', t('moderation.action_error', 'Erreur lors de la suppression'));
      
      // Rafraîchir les données au cas où la suppression aurait fonctionné malgré l'erreur
      await fetchReports();
    } finally {
      setIsProcessing(false);
    }
  };

  const promptUserAction = (userId: string, action: 'suspend' | 'ban') => {
    setPromptDialog({
      isOpen: true,
      title: t(`moderation.${action}_title`, `${action.charAt(0).toUpperCase() + action.slice(1)} utilisateur`),
      message: t(`moderation.${action}_reason_prompt`, `Raison du ${action}:`),
      placeholder: t(`moderation.${action}_reason_placeholder`, 'Entrez la raison...'),
      onConfirm: (reason) => {
        if (action === 'suspend') {
          setPromptDialog({
            isOpen: true,
            title: t('moderation.suspend_duration_title', 'Durée de suspension'),
            message: t('moderation.suspend_duration_prompt', 'Durée en jours (optionnel):'),
            placeholder: 'Ex: 7',
            inputType: 'number',
            onConfirm: (durationStr) => {
              const duration = durationStr ? parseInt(durationStr) : undefined;
              if (durationStr && isNaN(duration!)) {
                showAlert('error', t('moderation.invalid_duration', 'Durée invalide'));
                return;
              }
              handleUserAction(userId, action, reason, duration);
            },
            onCancel: () => {}
          });
        } else {
          handleUserAction(userId, action, reason);
        }
      },
      onCancel: () => {}
    });
  };

  const promptPostDeletion = (postId: string) => {
    setPromptDialog({
      isOpen: true,
      title: t('moderation.delete_post_title', 'Supprimer le post'),
      message: t('moderation.delete_post_reason_prompt', 'Raison de la suppression:'),
      placeholder: t('moderation.delete_post_reason_placeholder', 'Entrez la raison de la suppression...'),
      onConfirm: (reason) => {
        deletePost(postId, reason);
      },
      onCancel: () => {}
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Alertes */}
      {alerts.map((alert) => (
        <CustomAlert 
          key={alert.id} 
          alert={alert} 
          onClose={() => removeAlert(alert.id)} 
        />
      ))}

      {/* Dialogue de confirmation */}
      <ConfirmDialog 
        dialog={confirmDialog} 
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} 
      />

      {/* Dialogue de saisie */}
      <PromptDialog 
        dialog={promptDialog} 
        onClose={() => setPromptDialog({ ...promptDialog, isOpen: false })} 
      />

      {/* En-tête */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <MdFlag className="text-red-500" />
            {t('moderation.reports_management', 'Gestion des signalements')}
          </h2>
          
          <div className="flex gap-2">
            {['pending', 'reviewed', 'resolved', 'dismissed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t(`moderation.status.${status}`, status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">{t('common.loading', 'Chargement...')}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <MdFlag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('moderation.no_reports', 'Aucun signalement trouvé')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('moderation.no_reports_desc', 'Il n\'y a aucun signalement dans cette catégorie')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <div key={report._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                {/* En-tête du signalement */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-sm font-medium">
                      {t(`report.types.${report.type}`, report.type)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      par @{report.reporter.username}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Raison */}
                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                    {report.reason}
                  </p>
                </div>

                {/* Contenu signalé */}
                {report.post && (
                  <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Post signalé:</h4>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {report.post.content.substring(0, 200)}...
                    </p>
                  </div>
                )}

                {report.reported && (
                  <div className="mb-4 bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Utilisateur signalé:</h4>
                    <p className="text-orange-700 dark:text-orange-300">@{report.reported.username}</p>
                  </div>
                )}

                {/* Actions */}
                {report.status === 'pending' && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleReportAction(report._id, 'reviewed')}
                      disabled={isProcessing}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      Examiner
                    </button>
                    
                    <button
                      onClick={() => handleReportAction(report._id, 'resolved', 'Résolu')}
                      disabled={isProcessing}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      Résoudre
                    </button>
                    
                    <button
                      onClick={() => handleReportAction(report._id, 'dismissed', 'Non fondé')}
                      disabled={isProcessing}
                      className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                      Rejeter
                    </button>

                    {report.post && (
                      <button
                        onClick={() => promptPostDeletion(report.post!._id)}
                        disabled={isProcessing}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        Supprimer post
                      </button>
                    )}
                    
                    {report.reported && (
                      <>
                        <button
                          onClick={() => promptUserAction(report.reported!._id, 'suspend')}
                          disabled={isProcessing}
                          className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
                        >
                          Suspendre
                        </button>
                        
                        <button
                          onClick={() => promptUserAction(report.reported!._id, 'ban')}
                          disabled={isProcessing}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Bannir
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Statut traité */}
                {report.status !== 'pending' && report.moderator && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Traité par @{report.moderator.username}
                      {report.moderatorAction && `: ${report.moderatorAction}`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}