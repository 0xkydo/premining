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
  
  const lastBlock = {"T":"00000000abc00000000000000000000000000000000000000000000000000000","created":1678511950,"miner":"Yours truly","nonce":"09e111c7e1e7acb6f8cac0bb2fc4c8bc2ae3baaab9165cc458e199cbb4cd65f5","note":"You better watch out, you better not cry - the best miner is here and I'm telling you why...","previd":"00000000568fce17c1dc98825c434af5163a1d80b9cc28e879bb424c6530c248","txids":["9a92e4616fef9449633a0d45ca7b917fdad2300328850920af23cd1bfe4e3dd0","c9856c9f36afc6e844a3c4e03e496fbae3c9599f4a7f66e0cb186a16da5cad73"],"type":"block"}

  const lastHeight = 1022

  await setCounts(lastHeight, 5000)

  await db.put(`b_${lastHeight}`,lastBlock)

})();