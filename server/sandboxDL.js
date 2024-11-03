/* eslint-disable no-console, no-process-exit */
import {scrape} from './websites/dealabs.js';
//import avenuedelabrique from './websites/avenuedelabrique.js';
//const avenuedelabrique = require('./websites/avenuedelabrique');

async function sandbox (website = 'https://www.dealabs.com/groupe/lego') {
  try {
    console.log(`🕵️‍♀️  browsing ${website} website`);

    const deals = await scrape(website);
    //const deals = await avenuedelabrique.scrape(website);

    console.log(deals);
    console.log('done');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

const [,, eshop] = process.argv;

sandbox(eshop);
