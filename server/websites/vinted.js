import puppeteer from 'puppeteer';
import fs from 'fs/promises';
async function fetchWithPuppeteer(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Perform login or session setup here if necessary
    await page.goto("https://www.vinted.fr", { waitUntil: 'networkidle2' });

    // Now that you're logged in, go to the API endpoint
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Get cookies
    const cookies = await page.cookies();
    const cookieString = cookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");

    // Perform the fetch using the cookie string (outside of Puppeteer context)
    const response = await page.evaluate(async (cookieString, url) => {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json, text/plain, */*",
                Cookie: cookieString,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Cache-Control": "max-age=0",
            },
        });
        
        // Check if the response is JSON and return it
        if (res.ok) {
            return res.json(); // Expecting JSON response
        } else {
            console.error("Failed to fetch:", res.statusText);
            return null;
        }
    }, cookieString, url);

    await browser.close();

    return response;
}


async function parseAndSaveLegoData(legoId) {
    let currentPage = 1;
    let allResults = [];
    
    while (true) {
        const url = `https://www.vinted.fr/api/v2/catalog/items?page=${currentPage}&per_page=96&search_text=${legoId}&catalog_ids=&size_ids=&brand_ids=89162&status_ids=&material_ids=`;
        console.log(`Scraping LEGO ID ${legoId}, page ${currentPage}...`);

        const responseBody = await fetchWithPuppeteer(url);

        if (!responseBody || !responseBody.items || responseBody.items.length === 0) {
            console.log(`No items found for LEGO ID ${legoId} on page ${currentPage}.`);
            break;
        }

        const items = responseBody.items.map((item) => {
            return {
                legoid : legoId,
                id: item.id,
                title: item.title,
                price: item.total_item_price.amount,
                imgURL: item.photo.url,
                itemURL: item.url,
                publication: item.photo.high_resolution.timestamp,
            };
        });

        allResults.push(...items);

        const hasMore = responseBody.pagination?.has_more || responseBody.items.length === 96;
        if (!hasMore) break;

        currentPage++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Avoid rate limits
    }

    if (allResults.length > 0) {
        await fs.mkdir('./results', { recursive: true });
        await fs.writeFile(`./results/lego_${legoId}.json`, JSON.stringify(allResults, null, 2), 'utf8');
        console.log(`Saved data for LEGO ID ${legoId}`);
    }
}
export async function scrape() {
    const fileContent = await fs.readFile('./Parsedealabs.json', 'utf8');
    const legoData = JSON.parse(fileContent);

    const outputPath = './custom_results'; // Chemin personnalisé pour enregistrer les fichiers JSON

    for (const lego of legoData) {
        const legoId = lego.legoId;

        if (legoId === 0) {
            console.log(`Skipping LEGO ID 0.`);
            continue;
        }

        await parseAndSaveLegoData(legoId);
    }

    console.log("Scraping completed.");
}



    
