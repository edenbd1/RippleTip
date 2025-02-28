# RippleTip - Bot Discord pour RLUSD

Un bot Discord qui permet aux utilisateurs de connecter leurs wallets Ethereum et de transférer des tokens RLUSD entre eux.

## Fonctionnalités

- Connexion de wallet Ethereum à un compte Discord
- Transfert de tokens RLUSD entre utilisateurs Discord
- Vérification du solde RLUSD
- Gestion sécurisée des wallets

## Installation

1. Clonez ce dépôt
2. Installez les dépendances avec `npm install`
3. Copiez `.env.example` vers `.env` et remplissez les variables d'environnement
4. Lancez le bot avec `npm start`

## Configuration

Vous devez configurer les variables d'environnement suivantes dans le fichier `.env`:

- `DISCORD_TOKEN`: Token de votre bot Discord
- `ETHEREUM_PROVIDER_URL`: URL du fournisseur Ethereum (Infura, Alchemy, etc.)
- `RLUSD_CONTRACT_ADDRESS`: Adresse du contrat RLUSD
- `MONGODB_URI`: URI de connexion à MongoDB
- `ADMIN_WALLET`: (Optionnel) Adresse du wallet administrateur

## Commandes Discord

- `/connect <adresse_wallet>` - Connecter votre wallet Ethereum
- `/transfer <utilisateur> <montant>` - Transférer des RLUSD à un autre utilisateur
- `/balance` - Vérifier votre solde RLUSD
- `/disconnect` - Déconnecter votre wallet

## Sécurité

- Les clés privées ne sont jamais stockées
- Les utilisateurs doivent signer les transactions avec leur propre wallet
- Vérification des signatures pour authentifier les utilisateurs

## Licence

MIT 