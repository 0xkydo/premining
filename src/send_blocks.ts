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


  for(var i = 750; i<num;i++){
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

  // // // Get object
  getObject('00000000647ef0c8b17dc34490c83f0b29625395ea19c4f5cb5eb87ba48c6de0')
  // getObject('cd6f6c24055d45a760282fad078520f0199b6fe3cf6f6480c72e6e84007311e0')

 /*

 1023

 {"T":"00000000abc00000000000000000000000000000000000000000000000000000","created":1678513121,"miner":"Yours truly","nonce":"8042a948aac5e884cb3ec7db925643fd34fdd467e2cca406035cb2746333f74e","note":"You better watch out, you better not cry - the best miner is here and I'm telling you why...","previd":"0000000055cf812e19ee2999fef99d04855b98396e90863d6f5f41150a9a698f","txids":["ee589a0b60fc5b6ead24ac76e6788a6ca202406156069b80cf0a32264316e6ef","cd6f6c24055d45a760282fad078520f0199b6fe3cf6f6480c72e6e84007311e0"],"type":"block"}

 cd6f6c24055d45a760282fad078520f0199b6fe3cf6f6480c72e6e84007311e0

 {"inputs":[{"outpoint":{"index":0,"txid":"c9856c9f36afc6e844a3c4e03e496fbae3c9599f4a7f66e0cb186a16da5cad73"},"sig":"781d3a32e940114834e2b5279465979b07a2b07f3749988f338e88e42ad66ddffeb342f6961e81f1aab997941df939cb591a79dd1a5d3f914c3e404d7afb0c0b"}],"outputs":[{"pubkey":"3f0bc71a375b574e4bda3ddf502fe1afd99aa020bf6049adfe525d9ad18ff33f","value":50000000000000}],"type":"transaction"}


 */





  // await setChainTip(1015)


})();