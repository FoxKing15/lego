import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

/**
 * Parse webpage data response
 * @param  {String} data - HTML response
 * @return {Object[]} deals
 */
const parse = (data) => {
    const $ = cheerio.load(data);

    return $('div.js-threadList article').map((i, element) => {
        // Récupérer l'élément contenant data-vue2
        const threadElement = $(element).find('div.js-vue2');

        // Récupérer la valeur de l'attribut data-vue2
         const threadElement2 = $(element).find('data-vue2').text(); 
         return {
          threadElement2;
        };

    }).get().filter(Boolean); // Filtrer les éléments null
};

/**
 * Scrape a given URL page
 * @param {String} url - URL to parse
 * @returns {Object[]} - List of extracted deals
 */
export const scrape = async (url) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Définir le User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36');

    await page.goto(url, { waitUntil: 'networkidle2' }); // Chargement de la page

    // Remplacer waitForTimeout par une fonction de délai manuelle
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(3000); // Attendre 3 secondes pour le chargement

    const body = await page.content(); // Obtenir le contenu HTML de la page
    await browser.close(); // Fermer le navigateur après utilisation

    return parse(body);
};
