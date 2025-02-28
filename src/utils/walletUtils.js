const { ethers } = require('ethers');
const { rlusdContract, provider } = require('./ethereumUtils');

/**
 * Génère un portefeuille Ethereum aléatoire
 * @returns {Object} Un objet contenant l'adresse et la clé privée du portefeuille
 */
function generateRandomWallet() {
  // Créer un portefeuille aléatoire
  const wallet = ethers.Wallet.createRandom();
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}

/**
 * Vérifie le solde RLUSD réel d'un portefeuille sur la blockchain
 * @param {string} address - L'adresse du portefeuille à vérifier
 * @returns {Promise<string>} - Le solde RLUSD formaté
 */
async function checkRealBalance(address) {
  try {
    const balance = await rlusdContract.balanceOf(address);
    const decimals = await rlusdContract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Erreur lors de la vérification du solde réel:', error);
    throw error;
  }
}

/**
 * Vérifie le solde ETH d'un portefeuille sur la blockchain
 * @param {string} address - L'adresse du portefeuille à vérifier
 * @returns {Promise<string>} - Le solde ETH formaté
 */
async function checkEthBalance(address) {
  try {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Erreur lors de la vérification du solde ETH:', error);
    throw error;
  }
}

/**
 * Effectue un transfert réel de RLUSD sur la blockchain
 * @param {string} privateKey - La clé privée du portefeuille expéditeur
 * @param {string} toAddress - L'adresse du portefeuille destinataire
 * @param {string|number} amount - Le montant de RLUSD à envoyer
 * @returns {Promise<Object>} - Les détails de la transaction
 */
async function transferRLUSD(privateKey, toAddress, amount) {
  try {
    console.log('transferRLUSD called with amount:', amount, 'type:', typeof amount);
    
    // Créer un wallet avec la clé privée
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('Wallet address:', wallet.address);
    
    // Vérifier le solde ETH pour les frais de transaction
    const ethBalance = await provider.getBalance(wallet.address);
    console.log('ETH balance:', ethers.formatEther(ethBalance));
    
    // Vérifier si le solde ETH est égal à zéro
    if (ethBalance.toString() === '0') {
      return {
        success: false,
        error: "Vous n'avez pas de Sepolia ETH pour payer les frais de transaction. Veuillez obtenir des ETH de test avant d'effectuer un transfert.",
        code: "NO_ETH"
      };
    }
    
    // Connecter le contrat RLUSD avec le wallet
    const rlusdWithSigner = rlusdContract.connect(wallet);
    
    // Obtenir le nombre de décimales du token
    const decimals = await rlusdContract.decimals();
    console.log('Token decimals:', decimals);
    
    // Nettoyer et valider le montant
    let amountStr = amount.toString().trim();
    
    // Vérifier si le montant est un nombre valide
    if (isNaN(parseFloat(amountStr)) || !isFinite(parseFloat(amountStr))) {
      return {
        success: false,
        error: "Le montant n'est pas un nombre valide.",
        code: "INVALID_AMOUNT"
      };
    }
    
    console.log('Amount string for parseUnits:', amountStr);
    
    try {
      // Convertir le montant en unités avec les décimales
      const amountToSend = ethers.parseUnits(amountStr, decimals);
      console.log('Amount to send (in wei):', amountToSend.toString());
      
      // Vérifier le solde RLUSD
      const balance = await rlusdContract.balanceOf(wallet.address);
      console.log('RLUSD balance:', ethers.formatUnits(balance, decimals));
      
      // Comparer les BigInt correctement
      if (balance < amountToSend) {
        return {
          success: false,
          error: "Solde RLUSD insuffisant pour effectuer ce transfert.",
          code: "INSUFFICIENT_RLUSD"
        };
      }
      
      // Estimer le gas nécessaire pour la transaction
      console.log('Estimating gas...');
      const gasEstimate = await rlusdWithSigner.transfer.estimateGas(toAddress, amountToSend).catch(error => {
        console.error('Erreur lors de l\'estimation du gas:', error);
        throw error;
      });
      console.log('Gas estimate:', gasEstimate.toString());
      
      // Calculer la limite de gas avec une marge de 20%
      // Convertir en BigInt pour éviter les erreurs de mélange de types
      const gasLimit = BigInt(Math.ceil(Number(gasEstimate) * 1.2));
      console.log('Gas limit with 20% margin:', gasLimit.toString());
      
      // Envoyer la transaction
      console.log('Sending transaction...');
      const tx = await rlusdWithSigner.transfer(toAddress, amountToSend, {
        gasLimit: gasLimit
      });
      console.log('Transaction sent:', tx.hash);
      
      // Attendre la confirmation de la transaction
      console.log('Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        link: `https://sepolia.etherscan.io/tx/${receipt.hash}`
      };
    } catch (parseError) {
      console.error('Erreur lors du parsing du montant:', parseError);
      return {
        success: false,
        error: "Erreur de conversion numérique. Assurez-vous que le montant est valide.",
        code: "PARSE_ERROR",
        details: parseError.message
      };
    }
  } catch (error) {
    console.error('Erreur lors du transfert de RLUSD:', error);
    
    // Analyser l'erreur pour donner un message plus précis
    let errorMessage = error.message || "Erreur inconnue";
    let errorCode = "UNKNOWN_ERROR";
    
    if (errorMessage.includes("insufficient funds")) {
      errorCode = "INSUFFICIENT_FUNDS";
    } else if (errorMessage.includes("user rejected")) {
      errorCode = "USER_REJECTED";
    } else if (errorMessage.includes("gas required exceeds allowance")) {
      errorCode = "GAS_LIMIT_EXCEEDED";
    } else if (errorMessage.includes("nonce")) {
      errorCode = "NONCE_ERROR";
    } else if (errorMessage.includes("BigInt")) {
      errorCode = "BIGINT_ERROR";
      errorMessage = "Erreur de conversion numérique. Assurez-vous que le montant est valide.";
    }
    
    return {
      success: false,
      error: errorMessage,
      code: errorCode,
      originalError: error.toString()
    };
  }
}

/**
 * Génère un lien pour préfinancer un portefeuille
 * @param {string} address - L'adresse du portefeuille à préfinancer
 * @returns {string} - Le lien pour préfinancer le portefeuille
 */
function generateFundingLink(address) {
  return `https://sepolia.etherscan.io/address/${address}`;
}

module.exports = {
  generateRandomWallet,
  checkRealBalance,
  checkEthBalance,
  transferRLUSD,
  generateFundingLink
}; 