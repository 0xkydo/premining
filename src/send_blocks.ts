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

const connection = net.createConnection(18018, '135.181.112.99')

// 135.181.112.99
// 45.63.84.226
// 45.63.89.228
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


  for(var i = 648; i<num;i++){
    const block = await db.get(`b_${i}`)
    sendObject(wrapObject(block))
    console.log(block)

    const tx = await db.get(`t_${i}`)
    sendObject(wrapObject(tx));
    console.log(tx)

    delay(15)

  }

}

(async () => {

  // Init
  init()

  // Get object
  getObject('22054994f2f60126ae4ddea354c4eabd24d0cbd0c65a2d5d7b7cc15b182280ee')
  // getObject('b2d57cd8890daba1b414d0d6d6b50cbefeb372da056bc2582faf7acb473d2519')





  // await setChainTip(670)


})();