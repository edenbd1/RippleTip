require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Fonction pour rafraîchir les commandes
async function refreshCommands() {
  try {
    console.log('Début du rafraîchissement des commandes slash...');
    
    // Vérifier les variables d'environnement nécessaires
    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN non défini dans le fichier .env');
    }
    
    if (!process.env.DISCORD_APPLICATION_ID) {
      throw new Error('DISCORD_APPLICATION_ID non défini dans le fichier .env');
    }
    
    // Créer un tableau pour stocker les commandes
    const commands = [];
    
    // Lire les fichiers de commandes
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    // Charger chaque commande
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`Commande chargée: ${command.data.name}`);
      } else {
        console.log(`[AVERTISSEMENT] La commande à ${filePath} manque de propriétés requises.`);
      }
    }
    
    // Créer une instance REST pour envoyer les commandes à Discord
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    // Enregistrer les commandes
    console.log(`Tentative d'enregistrement de ${commands.length} commandes slash...`);
    
    // Enregistrer les commandes globalement (pour tous les serveurs)
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
      { body: commands },
    );
    
    console.log(`✅ ${data.length} commandes slash enregistrées avec succès!`);
    
  } catch (error) {
    console.error('Erreur lors du rafraîchissement des commandes:', error);
  }
}

// Exécuter la fonction
refreshCommands(); 