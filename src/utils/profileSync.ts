interface UserData {
  _id: string;
  username: string;
  name?: string;
  profilePicture?: string;
  avatar?: string;
  bio?: string;
  following?: string[];
  followers?: string[];
  [key: string]: any;
}

export const ProfileSync = {
  // Émettre une mise à jour
  emitUpdate: (userData: UserData) => {
    console.log('ProfileSync: Émission mise à jour', userData);
   
    if (typeof window !== 'undefined') {
      localStorage.setItem('profileUpdate', JSON.stringify({
        userData,
        timestamp: Date.now()
      }));
      
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: userData
      }));
    }
  },

  // Écouter les mises à jour
  onUpdate: (callback: (userData: UserData) => void) => {
    if (typeof window === 'undefined') return () => {};

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profileUpdate' && e.newValue) {
        const data = JSON.parse(e.newValue);
        callback(data.userData);
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<UserData>;
      callback(customEvent.detail);
    };

    // Écouter les deux événements
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleCustomEvent);

    // Retourner la fonction de nettoyage
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleCustomEvent);
    };
  }
};

// Garder aussi l'ancienne classe pour compatibilité
export class ProfileSyncManager {
  private static instance: ProfileSyncManager;
  private eventTarget: EventTarget;

  private constructor() {
    this.eventTarget = new EventTarget();
  }

  static getInstance(): ProfileSyncManager {
    if (!ProfileSyncManager.instance) {
      ProfileSyncManager.instance = new ProfileSyncManager();
    }
    return ProfileSyncManager.instance;
  }

  emitProfileUpdate(userData: UserData): void {
    ProfileSync.emitUpdate(userData);
  }

  onProfileUpdate(callback: (userData: UserData) => void): () => void {
    return ProfileSync.onUpdate(callback);
  }
}