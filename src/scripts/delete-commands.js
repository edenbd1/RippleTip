require('dotenv').config();
const { REST, Routes } = require('discord.js');

// Fonction pour supprimer toutes les commandes
async function deleteAllCommands() {
  try {
    console.log('Début de la suppression des commandes slash...');
    
    // Vérifier les variables d'environnement nécessaires
    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN non défini dans le fichier .env');
    }
    
    if (!process.env.DISCORD_APPLICATION_ID) {
      throw new Error('DISCORD_APPLICATION_ID non défini dans le fichier .env');
    }
    
    // Créer une instance REST pour envoyer les commandes à Discord
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    // Supprimer toutes les commandes globales
    console.log('Suppression de toutes les commandes slash globales...');
    
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
      { body: [] },
    );
    
    console.log('✅ Toutes les commandes slash ont été supprimées avec succès!');
    console.log('Pour réenregistrer les commandes, exécutez: npm run refresh-commands');
    
  } catch (error) {
    console.error('Erreur lors de la suppression des commandes:', error);
  }
}

// Exécuter la fonction
deleteAllCommands(); 