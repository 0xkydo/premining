// Crypto tools
import { hash } from './helper/hash';
import { canonicalize } from 'json-canonicalize'
import Level from 'level-ts';
import path from 'path';
import { setCounts } from './helper/debug';

const dbPath = "./db";
const dbPathAbs = path.resolve(dbPath);
const db = new Level(dbPathAbs);

(async () => {
  
  const lastBlock = {"T":"00000000abc00000000000000000000000000000000000000000000000000000","created":1678732079,"miner":"Yours truly","nonce":"b1acf38984b35ae882809dd4cfe7abc5c61baa52e053b4c3643f204ef509e46a","note":"You better watch out, you better not cry - the best miner is here and I'm telling you why...","previd":"000000003f68c983a6b373fc193e510165482fcd6df227ff4f6bba68db70c0ee","txids":["957e95ece3a65ff24dc6014d407bb5aeeefa5f6d07e5eba1349ddb4b39afdd2b","0b934cf61cd44f42cc3b38d9a97d067709944b82253d7fcc1a6332f4535563cb"],"type":"block"}

  const lastHeight = 1480

  await setCounts(lastHeight, 5000)

  await db.put(`b_${lastHeight}`,lastBlock)

})();