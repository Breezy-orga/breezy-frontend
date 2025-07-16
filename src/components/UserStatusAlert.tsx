'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdWarning, MdBlock, MdSchedule, MdInfo, MdClose } from 'react-icons/md';

interface UserStatus {
  status: 'active' | 'suspended' | 'banned';
  suspendedUntil?: string;
  suspensionReason?: string;
}

export default function UserStatusAlert() {
  const { t } = useTranslation();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(false);

  useEffect(() => {
    // Ne pas exécuter sur la page /banned pour éviter la boucle infinie
    if (typeof window !== 'undefined' && window.location.pathname === '/banned') {
      console.log('UserStatusAlert désactivé sur la page /banned');
      return;
    }

    const checkUserStatus = async () => {
      try {
        const response = await fetch('/api/users/me', { credentials: 'include' });
        if (response.ok) {
          const user = await response.json();
          
          // Afficher les données de l'utilisateur
          console.log('UserStatusAlert - Données utilisateur:', {
            status: user.status,
            suspendedUntil: user.suspendedUntil,
            suspensionReason: user.suspensionReason,
            currentPath: window.location.pathname
          });
          
          // Si l'utilisateur est banni, redirection automatique (sauf si déjà sur /banned)
          if (user.status === 'banned' && window.location.pathname !== '/banned') {
            console.log('Utilisateur banni - Redirection vers /banned...');
            setIsAutoRedirecting(true);
            setTimeout(() => {
              window.location.href = '/banned';
            }, 2000);
            return;
          }
          
          // Si suspendu ou autre statut non actif, afficher l'alerte
          if (user.status !== 'active' && user.status !== 'banned') {
            console.log('Utilisateur avec statut non-actif:', user.status);
            setUserStatus({
              status: user.status,
              suspendedUntil: user.suspendedUntil,
              suspensionReason: user.suspensionReason
            });
            
            // Vérifier si déjà dismissé pour cette session
            const dismissKey = `status_alert_dismissed_${user.status}_${user.suspendedUntil || 'permanent'}`;
            const wasDismissed = sessionStorage.getItem(dismissKey);
            
            if (!wasDismissed) {
              console.log('Affichage de l\'alerte de statut');
              setShow(true);
            } else {
              console.log('Alerte déjà dismissée pour cette session');
            }
          } else {
            console.log('Utilisateur actif - pas d\'alerte');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
      }
    };

    checkUserStatus();
    
    // Vérification périodique du statut (seulement si pas sur /banned)
    const interval = setInterval(checkUserStatus, 60000); // Toutes les minutes
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    if (userStatus) {
      const dismissKey = `status_alert_dismissed_${userStatus.status}_${userStatus.suspendedUntil || 'permanent'}`;
      sessionStorage.setItem(dismissKey, 'true');
    }
    setShow(false);
    setDismissed(true);
  };

  // Redirection automatique pour bannissement
  if (isAutoRedirecting) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 text-center">
          <MdBlock className="text-red-500 text-6xl mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('user_status.account_banned', 'Compte banni')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('user_status.redirecting', 'Redirection en cours...')}
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!show || !userStatus || userStatus.status === 'active' || dismissed) {
    return null;
  }

  const isBanned = userStatus.status === 'banned';
  const isSuspended = userStatus.status === 'suspended';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (dateString: string) => {
    const now = new Date();
    const end = new Date(dateString);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return t('user_status.days_remaining', `${days} jour(s) restant(s)`, { count: days });
    } else if (hours > 0) {
      return t('user_status.hours_remaining', `${hours} heure(s) restante(s)`, { count: hours });
    } else {
      return t('user_status.less_than_hour', 'Moins d\'une heure');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 ${
        isBanned ? 'border-l-4 border-red-500' : 'border-l-4 border-orange-500'
      }`}>
        
        {/* Header avec bouton de fermeture */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isBanned ? (
              <MdBlock className="text-red-500 text-3xl" />
            ) : (
              <MdWarning className="text-orange-500 text-3xl" />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isBanned 
                  ? t('user_status.account_banned', 'Compte banni')
                  : t('user_status.account_suspended', 'Compte suspendu')
                }
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isBanned 
                  ? t('user_status.banned_subtitle', 'Votre accès a été révoqué définitivement')
                  : t('user_status.suspended_subtitle', 'Accès temporairement restreint')
                }
              </p>
            </div>
          </div>
          
          {/* Bouton fermeture seulement pour suspension */}
          {isSuspended && (
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title={t('common.dismiss', 'Fermer')}
            >
              <MdClose className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Raison */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <MdInfo className="w-4 h-4" />
            {t('user_status.reason', 'Raison')}:
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {userStatus.suspensionReason || t('user_status.no_reason', 'Aucune raison spécifiée')}
          </p>
        </div>

        {/* Détails de la suspension */}
        {isSuspended && userStatus.suspendedUntil && (
          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MdSchedule className="text-orange-500" />
              <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                {t('user_status.suspension_details', 'Détails de la suspension')}
              </h3>
            </div>
            <div className="space-y-2">
              <p className="text-orange-700 dark:text-orange-300">
                <span className="font-medium">{t('user_status.suspension_expires', 'Expire le')}: </span>
                {formatDate(userStatus.suspendedUntil)}
              </p>
              {getTimeRemaining(userStatus.suspendedUntil) && (
                <p className="text-orange-600 dark:text-orange-400 font-medium">
                  {getTimeRemaining(userStatus.suspendedUntil)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bannissement permanent */}
        {isBanned && (
          <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              ⚠️ {t('user_status.permanent_restriction', 'Restriction permanente')}
            </h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• {t('user_status.account_permanently_disabled', 'Compte définitivement désactivé')}</li>
              <li>• {t('user_status.no_new_account', 'Création de  comptes interdite')}</li>
              <li>• {t('user_status.appeal_only', 'Révision possible uniquement par appel')}</li>
            </ul>
          </div>
        )}

        {/* Ce que vous pouvez faire */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            {t('user_status.what_you_can_do', 'Ce que vous pouvez faire')}:
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• {t('user_status.can_browse', 'Consulter les contenus existants')}</li>
            <li>• {t('user_status.can_view_profile', 'Accéder à votre profil')}</li>
            <li className="text-red-600 dark:text-red-400 font-medium">
              • {t('user_status.cannot_create', 'Vous ne pouvez pas créer de nouveau contenu')}
            </li>
            {isSuspended && (
              <li className="text-green-600 dark:text-green-400 font-medium">
                • {t('user_status.suspension_temporary', 'Cette restriction est temporaire')}
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isSuspended ? (
            <button
              onClick={handleDismiss}
              className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              {t('user_status.understand', 'J\'ai compris')}
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/banned'}
              className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              {t('user_status.view_details', 'Voir les détails')}
            </button>
          )}
          
          <a
            href="mailto:support@votre-app.com?subject=Contestation de sanction"
            className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-center"
          >
            {t('user_status.contact_support', 'Contacter le support')}
          </a>
        </div>

        {/* Note en bas */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          {isBanned 
            ? t('user_status.ban_note', 'Les tentatives de contournement sont surveillées et peuvent entraîner des poursuites.')
            : t('user_status.suspension_note', 'Votre accès sera automatiquement rétabli à l\'expiration de la suspension.')
          }
        </p>
      </div>
    </div>
  );
}

// Composant d'indicateur de statut pour les profils
export interface UserStatusBadgeProps {
  status: 'active' | 'suspended' | 'banned';
  suspendedUntil?: string;
  suspensionReason?: string;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

export function UserStatusBadge({ 
  status, 
  suspendedUntil, 
  suspensionReason, 
  size = 'medium',
  showDetails = false 
}: UserStatusBadgeProps) {
  const { t } = useTranslation();

  if (status === 'active') return null;

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const statusConfig = {
    suspended: {
      label: t('user_status.suspended', 'Suspendu'),
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
      icon: '⏸️'
    },
    banned: {
      label: t('user_status.banned', 'Banni'),
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-300 dark:border-red-700',
      icon: '🚫'
    }
  };

  const config = statusConfig[status];
  if (!config) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
      
      {showDetails && status === 'suspended' && suspendedUntil && (
        <span className="text-xs opacity-75">
          ({t('user_status.until_short', 'jusqu\'au')} {formatDate(suspendedUntil)})
        </span>
      )}
    </div>
  );
}

// Composant de banner d'avertissement pour les pages
export interface UserStatusBannerProps {
  status: 'active' | 'suspended' | 'banned';
  suspendedUntil?: string;
  suspensionReason?: string;
  onDismiss?: () => void;
  className?: string;
}

export function UserStatusBanner({ 
  status, 
  suspendedUntil, 
  suspensionReason, 
  onDismiss,
  className = '' 
}: UserStatusBannerProps) {
  const { t } = useTranslation();

  if (status === 'active') return null;

  const statusConfig = {
    suspended: {
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      icon: '⏸️',
      title: t('user_status.suspended', 'Suspendu')
    },
    banned: {
      bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
      textColor: 'text-red-800 dark:text-red-200',
      icon: '🚫',
      title: t('user_status.banned', 'Banni')
    }
  };

  const config = statusConfig[status];
  if (!config) return null;

  return (
    <div className={`border-l-4 p-4 ${config.bgColor} ${config.textColor} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-xl">{config.icon}</span>
          <div className="flex-1">
            <h3 className="font-semibold">{config.title}</h3>
            {suspensionReason && (
              <p className="text-sm mt-1 opacity-90">{suspensionReason}</p>
            )}
            {status === 'suspended' && suspendedUntil && (
              <p className="text-sm mt-1 font-medium">
                {t('user_status.expires_on', 'Expire le')}: {new Date(suspendedUntil).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>
        
        {onDismiss && status === 'suspended' && (
          <button
            onClick={onDismiss}
            className="text-current hover:opacity-70 transition-opacity"
            title={t('common.dismiss', 'Fermer')}
          >
            <MdClose className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}