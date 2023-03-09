import { hash } from './helper/hash';
import { canonicalize } from 'json-canonicalize'
import Level from 'level-ts';
import path from 'path';
import * as net from 'net'
import { stringify } from 'querystring';
import { delay } from './helper/promise';

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

const connection = net.createConnection(18018, '50.18.89.218')

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
    const block = JSON.parse(await db.get(`b_${i}`))
    sendObject(wrapObject(block))
    console.log(block.created.toString()+block.previd)
    delay(15)
  }

  for(var i = 1; i<=num; i++){

    const tx = JSON.parse(await db.get(`t_${i}`))
    sendObject(wrapObject(tx))    
    delay(15)


  }

}

(async () => {

  // Init
  init()

  // Get object
  // Block height 203
  // getObject('0000000082f50ddc620c1e5fe844e232d8d889fc1e6f281a58b14837a3817800')

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


  await setChainTip(55)


})();