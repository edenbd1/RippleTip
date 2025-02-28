require('dotenv').config();
const mongoose = require('mongoose');

// Fonction pour tester différentes configurations de connexion MongoDB
async function testMongoDBConnection() {
  console.log('Test de connexion MongoDB...');
  console.log('URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':***@')); // Masquer le mot de passe
  
  // Essayer différentes configurations
  const configs = [
    {
      name: "Configuration de base",
      options: {}
    },
    {
      name: "Configuration avec SSL désactivé",
      options: { ssl: false }
    },
    {
      name: "Configuration avec SSL et certificats invalides autorisés",
      options: { ssl: true, tlsAllowInvalidCertificates: true }
    },
    {
      name: "Configuration avec délais d'attente augmentés",
      options: { 
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000
      }
    },
    {
      name: "Configuration avec toutes les options",
      options: {
        ssl: true,
        tlsAllowInvalidCertificates: true,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000
      }
    }
  ];
  
  // Tester chaque configuration
  for (const config of configs) {
    console.log(`\nTest avec ${config.name}...`);
    
    try {
      // Fermer la connexion précédente si elle existe
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      
      // Tenter la connexion avec cette configuration
      await mongoose.connect(process.env.MONGODB_URI, config.options);
      
      console.log(`✅ Connexion réussie avec ${config.name}!`);
      console.log(`État de la connexion: ${mongoose.connection.readyState}`);
      
      // Tester une opération simple
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`Collections disponibles: ${collections.map(c => c.name).join(', ') || 'aucune'}`);
      
      // Fermer la connexion
      await mongoose.connection.close();
      
      // Cette configuration fonctionne, l'enregistrer dans un fichier
      console.log(`\n✅ Configuration qui fonctionne: ${config.name}`);
      console.log('Options:');
      console.log(JSON.stringify(config.options, null, 2));
      
      // Sortir de la boucle car nous avons trouvé une configuration qui fonctionne
      process.exit(0);
    } catch (error) {
      console.error(`❌ Échec avec ${config.name}:`, error.message);
    }
  }
  
  console.log('\n❌ Aucune configuration n\'a fonctionné. Vérifiez votre chaîne de connexion et vos identifiants.');
  process.exit(1);
}

// Exécuter le test
testMongoDBConnection(); 