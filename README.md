# Breezy Infrastructure

Ce dépôt contient la configuration Docker pour le projet Breezy.

## Structure du projet

```
breezy-infra/
├── docker-compose.yml    # Configuration Docker Compose
├── scripts/
│   └── setup.ps1        # Script de configuration pour Windows
└── README.md
```

## Prérequis

- Docker Desktop pour Windows
- Docker Compose
- PowerShell

## Installation

1. Clonez ce dépôt :
```bash
git clone https://github.com/Breezy-orga/Breezy-Infra.git
cd breezy-infra
```

2. Exécutez le script de configuration :
```powershell
.\scripts\setup.ps1
```

## Services

Le projet comprend les services suivants :

- **Frontend** : Application React (http://localhost:3000)
- **Backend** : API Node.js (http://localhost:5000)
- **MongoDB** : Base de données (port 27017)

## Scripts

- `setup.ps1` : Script PowerShell pour configurer l'environnement de développement

## Contribution

1. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
2. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
3. Poussez vers la branche (`git push origin feature/AmazingFeature`)
4. Ouvrez une Pull Request
