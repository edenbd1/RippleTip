const { ethers } = require('ethers');
const crypto = require('crypto');
const rlusdABI = require('../contracts/rlusdABI.json');

// Initialisation du provider Ethereum
const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_PROVIDER_URL);

// Adresse du contrat RLUSD
const RLUSD_CONTRACT_ADDRESS = process.env.RLUSD_CONTRACT_ADDRESS;

// Initialisation du contrat RLUSD
const rlusdContract = new ethers.Contract(RLUSD_CONTRACT_ADDRESS, rlusdABI, provider);

/**
 * Génère un nonce aléatoire pour la vérification de signature
 * @returns {string} Nonce aléatoire
 */
function generateNonce() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Vérifie si une adresse Ethereum est valide
 * @param {string} address - Adresse Ethereum à vérifier
 * @returns {boolean} True si l'adresse est valide, false sinon
 */
function isValidEthereumAddress(address) {
  return ethers.isAddress(address);
}

/**
 * Récupère le solde RLUSD d'une adresse
 * @param {string} address - Adresse Ethereum
 * @returns {Promise<string>} Solde formaté
 */
async function getBalance(address) {
  try {
    const balance = await rlusdContract.balanceOf(address);
    const decimals = await rlusdContract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Erreur lors de la récupération du solde:', error);
    throw error;
  }
}

/**
 * Vérifie une signature pour authentifier un utilisateur
 * @param {string} message - Message signé (généralement le nonce)
 * @param {string} signature - Signature du message
 * @param {string} address - Adresse Ethereum supposée avoir signé le message
 * @returns {boolean} True si la signature est valide, false sinon
 */
function verifySignature(message, signature, address) {
  try {
    const signerAddress = ethers.verifyMessage(message, signature);
    return signerAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Erreur lors de la vérification de la signature:', error);
    return false;
  }
}

/**
 * Crée un message à signer pour la vérification du wallet
 * @param {string} discordId - ID Discord de l'utilisateur
 * @param {string} nonce - Nonce aléatoire
 * @returns {string} Message à signer
 */
function createSignatureMessage(discordId, nonce) {
  return `Vérification de votre wallet Ethereum pour Discord\n\nID Discord: ${discordId}\nNonce: ${nonce}\n\nEn signant ce message, vous confirmez que vous êtes le propriétaire de ce wallet.`;
}

module.exports = {
  provider,
  rlusdContract,
  generateNonce,
  isValidEthereumAddress,
  getBalance,
  verifySignature,
  createSignatureMessage
}; 