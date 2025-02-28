const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer;

// Fonction pour se connecter à MongoDB
async function connectToDatabase() {
  try {
    // Désactiver les avertissements de dépréciation
    mongoose.set('strictQuery', false);
    
    console.log('Tentative de connexion à MongoDB...');
    
    // Options de connexion
    const options = {
      serverSelectionTimeoutMS: 5000, // Réduire le délai d'attente pour échouer plus rapidement
    };
    
    try {
      // Tentative de connexion à la base de données configurée
      await mongoose.connect(process.env.MONGODB_URI, options);
      console.log('Connecté à MongoDB avec succès!');
      return true;
    } catch (error) {
      console.error('Erreur de connexion à MongoDB:', error.message);
      console.log("Tentative de démarrage d'une base de données en mémoire...");
      
      // Démarrer une base de données MongoDB en mémoire
      mongoMemoryServer = await MongoMemoryServer.create();
      const mongoUri = mongoMemoryServer.getUri();
      
      console.log(`Base de données en mémoire démarrée à l'adresse: ${mongoUri}`);
      
      // Connexion à la base de données en mémoire
      await mongoose.connect(mongoUri);
      console.log('Connecté à la base de données en mémoire avec succès!');
      
      return true;
    }
  } catch (error) {
    console.error('Erreur fatale lors de la connexion à MongoDB:', error.message);
    return false;
  }
}

// Vérifier l'état de la connexion
function isConnected() {
  return mongoose.connection.readyState === 1;
}

// Fermer la connexion et arrêter le serveur en mémoire si nécessaire
async function closeConnection() {
  await mongoose.connection.close();
  
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    console.log('Serveur MongoDB en mémoire arrêté');
  }
  
  console.log('Connexion MongoDB fermée');
}

module.exports = {
  connectToDatabase,
  isConnected,
  closeConnection
}; 