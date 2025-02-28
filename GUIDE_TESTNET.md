# Guide d'utilisation du bot RippleTip sur le testnet

Ce guide vous aidera à configurer et tester le bot RippleTip avec des tokens RLUSD sur le réseau de test Ethereum (Sepolia).

## Prérequis

1. Node.js (v16 ou supérieur)
2. npm ou yarn
3. Un compte Discord et un serveur Discord où vous êtes administrateur
4. Un wallet Ethereum (MetaMask, par exemple)
5. Une base de données MongoDB (locale ou MongoDB Atlas)

## Configuration

### 1. Créer un bot Discord

1. Rendez-vous sur le [Portail des développeurs Discord](https://discord.com/developers/applications)
2. Cliquez sur "New Application" et donnez un nom à votre application
3. Dans la section "Bot", cliquez sur "Add Bot"
4. Copiez le token du bot (vous en aurez besoin pour le fichier .env)
5. Activez les options suivantes:
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT
   - PRESENCE INTENT
6. Dans la section "OAuth2 > URL Generator":
   - Sélectionnez les scopes: `bot` et `applications.commands`
   - Sélectionnez les permissions: `Send Messages`, `Embed Links`, `Read Message History`
   - Copiez l'URL générée et utilisez-la pour inviter le bot sur votre serveur

### 2. Obtenir un accès à Ethereum Testnet

1. Créez un compte sur [Infura](https://infura.io/) ou [Alchemy](https://www.alchemy.com/)
2. Créez un nouveau projet pour le réseau Sepolia
3. Copiez l'URL du point de terminaison (endpoint) pour le fichier .env

### 3. Configurer MongoDB

1. Option locale: Installez MongoDB sur votre machine
2. Option cloud: Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Créez un cluster
   - Créez un utilisateur de base de données
   - Obtenez l'URI de connexion

### 4. Configurer le fichier .env

Copiez le fichier `.env.example` vers `.env` et remplissez les valeurs:

```
# Discord Bot Token
DISCORD_TOKEN=votre_token_discord_ici

# Ethereum Provider URL (Testnet - Sepolia)
ETHEREUM_PROVIDER_URL=https://sepolia.infura.io/v3/votre_cle_infura_ici
# Ou pour Alchemy: https://eth-sepolia.g.alchemy.com/v2/votre_cle_alchemy_ici

# RLUSD Token Contract Address (Testnet)
RLUSD_CONTRACT_ADDRESS=0xe101fb315a64cda9944e570a7bffafe60b994b1d

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/rippletip
# Ou pour MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/rippletip

# Admin Wallet Address (optional)
ADMIN_WALLET=votre_adresse_admin_ici
```

## Installation

1. Installez les dépendances:
   ```
   npm install
   ```

2. Vérifiez la connexion au contrat RLUSD:
   ```
   npm run test-tokens
   ```

3. Démarrez le bot:
   ```
   npm start
   ```

## Obtenir des tokens de test

1. Obtenez des ETH de test sur le réseau Sepolia:
   - Rendez-vous sur [Sepolia Faucet](https://sepoliafaucet.com/)
   - Suivez les instructions pour recevoir des ETH de test

2. Pour les tokens RLUSD de test, vous pouvez:
   - Contacter l'administrateur du contrat pour qu'il vous envoie des tokens
   - Utiliser un faucet spécifique au token s'il en existe un
   - Déployer votre propre contrat de test avec la même ABI

## Utilisation du bot

Une fois le bot en ligne, vous pouvez utiliser les commandes slash suivantes sur votre serveur Discord:

- `/test` - Vérifier la connexion au contrat RLUSD
- `/connect <adresse>` - Connecter votre wallet Ethereum
- `/verify <signature>` - Vérifier la propriété de votre wallet
- `/balance` - Vérifier votre solde RLUSD
- `/transfer <utilisateur> <montant>` - Transférer des RLUSD à un autre utilisateur
- `/disconnect` - Déconnecter votre wallet

### Exemple de flux d'utilisation

1. Utilisez `/connect 0xVotreAdresseEthereum` pour connecter votre wallet
2. Signez le message avec MetaMask ou votre wallet
3. Utilisez `/verify signature_obtenue` pour vérifier votre wallet
4. Utilisez `/balance` pour vérifier votre solde
5. Utilisez `/transfer @utilisateur 10` pour transférer 10 RLUSD à un autre utilisateur

## Dépannage

Si vous rencontrez des problèmes:

1. Vérifiez les logs de la console pour les erreurs
2. Assurez-vous que toutes les variables d'environnement sont correctement configurées
3. Vérifiez que votre bot a les permissions nécessaires sur le serveur Discord
4. Assurez-vous d'avoir des ETH de test sur le réseau Sepolia pour payer les frais de transaction 