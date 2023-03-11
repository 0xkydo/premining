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
  // getObject('000000002fe288b5682e53db8b15e30c2caef37b7a48834b46f7d5f7515ea045')
  // getObject('a3ce724e24db4351db47b43dbe469c3ed9e006c6d9f9477b1b7ba8d8dba7801a')





  await setChainTip(1012)


})();