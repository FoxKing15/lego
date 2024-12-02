import {sandboxDL} from './websites/dealabs.js';
import { sandboxV } from './websites/vinted2.js';
import { deleteAllCollections } from './websites/MongoDB.js';

async function running(){
    
    await deleteAllCollections();
    await sandboxDL();
    await sandboxV();
}

running();