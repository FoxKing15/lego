const express = require('express');
const {MongoClient, ObjectId} = require('mongodb');
const dotenv = require('dotenv');

const PORT = 8092;
const app = express();
dotenv.config();

const MONGODB_URI = `mongodb+srv://embourassin:${process.env.SECRET_KEY}@cluster0.huob4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const MONGODB_DB_NAME='lego';

async function getDBClient() {
  const client = await MongoClient.connect(MONGODB_URI);
  return client;
}

app.use(express.json()); // Middleware pour analyser les requêtes JSON

// Route : Recherche de deals avec filtres
app.get('/deals/search', async (req, res) => {
  const {
    title,
    minPrice,
    maxPrice,
    minDate,
    maxDate,
    comments,
    limit = 12,
    filterBy
  } = req.query;

  const query = {};
  const sort = {};

  // Filtrage par titre
  if (title) {
    query.title = new RegExp(title, 'i');
  }

  // Filtrage par prix
  if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
  if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };

  // Filtrage par date de publication
  if (minDate) query.published = { ...query.published, $gte: parseInt(minDate, 10) };
  if (maxDate) query.published = { ...query.published, $lte: parseInt(maxDate, 10) };

  // Filtrage par nombre de commentaires
  if (comments) query.comments = { $gte: parseInt(comments, 10) };

  // Tri basé sur filterBy
  if (filterBy === 'best-discount') sort.discount = -1;
  if (filterBy === 'most-commented') sort.comments = -1;
  if (filterBy === 'highest-price') sort.price = -1;
  if (filterBy === 'lowest-price') sort.price = 1;
  if (filterBy === 'newest') sort.published = -1;

  let client;
  try {
    client = await getDBClient();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    const deals = await collection
      .find(query)
      .sort(sort)
      .limit(parseInt(limit, 10))
      .toArray();

    if (deals.length === 0) {
      return res.status(404).json({ message: 'Aucun deal trouvé avec ces critères.' });
    }

    res.json(deals);
  } catch (err) {
    console.error('Erreur lors de la recherche de deals:', err);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  } finally {
    if (client) await client.close();
  }
});

// Route : Récupération d'un deal par son ID
app.get('/deals/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID invalide.' });
  }

  let client;
  try {
    client = await getDBClient();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    const deal = await collection.findOne({ _id: new ObjectId(id) });

    if (!deal) {
      return res.status(404).json({ message: 'Deal non trouvé.' });
    }

    res.json(deal);
  } catch (err) {
    console.error('Erreur lors de la récupération du deal:', err);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  } finally {
    if (client) await client.close();
  }
});

// Route : Recherche spécifique à un jeu Lego
app.get('/search', async (req, res) => {
  const {
    legoSetId,
    limit = 12,
    minPrice,
    maxPrice,
    minDate,
    maxDate,
    filterBy
  } = req.query;

  if (!legoSetId) {
    return res.status(400).json({ message: "Le paramètre 'legoSetId' est requis pour effectuer une recherche." });
  }

  const query = {};
  const sort = {};

  if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
  if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };

  if (minDate) query.publication = { ...query.publication, $gte: parseInt(minDate, 10) };
  if (maxDate) query.publication = { ...query.publication, $lte: parseInt(maxDate, 10) };

  if (filterBy === 'lowest-price') sort.price = 1;
  if (filterBy === 'highest-price') sort.price = -1;
  if (filterBy === 'newest') sort.publication = -1;
  if (filterBy === 'oldest') sort.publication = 1;
  if (filterBy === 'most-commented') sort.comments = -1;

  let client;
  try {
    client = await getDBClient();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection(`${legoSetId}`);

    const sales = await collection
      .find(query)
      .sort(sort)
      .limit(parseInt(limit, 10))
      .toArray();

    if (sales.length === 0) {
      return res.status(404).json({ message: 'Aucune vente trouvée avec ces critères.' });
    }

    res.json(sales);
  } catch (err) {
    console.error('Erreur lors de la recherche des ventes:', err);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  } finally {
    if (client) await client.close();
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`📡 Serveur en cours d'exécution sur le port ${PORT}`);
});