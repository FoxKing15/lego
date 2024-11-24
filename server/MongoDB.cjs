const { MongoClient } = require('mongodb');
const deals = require('./ParseDealabs.json');
const fs = require('fs');
const path = require('path');


const MONGODB_URI = 'mongodb+srv://embourassin:kpndsUEIL9ThR0UH@cluster0.huob4.mongodb.net/<DATABASE>';
const MONGODB_DB_NAME='lego';

async function main(){
    
    let client;

    try{
        client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
        console.log('Connected to MongoDB ! ');
        const db =  client.db(MONGODB_DB_NAME);
        
        if(!deals || deals.length === 0 ){
            console.log('No deals to insert.');
            return;
        }

        
        
        const collection = db.collection('deals');
        const result= await collection.insertMany(deals);
        console.log(`Inserted ${result.insertedCount} deals into the database`);
        console.log('Inserted IDs :', result.insertedIds);

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
    process.exit()
}

//Method 2
async function mostCommentedDeals(){
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');
    const bestDeals = await collection.find({comments: {$gt: 15}}).toArray();
    console.log('Most Commented Deals:', bestDeals);
    process.exit()
}

//Method 3
async function sortedByPriceAsc(){
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');
    const bestDeals = await collection.find({}).sort({price:1}).toArray();
    console.log('Most Commented Deals:', bestDeals);
    process.exit()
}

//Method 3b
async function sortedByPriceDesc(){
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');
    const bestDeals = await collection.find({}).sort({price: -1}).toArray();
    console.log('Most Commented Deals:', bestDeals);
    process.exit()
}

//findBestDiscountDeals();
//mostCommentedDeals();
//sortedByPriceAsc();
sortedByPriceDesc();