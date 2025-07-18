'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MdBlock, MdSchedule, MdHome, MdWarning, MdInfo, MdHistory, MdAccessTime } from 'react-icons/md';

interface BanInfo {
  reason?: string;
  bannedAt?: string;
  suspendedUntil?: string;
  moderator?: string;
  status?: 'banned' | 'suspended';
  suspensionDuration?: number;
}

interface ModerationHistory {
  action: string;
  reason: string;
  date: string;
  moderator: string;
}

export default function BannedPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [banInfo, setBanInfo] = useState<BanInfo>({});
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [moderationHistory, setModerationHistory] = useState<ModerationHistory[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Calculer le temps restant pour une suspension
  const calculateTimeRemaining = (suspendedUntil: string) => {
    const now = new Date().getTime();
    const endTime = new Date(suspendedUntil).getTime();
    const difference = endTime - now;

    if (difference <= 0) {
      return 'Suspension expirée';
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} jour${days > 1 ? 's' : ''}, ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  useEffect(() => {
    const checkBanStatus = async () => {
      try {
        const response = await fetch('/api/users/me', { credentials: 'include' });
        
        if (response.ok) {
          const user = await response.json();
          
          // Si l'utilisateur n'est ni banni ni suspendu, rediriger
          if (user.status !== 'banned' && user.status !== 'suspended') {
            router.push('/');
            return;
          }

          // Vérifier si la suspension est expirée
          if (user.status === 'suspended' && user.suspendedUntil) {
            const now = new Date();
            const suspensionEnd = new Date(user.suspendedUntil);
            
            if (now >= suspensionEnd) {
              // La suspension est expirée, rediriger vers l'accueil
              router.push('/');
              return;
            }
          }

          setBanInfo({
            reason: user.suspensionReason,
            bannedAt: user.updatedAt,
            suspendedUntil: user.suspendedUntil,
            moderator: user.moderatorName,
            status: user.status,
            suspensionDuration: user.suspensionDuration
          });

          // Récupérer l'historique de modération si possible
          try {
            const historyResponse = await fetch('/api/moderation/my-history', { 
              credentials: 'include' 
            });
            if (historyResponse.ok) {
              const historyData = await historyResponse.json();
              setModerationHistory(historyData.history || []);
            }
          } catch (historyError) {
            console.log('Historique non disponible');
          }

        } else if (response.status === 403) {
          // Utilisateur banni/suspendu
          const errorData = await response.json().catch(() => ({}));
          setBanInfo({
            reason: errorData.reason || t('banned_page.no_reason'),
            bannedAt: new Date().toISOString(),
            status: errorData.status || 'banned'
          });
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkBanStatus();
  }, [router, t]);

  // Mettre à jour le temps restant pour les suspensions
  useEffect(() => {
    if (banInfo.status === 'suspended' && banInfo.suspendedUntil) {
      const updateTimer = () => {
        const remaining = calculateTimeRemaining(banInfo.suspendedUntil!);
        setTimeRemaining(remaining);
        
        // Si la suspension est expirée, rediriger
        if (remaining === 'Suspension expirée') {
          router.push('/');
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Mettre à jour chaque minute

      return () => clearInterval(interval);
    }
  }, [banInfo.suspendedUntil, banInfo.status, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      window.location.href = '/login';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSuspended = banInfo.status === 'suspended';
  const isBanned = banInfo.status === 'banned';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 dark:from-gray-900 dark:to-red-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      isSuspended 
        ? 'from-orange-50 to-gray-100 dark:from-gray-900 dark:to-orange-950' 
        : 'from-red-50 to-gray-100 dark:from-gray-900 dark:to-red-950'
    } flex items-center justify-center p-4`}>
      <div className={`max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-l-4 ${
        isSuspended ? 'border-orange-500' : 'border-red-500'
      } overflow-hidden`}>
        
        {/* Header */}
        <div className={`${isSuspended ? 'bg-orange-500' : 'bg-red-500'} text-white p-6`}>
          <div className="flex items-center gap-4">
            {isSuspended ? (
              <MdSchedule className="text-4xl animate-pulse" />
            ) : (
              <MdBlock className="text-4xl animate-pulse" />
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {isSuspended 
                  ? t('suspended_page.title')
                  : t('banned_page.title')
                }
              </h1>
              <p className={`${isSuspended ? 'text-orange-100' : 'text-red-100'} mt-1`}>
                {isSuspended
                  ? t('suspended_page.subtitle')
                  : t('banned_page.subtitle')
                }
              </p>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-6 space-y-6">
          
          {/* Temps restant pour suspension */}
          {isSuspended && banInfo.suspendedUntil && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
                <MdAccessTime className="w-5 h-5" />
                {t('suspended_page.time_remaining')}
              </h3>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {timeRemaining}
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {t('suspended_page.suspension_ends')} {formatDate(banInfo.suspendedUntil)}
              </p>
            </div>
          )}

          {/* Informations du bannissement/suspension */}
          <div className={`${
            isSuspended 
              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          } rounded-lg p-4 border`}>
            <h3 className={`font-semibold ${
              isSuspended 
                ? 'text-orange-800 dark:text-orange-200' 
                : 'text-red-800 dark:text-red-200'
            } mb-3 flex items-center gap-2`}>
              <MdInfo className="w-5 h-5" />
              {isSuspended 
                ? t('suspended_page.reason_title')
                : t('banned_page.reason_title')
              }
            </h3>
            <p className={`${
              isSuspended 
                ? 'text-orange-700 dark:text-orange-300' 
                : 'text-red-700 dark:text-red-300'
            } mb-3`}>
              {banInfo.reason || t('user_status.no_reason')}
            </p>
            {banInfo.bannedAt && (
              <p className={`text-sm ${
                isSuspended 
                  ? 'text-orange-600 dark:text-orange-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {isSuspended 
                  ? t('suspended_page.suspended_on')
                  : t('banned_page.banned_on')
                } {formatDate(banInfo.bannedAt)}
              </p>
            )}
            {banInfo.moderator && (
              <p className={`text-sm ${
                isSuspended 
                  ? 'text-orange-600 dark:text-orange-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                Par : {banInfo.moderator}
              </p>
            )}
            {isSuspended && banInfo.suspensionDuration && (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Durée : {banInfo.suspensionDuration} jour{banInfo.suspensionDuration > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Conditions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
              <MdWarning className="w-5 h-5" />
              {isSuspended 
                ? t('suspended_page.suspension_conditions')
                : t('banned_page.ban_conditions')
              }
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
              {isSuspended ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{t('suspended_page.temporary_access_revoked')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{t('suspended_page.automatic_restoration')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{t('suspended_page.no_circumvention')}</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{t('banned_page.permanent_revocation', 'Accès permanent révoqué')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{t('banned_page.no_new_accounts', 'Création de  comptes interdite')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{t('banned_page.legal_consequences', 'Contournement passible de sanctions légales')}</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Historique de modération */}
          {moderationHistory.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <MdHistory className="w-5 h-5" />
                  Historique de modération
                </h3>
                <span className="text-gray-500">
                  {showHistory ? '−' : '+'}
                </span>
              </button>
              
              {showHistory && (
                <div className="mt-4 space-y-2">
                  {moderationHistory.map((entry, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded p-3 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {entry.action}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        {entry.reason}
                      </p>
                      {entry.moderator && (
                        <p className="text-xs text-gray-500">
                          Par : {entry.moderator}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message d'information pour suspension */}
          {isSuspended && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                {t('suspended_page.info_title', 'Information importante')}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('suspended_page.info_message', 'Votre compte sera automatiquement réactivé à la fin de la période de suspension. Vous pourrez alors vous reconnecter normalement.')}
              </p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              <MdHome className="w-4 h-4" />
              {t('banned_page.logout_button', 'Se déconnecter')}
            </button>
          </div>

          {/* Avertissement légal */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-1 pt-4 border-t border-gray-200 dark:border-gray-700">
            {isSuspended ? (
              <>
                <p>{t('suspended_page.automatic_reactivation', 'Réactivation automatique à la fin de la période.')}</p>
                <p>{t('suspended_page.monitoring_notice', 'Les tentatives de contournement sont surveillées.')}</p>
              </>
            ) : (
              <>
                <p>{t('banned_page.decision_review', 'Cette décision est définitive.')}</p>
                <p>{t('banned_page.monitoring_notice', 'Les tentatives de contournement sont surveillées.')}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}