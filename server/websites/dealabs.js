import * as cheerio from 'cheerio';
import fs from 'fs';

/**
 * Parse webpage data response
 * @param  {String} data - HTML response
 * @return {Object[]} deals
 */
const parse = (data) => {
    const $ = cheerio.load(data, { xmlMode: true }, true);

    return $("article.thread").map((i, element) => {
        // Récupérer l'attribut data-vue2
        const dataVue2 = JSON.parse($(element).find("div.js-vue2").attr("data-vue2")).props.thread;
     
        // Parser l'attribut JSON
        const title = dataVue2.title;
        const price = dataVue2.price;
        const imgUrl = JSON.parse($(element).find("div.threadGrid-image div.js-vue2").attr("data-vue2")).props.threadImageUrl;
        const linkDL = dataVue2.shareableLink;
        const linkMer = dataVue2.link;
        const basePrice = dataVue2.nextBestPrice;
        const comments = dataVue2.commentCount;
        const temperature = dataVue2.temperature;
        const published = dataVue2.publishedAt;
        let discount = 0;
        const legoidExist = title.match(/\b\d{5}\b/);
        const legoId = legoidExist ? parseInt(legoidExist[0],10) : 0;
        if (basePrice != 0) {
            discount = Math.floor(((dataVue2.price - dataVue2.nextBestPrice) / dataVue2.nextBestPrice) * 100);
        }
        const expired = dataVue2.isExpired;
        if (expired) {
            return null; // Retourne null si l'offre est expirée
        }   
        return {
            imgUrl,
            legoId,
            title,
            price,
            basePrice,
            discount,
            comments,
            temperature,
            published, 
            linkDL,
            linkMer,
        };
    }).get().filter(Boolean); // Filtrer les éléments null
};

/**
 * Scrape a given URL page
 * @param {String} url - URL to parse
 * @returns {Object[]} - List of extracted deals
 */
const writeToJsonFile = (data, filename) => {
    // Remplacer le fichier JSON à chaque écriture
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
};

export const scrape = async (baseUrl, maxPages = 9) => { 
    const agent = {
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        }
    }

    let allDeals = [];

    // Commencer la boucle de pagination
    for (let page = 1; page <= maxPages; page++) {
        // Construire l'URL avec le paramètre de page
        const url = `${baseUrl}&page=${page}`; // Ajouter &page=page à l'URL

        const response = await fetch(url, agent);
        
        if (response.ok) {
            const body = await response.text();
            const deals = parse(body);
            allDeals = allDeals.concat(deals); // Ajouter les nouvelles offres au tableau total

            console.log(`Page ${page} scrappée avec succès.`);
        } else {
            console.error(`Erreur de récupération de la page ${page}:`, response.statusText);
            break; // Arrêter la boucle si une erreur se produit (par exemple, page 9 non trouvée)
        }
    }
    
    // Remplacer le fichier JSON avec les nouvelles données à chaque scraping
    writeToJsonFile(allDeals, 'ParseDealabs.json');
    console.log("Fichier JSON remplacé avec succès !");
  
    return allDeals;
};
