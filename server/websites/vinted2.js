import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import { MongoClient } from 'mongodb';
import { main } from './MongoDB.js';

const MONGODB_URI = 'mongodb+srv://embourassin:kpndsUEIL9ThR0UH@cluster0.huob4.mongodb.net/<DATABASE>';
const MONGODB_DB_NAME='lego';
const COLLECTION_NAME = "deals";             // Remplacez par le nom de votre collection

async function getCookies() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto("https://www.vinted.fr", { waitUntil: 'networkidle2' });

    const cookies = await page.cookies();
    const cookieString = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

    await browser.close();
    return cookieString;
}

async function fetchData(url, cookieString) {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json, text/plain, */*",
            Cookie: cookieString,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://www.vinted.fr/",
            "Connection": "keep-alive",
            "Cache-Control": "no-cache",
        },
    });

    if (response.ok) {
        return response.json();
    } else {
        console.error(`Erreur de fetch : ${response.statusText}`);
        if (response.status === 429) {
            console.log("Too many requests - Retrying after delay...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            return fetchData(url, cookieString);
        }
        return null;
    }
}

async function parseAndSaveLegoData(legoId, cookieString) {
    let currentPage = 1;
    let allResults = [];

    while (true) {
        const url = `https://www.vinted.fr/api/v2/catalog/items?page=${currentPage}&per_page=96&search_text=${legoId}&catalog_ids=&size_ids=&brand_ids=89162&status_ids=&material_ids=`;
        console.log(`Scraping LEGO ID ${legoId}, page ${currentPage}...`);
        const responseBody = await fetchData(url, cookieString);

        if (!responseBody || !responseBody.items || responseBody.items.length === 0) {
            console.log(`No items found for LEGO ID ${legoId} on page ${currentPage}.`);
            break;
        }

        const scrapingDate = Math.floor(Date.now() / 1000);
        const items = responseBody.items.map((item) => ({
            legoid: legoId,
            id: item.id,
            title: item.title,
            price: item.total_item_price.amount,
            imgURL: item.photo.url,
            itemURL: item.url,
            publication: item.photo.high_resolution.timestamp,
            scraping_data: scrapingDate,
        }));

        allResults.push(...items);

        const hasMore = responseBody.pagination?.has_more || responseBody.items.length === 96;
        if (!hasMore) break;

        currentPage++;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (allResults.length > 0) {
        console.log(`Saving data for LEGO ID ${legoId}...`);
        await main(allResults,`${legoId}`);
    }
}

async function getLegoIdsFromMongoDB() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const database = client.db(MONGODB_DB_NAME);
        const collection = database.collection(COLLECTION_NAME);

        // Récupère les `legoId` depuis la collection
        const legoIds = await collection.find({}, { projection: { legoId: 1, _id: 0 } }).toArray();
        return legoIds.map(doc => doc.legoId);
    } catch (error) {
        console.error("Erreur lors de la connexion à MongoDB :", error);
        return [];
    } finally {
        await client.close();
    }
}

export async function scrape() {
    const legoIds = await getLegoIdsFromMongoDB();
    if (legoIds.length === 0) {
        console.log("Aucun LEGO ID trouvé dans la base de données.");
        return;
    }

    const cookieString = await getCookies();

    const batchSize = 3;
    let batchIndex = 0;

    while (batchIndex * batchSize < legoIds.length) {
        const batch = legoIds.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);

        const scrapingTasks = batch.map(async (legoId) => {
            if (legoId === 0) {
                console.log("Skipping LEGO ID 0.");
                return;
            }
            await parseAndSaveLegoData(legoId, cookieString);
        });

        await Promise.all(scrapingTasks);
        console.log(`Finished scraping batch ${batchIndex + 1}`);
        batchIndex++;
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("Scraping completed.");
}

export async function sandboxV() {
    try {
        console.log("🚗⚡  je suis rapide !!");
        await scrape();
        console.log('done');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

sandboxV();
