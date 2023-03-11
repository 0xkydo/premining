import { canonicalize } from "json-canonicalize";
import Level from "level-ts";
import * as path from "path";
import { sendBUPayment } from "../txn_3ac";
import { hash } from "./hash";

const dbPath = "./db";
const dbPathAbs = path.resolve(dbPath);

const db = new Level(dbPathAbs);

async function init(){
  const genesis = {
    "T": "00000000abc00000000000000000000000000000000000000000000000000000",
    "created": 1671062400,
    "miner": "Marabu",
    "nonce": "000000000000000000000000000000000000000000000000000000021bea03ed",
    "note": "The New York Times 2022-12-13: Scientists Achieve Nuclear Fusion Breakthrough With Blast of 192 Lasers",
    "previd": null,
    "txids": [],
    "type": "block"
  };
  await db.put(`b_0`,genesis);
  console.log(`Genesis Loaded`);
}

async function getBlock(height: number){
  const block = await db.get(`b_${height}`)
  const tx = await db.get(`t_${height}`)
  console.log(block);
  console.log(`Current Transaction: \n`);
  console.log(tx)
  // console.log(`Last block: \n`+await db.get(`b_${height-1}`));
}

async function getBlock3ac(height: number){
  const block = await db.get(`b_${height}`)
  const tx = await db.get(`t3ac_${height}`)
  console.log(`Block at height ${height}`)
  console.log(block);
  console.log(`Current Transaction: \n`);
  console.log(tx)
  console.log(`Tx hash: ${hash(canonicalize(tx))}`)
  console.log(`Blockhash: ${hash(canonicalize(block))}`)
}


export async function setCounts(numB: number,numT: number){
  await db.put(`transactionCount`,{value:numT})

  await db.put(`blockCount`,{value:numB})
}

async function getTxn(height: number){
  console.log(await db.get(`t_${height}`));
  console.log(hash(canonicalize(await db.get(`t_${height}`))))
}

async function getTxn3ac(height: number){
  console.log(await db.get(`t3ac_${height}`));
  console.log(hash(canonicalize(await db.get(`t3ac_${height}`))))
}

async function getTest(height: number){
  console.log(await db.get(`test_${height}`));
}
async function getCounts(){
  console.log(`TXN: `+ (await db.get(`transactionCount`)).value);
  console.log(`Block: `+ (await db.get(`blockCount`)).value);
}





async function resetTxn(){
  var sampleCoinbaseTxn ={
    "type": "transaction",
    "height": 1,
    "outputs": [
      {
        "pubkey": "0513817d1170f4152666f367c5c1d822f38e954eb5c368e1938266d2de9969f4",
        "value": 50000000000
      }
    ]
  }

  for(var i = 1;i<5000;i++){
    db.put(`t_${i}`,sampleCoinbaseTxn);
    sampleCoinbaseTxn.height++;
  }

}

async function checkAllBlocks(){

  var blockCount = await db.get(`blockCount`);

  for(var i = 1; i<blockCount; i++){

    var prev = i-1;

    var prevBlock = await db.get(`b_${prev}`);

    var currentBlock: string = await db.get(`b_${i}`);

    var currentTxn = await db.get(`t_${i}`);

    var block = JSON.parse(currentBlock);

    if(block.previd != hash(prevBlock)){

      console.log('Failed prev block: \n'+ prevBlock);

      console.log(`Failed at ${i}, block`);
      return;

    }

    if(block.txids[0] != hash(currentTxn)){

      console.log('Failed transaction: \n' + currentTxn);

      console.log(`Failed at ${i} , txn`);
      return;

    }

    if(block.created < prevBlock.created){

      console.log('Failed timestamp: \n' + currentTxn);

      console.log(`Failed at ${i} , txn`);
      return;

    }

  }
  console.log(`all passes`)


}

async function longestBlock(){

  var blockCount = (await db.get(`blockCount`)).value;
  var i =0;
  for(i = 0; i<blockCount; i++){

    var prev = i;
    var prevBlock = await db.get(`b_${prev}`);
    try {
      var currentBlock = await db.get(`b_${i+1}`);
      var currentTxn = await db.get(`t_${i+1}`);

      if(currentBlock.previd != hash(canonicalize(prevBlock))){

        console.log(`Longest block at ${i}`);
        console.log(`Wrong previd`)
        await db.put('blockCount',({value:i}))
        return;
  
      }
  
      if(currentBlock.txids[0] != hash(currentTxn)){
  
        console.log(`Longest block at ${i}`);
        console.log(`Wrong coinbase`)
        await db.put('blockCount',({value:i}))
        return;
  
      }

      if(currentTxn.height!=(i+1)){

        console.log(`Longest block at ${i}`);
        console.log(`Wrong coinbase`)
        await db.put('blockCount',({value:i}))
        return;

      }

      if(hash(canonicalize(currentBlock))>='00000000abc00000000000000000000000000000000000000000000000000000'){
        console.log(`Longest block at ${i}`);
        console.log(`Wrong PoW`)
        await db.put('blockCount',({value:i}))
        return;
      }

      if(currentBlock.created <= prevBlock.created){


        console.log(`Longest block at ${blockCount-1}`);
        console.log(`Wrong timestamp`)
        await db.put('blockCount',({value:i}))
        return;

      }
  
      blockCount++;

    } catch (error) {
      console.log(`Longest block at ${i-1}`);
      await db.put('blockCount',({value:i-1}))
      return;
      
    }
    
  }


}

async function resetAll(){

  await init();
  await resetTxn();
  await setCounts(0,4998);
  await getCounts()

}

async function setBlockCount(count:number) {
  await db.put(`blockCount`,{value:count})
  return
}

async function manualCheck(){

  var blockCount = (await db.get(`blockCount`)).value;

  for(var i = 1; i<=blockCount;i++){
    var currentBlock = await db.get(`b_${i}`)
    var currentTxn = await db.get(`t_${i}`)


    console.log(`${currentTxn.height} is ${hash(canonicalize(currentBlock))}`)

  }


}

async function getPaymentTx(height:number){
  const tx = await sendBUPayment(height)
  console.log(canonicalize(tx))
  console.log(hash(canonicalize(tx)))
}

// manualCheck()

// init()

// resetAll();

// longestBlock()
// checkAllBlocks()

// resetTxn();

// getTest(500);

// getBlock3ac(1005)
// getPaymentTx(1004)
// // getTxn(668)


setCounts(1005,5000)

getCounts();


// getTxn3ac(1004)
