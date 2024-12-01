const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const {MongoClient, ObjectId} = require('mongodb');

const PORT = 8092;
const app = express();

const MONGODB_URI = 'mongodb+srv://embourassin:kpndsUEIL9ThR0UH@cluster0.huob4.mongodb.net/<DATABASE>';
const MONGODB_DB_NAME='lego';

async function getDBClient(){
  const client = await MongoClient.connect(MONGODB_URI);
  return client;
}

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

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

  // Validation des paramètres numériques
  const parsedMinPrice = parseFloat(minPrice);
  const parsedMaxPrice = parseFloat(maxPrice);
  const parsedMinDate = parseInt(minDate, 10);
  const parsedMaxDate = parseInt(maxDate, 10);
  const parsedComments = parseInt(comments, 10);
  const parsedLimit = parseInt(limit, 10);

  // Filtrage par titre (insensible à la casse)
  if (title) {
    query.title = new RegExp(title, 'i');
  }

  // Filtrage par plage de prix
  if (!isNaN(parsedMinPrice)) {
    query.price = { ...query.price, $gte: parsedMinPrice };
  }
  if (!isNaN(parsedMaxPrice)) {
    query.price = { ...query.price, $lte: parsedMaxPrice };
  }

  // Filtrage par plage de dates
  if (!isNaN(parsedMinDate)) {
    query.published = { ...query.published, $gte: parsedMinDate };
  }
  if (!isNaN(parsedMaxDate)) {
    query.published = { ...query.published, $lte: parsedMaxDate };
  }

  // Filtrage par nombre minimum de commentaires
  if (!isNaN(parsedComments)) {
    query.comments = { $gte: parsedComments };
  }

  // Tri basé sur le paramètre filterBy
  if (filterBy === 'best-discount') {
    sort.discount = -1;
  } else if (filterBy === 'most-commented') {
    sort.comments = -1;
  } else if (filterBy === 'highest-price') {
    sort.price = -1;
  } else if (filterBy === 'lowest-price') {
    sort.price = 1;
  } else if (filterBy === 'newest') {
    sort.published = -1;
  }

  let client;
  try {
    client = await getDBClient();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    // Récupérer les deals avec filtres, tri, et limite
    const deals = await collection
      .find(query)
      .sort(sort)
      .limit(parsedLimit || 12)
      .toArray();

    if (deals.length === 0) {
      return res.status(404).json({ message: 'Aucun deal trouvé avec ces critères' });
    }

    res.json(deals);
  } catch (err) {
    console.error('Erreur lors de la recherche de deals:', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  } finally {
    if (client) {
      await client.close();
    }
  }
});




app.get('/deals/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID invalide' });
  }

  let client;
  try {
    client = await getDBClient();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    // Trouver le deal par son ID
    const deal = await collection.findOne({ _id: new ObjectId(id) });

    if (!deal) {
      return res.status(404).json({ message: 'Deal non trouvé' });
    }

    res.json(deal);
  } catch (err) {
    console.error('Erreur lors de la récupération du deal:', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  } finally {
    if (client) {
      await client.close();
    }
  }
});



app.get('/search', async (req, res) => {
  const {
    legoSetId,
    limit = 12,
    minPrice,
    maxPrice,
    minDate,
    maxDate,
    filterBy,
  } = req.query;

  // Validation de legoSetId
  if (!legoSetId) {
    return res.status(400).json({ message: "Le paramètre 'legoSetId' est requis pour effectuer une recherche." });
  }

  let query = {};

  // Filtrage par plage de prix
  if (minPrice) {
    query.price = { ...query.price, $gte: parseFloat(minPrice) };
  }
  if (maxPrice) {
    query.price = { ...query.price, $lte: parseFloat(maxPrice) };
  }

  // Filtrage par période de publication
  if (minDate) {
    query.publication = { ...query.publication, $gte: parseInt(minDate, 10) };
  }
  if (maxDate) {
    query.publication = { ...query.publication, $lte: parseInt(maxDate, 10) };
  }

  // Définition du tri en fonction de filterBy
  let sort = {};
  switch (filterBy) {
    case 'lowest-price':
      sort.price = 1; // Tri par prix croissant
      break;
    case 'highest-price':
      sort.price = -1; // Tri par prix décroissant
      break;
    case 'newest':
      sort.publication = -1; // Tri par date de publication décroissante
      break;
    case 'oldest':
      sort.publication = 1; // Tri par date de publication croissante
      break;
    case 'most-commented':
      sort.comments = -1; // Tri par nombre de commentaires décroissant
      break;
    default:
      // Aucun tri spécifique
      break;
  }

  let client;
  try {
    client = await getDBClient();
    const db = client.db(MONGODB_DB_NAME);

    // Accès à la collection spécifique basée sur legoSetId
    const collectionName = `${legoSetId}`;
    const collection = db.collection(collectionName);

    // Récupération des ventes avec filtres, tri, et limite
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
    res.status(500).json({ message: 'Erreur interne du serveur' });
  } finally {
    if (client) {
      await client.close();
    }
  }
});



app.listen(PORT,() => {
  console.log(`📡 Running on port ${PORT}`);
});


