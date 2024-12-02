import * as cheerio from 'cheerio';
import fetch from 'node-fetch'; // Assurez-vous que cette librairie est installée
import { main } from './MongoDB.js';

export let deals = []; // Exporter deals pour utilisation externe

const parse = (data) => {
    const $ = cheerio.load(data, { xmlMode: true }, true);

    return $("article.thread").map((i, element) => {
        const dataVue2 = JSON.parse($(element).find("div.js-vue2").attr("data-vue2")).props.thread;
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
        const legoId = legoidExist ? parseInt(legoidExist[0], 10) : 0;

        if (basePrice != 0) {
            discount = Math.floor(((price - basePrice) / basePrice) * 100);
        }

        const expired = dataVue2.isExpired;
        if (expired || legoId === 0 || legoId === null) return null;

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
    }).get().filter(Boolean); // Supprimer les éléments null
};

export const scrapeDL = async (baseUrl, maxPages = 9) => {
    const agent = {
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        }
    };

    for (let page = 1; page <= maxPages; page++) {
        const url = `${baseUrl}&page=${page}`;
        const response = await fetch(url, agent);

        if (response.ok) {
            const body = await response.text();
            const dealsOnPage = parse(body); // Variable locale pour éviter les conflits avec deals global
            deals = deals.concat(dealsOnPage); // Remplir la variable exportée
            console.log(`Page ${page} scrappée avec succès.`);
        } else {
            console.error(`Erreur de récupération de la page ${page}:`, response.statusText);
            break;
        }
    }

    await main(deals, "deals"); // Sauvegarde dans MongoDB
    return deals;
};

export async function sandboxDL(website = 'https://www.dealabs.com/groupe/lego?&hide_expired=true&time_frame=30') {
    try {
        console.log(`🕵️‍♀️  browsing ${website} website`);
        console.log(`🚗⚡  Je suis rapide !! `);
        const scrapedDeals = await scrapeDL(website); // Ne pas réattribuer deals directement
        console.log(scrapedDeals);
        console.log('done');
    } catch (e) {
        console.error(e);
    }
}


