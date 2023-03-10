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
  
  const lastBlock = { "T": "00000000abc00000000000000000000000000000000000000000000000000000", "created": 1678403916, "miner": "Best Miner", "nonce": "3000000000000000000000000000000000000000000000001b2db16a7688bd41", "previd": "000000007115ff51b6121944c75234ce818d53a3a6c2a6dc08b6a2a832eb1bd6", "studentids": ["rcheng07", "mcan"], "txids": ["47ebc23aea3888fa779da5b6972963b00a3b36b258731f4ad0e9aa80ae4c2c09"], "type": "block" }

  const lastHeight = 648

  await setCounts(648, 4998)

  await db.put(`b_${lastHeight}`,lastBlock)

})();