'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MdSearch, MdPerson, MdBlock, MdWarning, MdCheck, MdHistory, MdClose, MdCheckCircle, MdError, MdInfo } from 'react-icons/md';

interface User {
  _id: string;
  username: string;
  email: string;
  name?: string;
  profilePicture?: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  suspensionReason?: string;
  suspendedUntil?: string;
  createdAt: string;
  moderationHistory: any[];
}

interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
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

// Composant d'alerte élégant
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

// Composant de dialogue de saisie
const PromptDialog = ({ dialog, onClose, t }: { dialog: PromptDialog; onClose: () => void; t: any }) => {
  const [value, setValue] = useState('');

  if (!dialog.isOpen) return null;

  const handleConfirm = () => {
    if (value.trim()) {
      dialog.onConfirm(value);
      setValue('');
    }
  };

  const handleCancel = () => {
    dialog.onCancel();
    onClose();
    setValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
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
            onKeyPress={handleKeyPress}
            placeholder={dialog.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!value.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [promptDialog, setPromptDialog] = useState<PromptDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showAlert = (type: Alert['type'], message: string, duration: number = 5000) => {
    const id = Date.now().toString();
    const newAlert: Alert = { id, type, message, duration };
    setAlerts(prev => [...prev, newAlert]);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  useEffect(() => {
    // Vérifier les droits admin
    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/api/users/me', { credentials: 'include' });
        if (response.ok) {
          const user = await response.json();
          if (user.role !== 'admin') {
            router.push('/');
            return;
          }
        } else {
          router.push('/login');
          return;
        }
      } catch (error) {
        router.push('/login');
        return;
      }
    };

    checkAdminAccess();
    fetchUsers();
  }, [router, searchQuery, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Erreur lors du chargement des utilisateurs');
        setUsers([]);
        showAlert('error', t('users.load_error'));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers([]);
      showAlert('error', t('users.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'ban' | 'unban', reason?: string, duration?: number) => {
    try {
      setIsProcessing(true);
      
      const endpoint = action === 'unban' ? 'unban' : action;
      const body: any = { reason: reason || t('users.action_by_admin', `Action ${action} par admin`) };
      
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

      if (response.ok) {
        let responseData;
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const responseText = await response.text();
            console.log('Réponse brute:', responseText);
            
            if (responseText.trim()) {
              responseData = JSON.parse(responseText);
            } else {
              responseData = { message: t('moderation.action_success') };
            }
          } else {
            responseData = { message: t('moderation.action_success') };
          }
        } catch (parseError) {
          console.warn('Erreur de parsing JSON, mais réponse OK:', parseError);
          responseData = { message: t('moderation.action_success') };
        }

        // Déterminer le message de succès
        let successMessage;
        switch (action) {
          case 'suspend':
            successMessage = duration 
              ? t('moderation.suspend_success_duration', { duration })
              : t('moderation.suspend_success_indefinite');
            break;
          case 'ban':
            successMessage = t('moderation.ban_success');
            break;
          case 'unban':
            successMessage = t('moderation.unban_success');
            break;
          default:
            successMessage = responseData.message || t('moderation.action_success');
        }

        showAlert('success', successMessage);
        await fetchUsers();
        
      } else {
        let errorMessage = t('users.action_error', `Erreur ${response.status}`);
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorText = await response.text();
            console.log('Erreur brute:', errorText);
            
            if (errorText.trim()) {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorData.error || errorMessage;
            }
          } else {
            errorMessage = t('users.action_error', `Erreur ${response.status}: ${response.statusText}`);
          }
        } catch (parseError) {
          console.warn('Erreur de parsing de l\'erreur:', parseError);
          errorMessage = t('users.action_error', `Erreur ${response.status}: ${response.statusText}`);
        }
        
        showAlert('error', errorMessage);
      }
    } catch (error) {
      console.error(`Erreur lors du ${action}:`, error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showAlert('error', t('users.server_connection_error'));
      } else {
        showAlert('error', t('users.action_error', `Erreur lors de l'action: ${error instanceof Error ? error.message : t('users.unknown_error')}`));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const promptUserAction = (userId: string, action: 'suspend' | 'ban' | 'unban') => {
    if (action === 'unban') {
      setPromptDialog({
        isOpen: true,
        title: t('users.reactivate_user'),
        message: t('users.reactivation_reason'),
        placeholder: t('users.reactivation_placeholder'),
        onConfirm: (reason) => {
          setPromptDialog(prev => ({ ...prev, isOpen: false }));
          handleUserAction(userId, action, reason || t('users.reactivation_placeholder'));
        },
        onCancel: () => {}
      });
    } else if (action === 'ban') {
      setPromptDialog({
        isOpen: true,
        title: t('users.ban_user'),
        message: t('users.ban_reason'),
        placeholder: t('users.ban_placeholder'),
        onConfirm: (reason) => {
          setPromptDialog(prev => ({ ...prev, isOpen: false }));
          handleUserAction(userId, action, reason);
        },
        onCancel: () => {}
      });
    } else if (action === 'suspend') {
      setPromptDialog({
        isOpen: true,
        title: t('users.suspend_user'),
        message: t('users.suspend_reason'),
        placeholder: t('users.suspend_placeholder'),
        onConfirm: (reason) => {
          setTimeout(() => {
            setPromptDialog({
              isOpen: true,
              title: t('users.suspension_duration'),
              message: t('users.duration_prompt'),
              placeholder: t('users.duration_placeholder'),
              inputType: 'number',
              onConfirm: (durationStr) => {
                let duration: number | undefined;
                
                if (durationStr && durationStr.trim() !== '') {
                  duration = parseInt(durationStr);
                  if (isNaN(duration) || duration <= 0) {
                    showAlert('error', t('users.invalid_duration'));
                    return;
                  }
                }
                
                setPromptDialog(prev => ({ ...prev, isOpen: false }));
                handleUserAction(userId, action, reason, duration);
              },
              onCancel: () => {}
            });
          }, 100);
        },
        onCancel: () => {}
      });
    }
  };

  const getStatusBadge = (user: User) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', icon: '✅', label: t('status.active') },
      suspended: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200', icon: '⏸️', label: t('status.suspended') },
      banned: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', icon: '🚫', label: t('status.banned') }
    };

    const config = statusConfig[user.status] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', icon: '👑', label: t('roles.admin') },
      moderator: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200', icon: '🛡️', label: t('roles.moderator') },
      user: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200', icon: '👤', label: t('roles.user') }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* Alertes */}
      {alerts.map((alert) => (
        <CustomAlert 
          key={alert.id} 
          alert={alert} 
          onClose={() => removeAlert(alert.id)} 
        />
      ))}

      {/* Dialogue de saisie */}
      <PromptDialog 
        dialog={promptDialog} 
        onClose={() => setPromptDialog({ ...promptDialog, isOpen: false })} 
        t={t}
      />

      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <MdPerson className="text-blue-500" />
                {t('users.management')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t('users.management_description')}
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/moderation')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t('users.back_to_reports')}
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('users.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="all">{t('users.status_all')}</option>
                <option value="active">{t('users.status_active')}</option>
                <option value="suspended">{t('users.status_suspended')}</option>
                <option value="banned">{t('users.status_banned')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <MdPerson className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('users.no_users_found')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t('users.no_users_description')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('users.user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('users.email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('users.role')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('users.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('users.registration')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('users.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={user.profilePicture || '/default-avatar.svg'}
                            alt={user.username}
                            className="h-10 w-10 rounded-full"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.name || user.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusBadge(user)}
                          {user.status === 'suspended' && user.suspendedUntil && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {t('users.until')} {new Date(user.suspendedUntil).toLocaleDateString()}
                            </div>
                          )}
                          {user.suspensionReason && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate" title={user.suspensionReason}>
                              {user.suspensionReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {user.role !== 'admin' && user.status !== 'banned' && (
                            <button
                              onClick={() => promptUserAction(user._id, 'suspend')}
                              disabled={isProcessing || user.status === 'suspended'}
                              className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title={t('users.suspend')}
                            >
                              <MdWarning className="w-4 h-4" />
                            </button>
                          )}
                          
                          {user.role !== 'admin' && user.status !== 'banned' && (
                            <button
                              onClick={() => promptUserAction(user._id, 'ban')}
                              disabled={isProcessing}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title={t('users.ban')}
                            >
                              <MdBlock className="w-4 h-4" />
                            </button>
                          )}
                          
                          {(user.status === 'suspended' || user.status === 'banned') && (
                            <button
                              onClick={() => promptUserAction(user._id, 'unban')}
                              disabled={isProcessing}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title={t('users.reactivate')}
                            >
                              <MdCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}