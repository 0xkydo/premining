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
// 45.63.84.226
// 45.63.87.246
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
  sendObject(PEERS)
}

function getObject(_id:string){
  sendObject({
    type:'getobject',
    objectid: _id
  })
}

async function setChainTip(num: number){


  for(var i = 1; i<num;i++){
    const block = await db.get(`b_${i}`)
    console.log(block)
    sendObject(wrapObject(block))

    const tx = await db.get(`t_${i}`)

    console.log(hash(canonicalize(tx)))

    sendObject(wrapObject(tx));

    delay(15)

  }

}

(async () => {

  // Init
  init()

  // Get object
  // Block height 203
  // getObject('55e7ec938589aae5491ac61691da7de6a7954904bf44a168a1b3ee67f83eacbe')
  // {"object":{"height":4,"outputs":[{"pubkey":"0513817d1170f4152666f367c5c1d8s22f38e954eb5c368e1938266d2de9969f4","value":50000000000}],"type":"transaction"},"type":"object"}
  // {"object":{"height":211,"outputs":[{"pubkey":"e54f6be504b8707bdea7e2a95bb10d17f378c761cc4409b3fdcca38d23646ed5","value":50000000000000}],"type":"transaction"},"type":"object"}

  /*
  {"description":"Parent block 00000000326ac45f8d284e2f0fe16bec737201cbc0fcf390f90031a70fabb7a9 created at 1671150000 has future timestamp of block 0000000052c30916e650eb73288ca898eab04d3a95e98d765e6b2726d1a8ad1e created at 1671149100.","name":"INVALID_BLOCK_TIMESTAMP","type":"error"}

{"description":"Retrieval of block parent for block 00000000848f5f799bcbb0445af2937289039165c2553d0bf150806c1a71eb78 failed; rejecting block: Parent block 00000000326ac45f8d284e2f0fe16bec737201cbc0fcf390f90031a70fabb7a9 created at 1671150000 has future timestamp of block 0000000052c30916e650eb73288ca898eab04d3a95e98d765e6b2726d1a8ad1e created at 1671149100.","name":"UNFINDABLE_OBJECT","type":"error"}
  
  */

// const block = JSON.parse(await db.get(`b_${3}`))
// console.log(block)
// 1671062400
// 1671149100
// 1671149400
// 1671149700


  await setChainTip(400)


})();