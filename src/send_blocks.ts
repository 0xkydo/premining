import { canonicalize } from 'json-canonicalize'
import Level from 'level-ts';
import path from 'path';
import * as net from 'net'
import { delay } from './helper/promise';
import { hash } from './helper/hash';

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

    delay(15)

  }

  sendObject(wrapObject({"inputs":[{"outpoint":{"index":0,"txid":"e76494b01b1432a2597304bb3e75f5dc978c0217c180a613939b5c3fad56b8f2"},"sig":"db56d103f68bd9cfa9e8505a85b8313c1af4e0b6ae2c3311c8b6ea53b258ac3262af5a3d6e2b919e6bd0ee95e47a571bb9309a570c82c3a3874a920f9b25150d"}],"outputs":[{"pubkey":"3f0bc71a375b574e4bda3ddf502fe1afd99aa020bf6049adfe525d9ad18ff33f","value":50000000000}],"type":"transaction"}))

}

(async () => {

  // Init
  init()

  // // // Get object
  // getObject('000000002fe288b5682e53db8b15e30c2caef37b7a48834b46f7d5f7515ea045')
  // getObject('a3ce724e24db4351db47b43dbe469c3ed9e006c6d9f9477b1b7ba8d8dba7801a')





  await setChainTip(1006)


})();