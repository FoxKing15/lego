
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Utilisation de l'importation dynamique de JSON dans un module ES


const MONGODB_URI = 'mongodb+srv://embourassin:kpndsUEIL9ThR0UH@cluster0.huob4.mongodb.net/<DATABASE>';
const MONGODB_DB_NAME='lego';


export async function deleteAllCollections() {

 let client; 

  try {
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    await client.connect();
    console.log("✅ Connecté à la base de données.");
    const db =  client.db(MONGODB_DB_NAME);

    // Liste toutes les collections
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log("📂 Aucune collection à supprimer.");
      return;
    }

    console.log("📂 Collections à supprimer :", collections.map((c) => c.name));

    // Supprime toutes les collections
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`❌ Collection supprimée : ${collection.name}`);
    }

    console.log("✅ Toutes les collections ont été supprimées.");
  } catch (err) {
    console.error("Erreur :", err);
  } finally {
    await client.close();
    console.log("🔒 Connexion fermée.");
  }
}




export async function main(data,name){
    
    let client;

    try{
        client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
        console.log('Connected to MongoDB ! ');
        const db =  client.db(MONGODB_DB_NAME);
        const collection = db.collection(name);
        const result= await collection.insertMany(data);
      

    }catch (err){
        console.error('Error connecting to MongoDB or inserting deals:',err);
    }finally{
        if(client){
            await client.close();
        }
    } 
}


async function main2(){
    
    let client;

    try{
        client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
        console.log('Connected to MongoDB ! ');
        const db =  client.db(MONGODB_DB_NAME);
        const collection = db.collection('sales');

        const folderPath = path.join('D:/ESILV/A5/FullStack/lego/server/results');
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const legoSetId = path.basename(file, '.json'); // Extrait l'id de chaque fichier (e.g., 'lego_123')

            // Insérer les données dans MongoDB
            const result = await collection.insertOne({
                id: legoSetId,       // Utilisez l'id du fichier JSON comme clé
                data: jsonData         // Les données du fichier JSON
            });

            console.log(`Inserted document with id: ${legoSetId}`);
        }
       
    }catch (err){
        console.error('Error  inserting Json files into MongoDB',err);
    }finally{
        await client.close();
    }
}

//Method 1
async function findBestDiscountDeals(){
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');
    const bestDeals = await collection.find({discount: {$lt: -50}}).toArray();
    console.log('Best Discount Deals:', bestDeals);
    await client.close();
}

//Method 2
async function mostCommentedDeals(){
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');
    const mostCommented = await collection.find({comments: {$gt: 15}}).toArray();
    console.log('Most Commented Deals:', mostCommented);
    await client.close();
}

//Method 3
async function sortedByPriceAsc(){
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');
    const sortedPrice = await collection.find({}).sort({price:1}).toArray();
    console.log('Deals Sorted By Ascending Price:', sortedPrice);
    await client.close();
}

//Method 3b
async function sortedByPriceDesc(){
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');
    const sortedPrice = await collection.find({}).sort({price: -1}).toArray();
    console.log('Deals Sorted By Descending Price:', sortedPrice);
    await client.close();
}

//Method 4
async function sortedByDateAsc(){
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');
    const sortedDate = await collection.find({}).sort({published: 1}).toArray();
    console.log('Deals Sorted By Ascending Date:',sortedDate);
    await client.close();
}

//Method 4b
async function sortedByDateDesc(){
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');
    const sortedDate = await collection.find({}).sort({published: -1}).toArray();
    console.log('Deals Sorted By Descending Date:', sortedDate);
    await client.close();
}

//Method 5
async function salesForLegoId(legoId){
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME);
    const collection = db.collection('sales');
    const sales = await collection.find({}).toArray();
    const legoIdSales = sales
        .filter(sale => sale.data.some(item => item.legoid === parseInt(legoId)))  
        .map(sale => sale.data.filter(item => item.legoid === parseInt(legoId)));  
    console.log(`Sales for Lego ${legoId}:`, legoIdSales);
    await client.close();
}

//Method 6
// async function salesLessThan3WeeksOld() {
//     client = await MongoClient.connect(MONGODB_URI,{'useNewUrlParser': true});
//    const db = client.db(MONGODB_DB_NAME);
//     const collection = db.collection('sales');

//     const threeWeeksAgo = Math.floor(Date.now() / 1000) - (3 * 7 * 24 * 60 * 60);
        
//     // Requête pour récupérer les ventes récentes
//     const sales = await collection.find({}).toArray();
//     const legoIdSales = sales
//             .filter(sale => sale.data.some(item => item.publication >= threeWeeksAgo));
            
    
  
//     console.log(legoIdSales);
//     // Fermer la connexion
//     await client.close();
// }

//main().catch(console.error);
//main2().catch(console.error);
//findBestDiscountDeals();
//mostCommentedDeals();
//sortedByPriceAsc();
//sortedByPriceDesc();
//sortedByDateAsc();
//sortedByDateDesc();
//salesForLegoId('21061');
//salesLessThan3WeeksOld();

