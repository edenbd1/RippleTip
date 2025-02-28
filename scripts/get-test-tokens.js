require('dotenv').config();
const { ethers } = require('ethers');
const rlusdABI = require('../src/contracts/rlusdABI.json');

// Ce script montre comment interagir avec le contrat RLUSD sur le testnet
// Il ne peut pas vous donner directement des tokens, mais vous explique comment en obtenir

async function main() {
  try {
    // Initialisation du provider
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_PROVIDER_URL);
    
    // Vérifier la connexion
    const network = await provider.getNetwork();
    console.log(`Connecté au réseau: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Initialisation du contrat RLUSD
    const rlusdContract = new ethers.Contract(
      process.env.RLUSD_CONTRACT_ADDRESS,
      rlusdABI,
      provider
    );
    
    // Obtenir des informations sur le token
    const name = await rlusdContract.name();
    const symbol = await rlusdContract.symbol();
    const decimals = await rlusdContract.decimals();
    
    console.log(`Token: ${name} (${symbol})`);
    console.log(`Adresse du contrat: ${process.env.RLUSD_CONTRACT_ADDRESS}`);
    console.log(`Décimales: ${decimals}`);
    
    // Instructions pour obtenir des tokens de test
    console.log('\n=== Comment obtenir des tokens RLUSD de test ===');
    console.log('1. Assurez-vous d\'avoir des ETH de test sur le réseau Sepolia');
    console.log('   - Vous pouvez en obtenir sur https://sepoliafaucet.com/');
    console.log('2. Pour les tokens RLUSD de test, vous pouvez:');
    console.log('   - Contacter l\'administrateur du contrat pour qu\'il vous envoie des tokens');
    console.log('   - Utiliser un faucet spécifique au token s\'il en existe un');
    console.log('   - Déployer votre propre contrat de test avec la même ABI');
    
    // Vérifier si l'utilisateur a déjà des tokens
    if (process.env.ADMIN_WALLET) {
      const balance = await rlusdContract.balanceOf(process.env.ADMIN_WALLET);
      const formattedBalance = ethers.formatUnits(balance, decimals);
      console.log(`\nSolde actuel de ${process.env.ADMIN_WALLET}: ${formattedBalance} ${symbol}`);
    } else {
      console.log('\nAjoutez votre adresse de wallet dans le fichier .env pour vérifier votre solde');
    }
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

main(); 