import { canonicalize } from 'json-canonicalize'
import Level from 'level-ts';
import path from 'path';
import * as net from 'net'
import { delay } from './helper/promise';
import { hash } from './helper/hash';
import { sendBUPayment } from './txn_3ac';

const dbPath = "./db";
const dbPathAbs = path.resolve(dbPath);
const db = new Level(dbPathAbs);

const HELLO = {
  type: 'hello',
  version: '0.10.0',
  agent: `Honest Node`
}
const TIP = {
  type: 'getchaintip'
}

const PEERS = {"type":"getpeers"}

const connection = net.createConnection(18018, '45.63.84.226')

// 135.181.112.99
// 45.63.84.226:18018, 45.63.89.228:18018, 144.202.122.8:18018
// 54.67.110.108

// Master solutio node: 50.18.89.218

connection.on('data', (data) => {
  console.log(data.toString())
})


function writeToNode(data: string){
  connection.write(data+'\n')
}

function sendObject(object:any){
  writeToNode(canonicalize(object))
}

function wrapObject(object: any): any{
  return {
    type: 'object',
    object: object
  }
}


function init(){
  sendObject(HELLO);
  sendObject(TIP);
  // sendObject(PEERS);
  // sendObject({
  //   type:'getmempool'
  // })
}

function getObject(_id:string){
  sendObject({
    type:'getobject',
    objectid: _id
  })
}

async function setChainTip(num: number){

  const block = await db.get(`b_${num}`)
  const blockId = hash(canonicalize(block))

  sendObject({
    type:'chaintip',
    blockid: blockId
  })


  for(var i = 1480; i<num;i++){
    const block = await db.get(`b_${i}`)
    sendObject(wrapObject(block))
    console.log(block)

    const tx = await db.get(`t_${i}`)
    sendObject(wrapObject(tx));

    const tx_3ac = await db.get(`t3ac_${i}`)
    sendObject(wrapObject(tx_3ac));
    console.log(tx)

    const tx_payment = await db.get(`tbu_${i}`);
    sendObject(wrapObject(tx_payment));


    delay(15)

  }

  

}

(async () => {

  // Init
  init()

  // // // // // Get object
  // getObject('00000000197d0f65502d8bbd732d37ca01f28571d1b5568fa5d261bb7d9aaf5b')
  // getObject('957e95ece3a65ff24dc6014d407bb5aeeefa5f6d07e5eba1349ddb4b39afdd2b')

 /*

 1022

{"T":"00000000abc00000000000000000000000000000000000000000000000000000","created":1678511950,"miner":"Yours truly","nonce":"09e111c7e1e7acb6f8cac0bb2fc4c8bc2ae3baaab9165cc458e199cbb4cd65f5","note":"You better watch out, you better not cry - the best miner is here and I'm telling you why...","previd":"00000000568fce17c1dc98825c434af5163a1d80b9cc28e879bb424c6530c248","txids":["9a92e4616fef9449633a0d45ca7b917fdad2300328850920af23cd1bfe4e3dd0","c9856c9f36afc6e844a3c4e03e496fbae3c9599f4a7f66e0cb186a16da5cad73"],"type":"block"}

 cd6f6c24055d45a760282fad078520f0199b6fe3cf6f6480c72e6e84007311e0

 {"inputs":[{"outpoint":{"index":0,"txid":"c9856c9f36afc6e844a3c4e03e496fbae3c9599f4a7f66e0cb186a16da5cad73"},"sig":"781d3a32e940114834e2b5279465979b07a2b07f3749988f338e88e42ad66ddffeb342f6961e81f1aab997941df939cb591a79dd1a5d3f914c3e404d7afb0c0b"}],"outputs":[{"pubkey":"3f0bc71a375b574e4bda3ddf502fe1afd99aa020bf6049adfe525d9ad18ff33f","value":50000000000000}],"type":"transaction"}


 */





  await setChainTip(1538)


})();