const { rlusdContract, provider } = require('./ethereumUtils');
const User = require('../models/User');
const { Client, EmbedBuilder } = require('discord.js');
const { ethers } = require('ethers');
const mongoose = require('mongoose');

/**
 * Initialise l'écouteur d'événements de transfert
 * @param {Client} client - Client Discord
 */
function initTransferListener(client) {
  console.log('Initialisation de l\'écouteur d\'événements de transfert RLUSD...');
  
  // Vérifier si MongoDB est connecté
  const mongoStatus = mongoose.connection.readyState;
  
  if (mongoStatus === 0) {
    console.log('MongoDB non connecté. L\'écouteur de transfert fonctionnera sans persistance des données.');
    setupTransferListener(client, false);
    
    // Essayer de se reconnecter à MongoDB
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connecté après tentative. Réinitialisation de l\'écouteur de transfert avec persistance...');
      setupTransferListener(client, true);
    });
  } else if (mongoStatus === 1) {
    console.log('MongoDB connecté. L\'écouteur de transfert fonctionnera avec persistance des données.');
    setupTransferListener(client, true);
  } else if (mongoStatus === 2) {
    console.log('Connexion MongoDB en cours. Attente avant d\'initialiser l\'écouteur de transfert...');
    mongoose.connection.once('connected', () => {
      console.log('MongoDB connecté. Initialisation de l\'écouteur de transfert avec persistance...');
      setupTransferListener(client, true);
    });
  } else {
    console.log(`État de connexion MongoDB inconnu (${mongoStatus}). L\'écouteur de transfert fonctionnera sans persistance.`);
    setupTransferListener(client, false);
  }
  
  // Gérer les erreurs de connexion
  mongoose.connection.on('error', (err) => {
    console.error('Erreur de connexion MongoDB dans l\'écouteur de transfert:', err.message);
  });
  
  // Gérer les déconnexions
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB déconnecté. L\'écouteur de transfert fonctionnera sans persistance des données.');
  });
}

/**
 * Configure l'écouteur d'événements de transfert
 * @param {Client} client - Client Discord
 * @param {boolean} withMongoDB - Indique si MongoDB est disponible
 */
function setupTransferListener(client, withMongoDB = true) {
  // Écouter les événements Transfer
  rlusdContract.on('Transfer', async (from, to, value, event) => {
    try {
      console.log(`Transfert détecté: ${from} -> ${to}, ${value} RLUSD`);
      
      // Récupérer les détails de la transaction
      const txHash = event.log.transactionHash;
      
      // Convertir la valeur en nombre lisible
      const decimals = await rlusdContract.decimals();
      const formattedValue = ethers.formatUnits(value, decimals);
      
      // Variables pour stocker les informations des utilisateurs
      let fromUser = null;
      let toUser = null;
      
      // Rechercher les utilisateurs correspondants aux adresses si MongoDB est disponible
      if (withMongoDB && mongoose.connection.readyState === 1) {
        try {
          fromUser = await User.findOne({ walletAddress: from.toLowerCase() });
          toUser = await User.findOne({ walletAddress: to.toLowerCase() });
        } catch (dbError) {
          console.error('Erreur lors de la recherche des utilisateurs dans MongoDB:', dbError.message);
        }
      }
      
      // Si les deux utilisateurs sont dans notre base de données, envoyer une notification
      if (fromUser && toUser) {
        // Trouver un canal pour envoyer la notification
        const guilds = client.guilds.cache.values();
        for (const guild of guilds) {
          // Chercher un canal approprié (par exemple, un canal nommé "transactions")
          const channel = guild.channels.cache.find(ch => 
            ch.name.includes('transaction') || ch.name.includes('transfert') || 
            ch.name.includes('bot') || ch.name.includes('général') || ch.name.includes('general')
          );
          
          if (channel && channel.isTextBased()) {
            try {
              // Créer un embed pour la notification
              const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('💸 Transfert RLUSD')
                .setDescription(`Un transfert de RLUSD a été effectué entre deux membres du serveur.`)
                .addFields(
                  { name: 'De', value: `<@${fromUser.discordId}> (${from})` },
                  { name: 'À', value: `<@${toUser.discordId}> (${to})` },
                  { name: 'Montant', value: `${formattedValue} RLUSD` },
                  { name: 'Transaction', value: `[Voir sur Etherscan](https://sepolia.etherscan.io/tx/${txHash})` }
                )
                .setTimestamp();
              
              // Envoyer la notification
              await channel.send({ embeds: [embed] });
              
              // Envoyer également un message privé aux utilisateurs concernés
              try {
                const fromDiscordUser = await client.users.fetch(fromUser.discordId);
                const toDiscordUser = await client.users.fetch(toUser.discordId);
                
                // Message à l'expéditeur
                const fromEmbed = new EmbedBuilder()
                  .setColor(0xFF0000)
                  .setTitle('💸 Transfert RLUSD envoyé')
                  .setDescription(`Vous avez envoyé des RLUSD à ${toUser.username}.`)
                  .addFields(
                    { name: 'À', value: `${toUser.username} (${to})` },
                    { name: 'Montant', value: `${formattedValue} RLUSD` },
                    { name: 'Transaction', value: `[Voir sur Etherscan](https://sepolia.etherscan.io/tx/${txHash})` }
                  )
                  .setTimestamp();
                
                await fromDiscordUser.send({ embeds: [fromEmbed] }).catch(err => 
                  console.log(`Impossible d'envoyer un message à l'utilisateur ${fromUser.username}: ${err.message}`)
                );
                
                // Message au destinataire
                const toEmbed = new EmbedBuilder()
                  .setColor(0x00FF00)
                  .setTitle('💰 Transfert RLUSD reçu')
                  .setDescription(`Vous avez reçu des RLUSD de ${fromUser.username}.`)
                  .addFields(
                    { name: 'De', value: `${fromUser.username} (${from})` },
                    { name: 'Montant', value: `${formattedValue} RLUSD` },
                    { name: 'Transaction', value: `[Voir sur Etherscan](https://sepolia.etherscan.io/tx/${txHash})` }
                  )
                  .setTimestamp();
                
                await toDiscordUser.send({ embeds: [toEmbed] }).catch(err => 
                  console.log(`Impossible d'envoyer un message à l'utilisateur ${toUser.username}: ${err.message}`)
                );
              } catch (dmError) {
                console.error('Erreur lors de l\'envoi des messages privés:', dmError.message);
              }
              
              // Sortir de la boucle une fois qu'une notification a été envoyée
              break;
            } catch (channelError) {
              console.error(`Erreur lors de l'envoi dans le canal ${channel.name}:`, channelError.message);
            }
          }
        }
      } else {
        console.log('Transfert détecté mais les utilisateurs ne sont pas dans notre base de données ou MongoDB n\'est pas disponible.');
      }
    } catch (error) {
      console.error('Erreur lors du traitement de l\'événement de transfert:', error.message);
    }
  });
  
  console.log('Écouteur d\'événements de transfert RLUSD initialisé avec succès.');
}

module.exports = { initTransferListener }; 