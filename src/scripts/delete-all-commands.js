require('dotenv').config();
const { REST, Routes } = require('discord.js');

// ID du serveur Discord
const GUILD_ID = '1344829703592083597';

async function deleteAllCommands() {
  try {
    // Vérifier les variables d'environnement nécessaires
    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN non défini dans le fichier .env');
    }
    
    if (!process.env.DISCORD_APPLICATION_ID) {
      throw new Error('DISCORD_APPLICATION_ID non défini dans le fichier .env');
    }
    
    // Créer une instance REST
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    console.log('Suppression de toutes les commandes slash globales...');
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
      { body: [] }
    );
    console.log('✅ Toutes les commandes slash globales ont été supprimées avec succès!');
    
    console.log(`Suppression de toutes les commandes slash du serveur ${GUILD_ID}...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, GUILD_ID),
      { body: [] }
    );
    console.log(`✅ Toutes les commandes slash du serveur ont été supprimées avec succès!`);
    
    console.log('Pour réenregistrer les commandes, exécutez: npm run register-guild');
    
  } catch (error) {
    console.error('Erreur lors de la suppression des commandes:', error);
  }
}

// Exécuter la fonction
deleteAllCommands(); 