const {MongoClient, ObjectId} = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');


const PORT = 8092;
const app = express();

const MONGODB_URI = `mongodb+srv://embourassin:${process.env.SECRET_KEY}@cluster0.huob4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const MONGODB_DB_NAME='lego';

async function getDBClient(){
  const client = await MongoClient.connect(MONGODB_URI);
  return client;
}

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());
app.get('/', (request, response) => {
  response.send({ 'ack': true });
});

app.get('/deals', async (req, res) => {
  const { size = 10, page = 1 } = req.query;

  const parsedSize = parseInt(size, 10);
  const parsedPage = Math.max(1, parseInt(page, 10)) - 1; // Page convertie en base 0
  const offset = parsedPage * parsedSize; // Calcul de l'offset

  let client;
  try {
    client = await getDBClient();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    const deals = await collection
      .find()
      .skip(offset)
      .limit(parsedSize)
      .toArray();

    const total = await collection.countDocuments();
    const totalPages = Math.ceil(total / parsedSize);

    res.json({
      meta: {
        total,
        page: parsedPage + 1,
        size: parsedSize,
        totalPages,
      },
      deals,
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des deals:', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

app.get('/deals/search', async (req, res) => {
  const { title, minPrice, maxPrice, minDate, maxDate, comments, size = 12, page = 1, filterBy } = req.query;

  const query = {};
  const sort = {};

  const parsedMinPrice = parseFloat(minPrice);
  const parsedMaxPrice = parseFloat(maxPrice);
  const parsedMinDate = parseInt(minDate, 10);
  const parsedMaxDate = parseInt(maxDate, 10);
  const parsedComments = parseInt(comments, 10);
  const parsedSize = parseInt(size, 10);
  const parsedPage = Math.max(1, parseInt(page, 10)) - 1;

  if (title) query.title = new RegExp(title, 'i');
  if (!isNaN(parsedMinPrice)) query.price = { ...query.price, $gte: parsedMinPrice };
  if (!isNaN(parsedMaxPrice)) query.price = { ...query.price, $lte: parsedMaxPrice };
  if (!isNaN(parsedMinDate)) query.published = { ...query.published, $gte: parsedMinDate };
  if (!isNaN(parsedMaxDate)) query.published = { ...query.published, $lte: parsedMaxDate };
  if (!isNaN(parsedComments)) query.comments = { $gte: parsedComments };

  if (filterBy === 'best-discount') sort.discount = -1;
  if (filterBy === 'most-commented') sort.comments = -1;
  if (filterBy === 'highest-price') sort.price = -1;
  if (filterBy === 'lowest-price') sort.price = 1;
  if (filterBy === 'newest') sort.published = -1;

  const offset = parsedPage * parsedSize;

  let client;
  try {
    client = await getDBClient();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    const deals = await collection
      .find(query)
      .sort(sort)
      .skip(offset)
      .limit(parsedSize)
      .toArray();

    const total = await collection.countDocuments(query);
    const totalPages = Math.ceil(total / parsedSize);

    res.json({
      meta: {
        total,
        page: parsedPage + 1,
        size: parsedSize,
        totalPages,
      },
      deals,
    });
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



app.get('/sales/search', async (req, res) => {
  const { legoSetId, size = 12, page = 1, minPrice, maxPrice, minDate, maxDate, filterBy } = req.query;

  if (!legoSetId) {
    return res.status(400).json({ message: "Le paramètre 'legoSetId' est requis pour effectuer une recherche." });
  }

  const parsedSize = parseInt(size, 10);
  const parsedPage = Math.max(1, parseInt(page, 10)) - 1;
  const offset = parsedPage * parsedSize;

  const query = {};
  if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
  if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
  if (minDate) query.publication = { ...query.publication, $gte: parseInt(minDate, 10) };
  if (maxDate) query.publication = { ...query.publication, $lte: parseInt(maxDate, 10) };

  const sort = {};
  if (filterBy === 'lowest-price') sort.price = 1;
  if (filterBy === 'highest-price') sort.price = -1;
  if (filterBy === 'newest') sort.publication = -1;
  if (filterBy === 'oldest') sort.publication = 1;
  if (filterBy === 'most-commented') sort.comments = -1;

  let client;
  try {
    client = await getDBClient();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection(legoSetId);

    const sales = await collection
      .find(query)
      .sort(sort)
      .skip(offset)
      .limit(parsedSize)
      .toArray();

    const total = await collection.countDocuments(query);
    const totalPages = Math.ceil(total / parsedSize);

    res.json({
      meta: {
        total,
        page: parsedPage + 1,
        size: parsedSize,
        totalPages,
      },
      sales,
    });
  } catch (err) {
    console.error('Erreur lors de la recherche des ventes:', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  } finally {
    if (client) {
      await client.close();
    }
  }
});
module.exports = app;