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
  
  const lastBlock = {"T":"00000000abc00000000000000000000000000000000000000000000000000000","created":1678513121,"miner":"Yours truly","nonce":"8042a948aac5e884cb3ec7db925643fd34fdd467e2cca406035cb2746333f74e","note":"You better watch out, you better not cry - the best miner is here and I'm telling you why...","previd":"0000000055cf812e19ee2999fef99d04855b98396e90863d6f5f41150a9a698f","txids":["ee589a0b60fc5b6ead24ac76e6788a6ca202406156069b80cf0a32264316e6ef","cd6f6c24055d45a760282fad078520f0199b6fe3cf6f6480c72e6e84007311e0"],"type":"block"}

  const lastHeight = 1023

  await setCounts(lastHeight, 5000)

  await db.put(`b_${lastHeight}`,lastBlock)

})();