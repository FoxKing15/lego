/* eslint-disable no-console, no-process-exit */
import {scrape} from './websites/vinted.js';
//import avenuedelabrique from './websites/avenuedelabrique.js';
//const avenuedelabrique = require('./websites/avenuedelabrique');

async function sandbox () {
  try {
    console.log(`🚗⚡  Je suis rapide ...`);

    const deals = await scrape();
    //const deals = await avenuedelabrique.scrape(website);

    //console.log(deals);
    console.log('done');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

const [,, eshop] = process.argv;

sandbox(eshop);
