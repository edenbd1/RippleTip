require('dotenv').config();
const { ethers } = require('ethers');
const RLUSD_ABI = require('../abis/RLUSD.json');

async function testTokenContract() {
  try {
    console.log('Test de connexion au contrat RLUSD...');
    
    // Vérifier les variables d'environnement
    if (!process.env.ETHEREUM_PROVIDER_URL) {
      throw new Error('ETHEREUM_PROVIDER_URL non défini dans le fichier .env');
    }
    
    if (!process.env.RLUSD_CONTRACT_ADDRESS) {
      throw new Error('RLUSD_CONTRACT_ADDRESS non défini dans le fichier .env');
    }
    
    // Connexion au fournisseur Ethereum
    console.log(`Connexion au fournisseur: ${process.env.ETHEREUM_PROVIDER_URL}`);
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_PROVIDER_URL);
    
    // Vérifier la connexion au réseau
    const network = await provider.getNetwork();
    console.log(`Connecté au réseau: ${network.name} (chainId: ${network.chainId})`);
    
    // Connexion au contrat RLUSD
    console.log(`Connexion au contrat RLUSD: ${process.env.RLUSD_CONTRACT_ADDRESS}`);
    const rlusdContract = new ethers.Contract(
      process.env.RLUSD_CONTRACT_ADDRESS,
      RLUSD_ABI,
      provider
    );
    
    // Récupérer les informations du contrat
    const name = await rlusdContract.name();
    const symbol = await rlusdContract.symbol();
    const decimals = await rlusdContract.decimals();
    const totalSupply = await rlusdContract.totalSupply();
    
    console.log('\nInformations sur le contrat RLUSD:');
    console.log(`Nom: ${name}`);
    console.log(`Symbole: ${symbol}`);
    console.log(`Décimales: ${decimals}`);
    console.log(`Offre totale: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
    
    // Vérifier le solde de l'administrateur si défini
    if (process.env.ADMIN_WALLET) {
      console.log(`\nVérification du solde pour l'adresse: ${process.env.ADMIN_WALLET}`);
      const balance = await rlusdContract.balanceOf(process.env.ADMIN_WALLET);
      console.log(`Solde: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
    }
    
    console.log('\n✅ Test réussi! La connexion au contrat RLUSD fonctionne correctement.');
  } catch (error) {
    console.error('\n❌ Erreur lors du test du contrat RLUSD:');
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le test
testTokenContract(); 