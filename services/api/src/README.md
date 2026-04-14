# WillChain API
## Description

The API contains the backend layer of WillChain, enabling secure data access and manipulation for wills, contacts, notifications, and blockchain interactions.

## Installation	
```
cd services/api
npm install
```

## Configuration	
### Environment Variables
#### Environment For PINAX
NODE_ENV=development

#### Server
PORT=4000
HOSTNAME=0.0.0.0

#### Database
POSTGRES_HOST=dpg-d72h8l3uibrs73fm0d70-a
POSTGRES_PORT=5432
POSTGRES_USER=willchain_user
POSTGRES_PASSWORD=
POSTGRES_DB=willchain_dev
DATABASE_URL=

#### Logging
LOG_LEVEL=debug

#### API Configuration
API_URL=http://localhost:4000 en local et https://willchain-api-dev.onrender.com for deployment

#### Allow all origins for shared development
CORS_ORIGIN=*

#### Auth/JWT
JWT_SECRET=
JWT_EXPIRES_IN=15m

#### WebSocket
WEBSOCKET_PORT=4001
WEBSOCKET_CORS_ORIGIN=*

#### web urls
WEB_URL=https://willchain-dev.vercel.app/

#### Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=notifications@noreply.willchain.live

#### Blockchain
RPC_URL=
CHAIN_ID=11155111

#### Substreams
MANIFEST=/app/spkg/willchain-events-v0.1.0.spkg
SUBSTREAMS_URL=https://sepolia.substreams.pinax.network:443
SUBSTREAMS_API_KEY=
SUBSTREAMS_MODULE=map_events_calls
WILL_FACTORY_ADDRESS=0x05a61f96958b8c2b8decbc33b5676b6b780dcc28
BLOCK_DEPLOYED=10585804

### Configuration Docker
Le projet utilise Docker Compose pour l'environnement de développement. Les variables ci-dessus sont chargées automatiquement.

### Commandes
npm install:   Installer les dépendances
npm run dev:   Mode développement avec hot reload
npm run build: Compilation TypeScript → JavaScript
npm start:	   Mode production
npm run lint:  Vérification du code
Important: En environnement Docker, on utilise plutôt la commande à la racine du projet plutôt que les commandes individuelles.



### Build et Démarrage
#### Avec Docker Compose (recommandé)	
###### Build tous les conteneurs, à faire à la racine du dossier (digital-will/)
docker compose -f docker-compose.local.yml up --build -d

###### Arrêter les conteneurs
docker compose -f docker-compose.local.yml down

###### Arrêter et supprimer les volumes (utile après modification de la DB)
docker compose -f docker-compose.local.yml down -v

#### Sans Docker Compose
```
cd services/api
npm run dev
```

## Structure	
````bash
services/api/
├── prisma/             # Schéma de base de données et migrations
├── src/
│   ├── controllers/    # Gère les requêtes HTTP et les réponses
│   ├── services/       # Contient la logique métier
│   ├── routes/         # Définit les endpoints API (documentation Swagger incluse)
│   ├── middlewares/    # Authentification, validation des données
│   ├── utils/          # Fonctions utilitaires (crypto, erreurs, constantes)
│   ├── config/         # Configuration de l'application
│   └── substreams/     # Documentation Substreams (voir README dans le dossier)
└── package.json
