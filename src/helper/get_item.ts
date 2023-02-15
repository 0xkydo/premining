import { canonicalize } from "json-canonicalize";
import Level from "level-ts";
import * as path from "path";
import { hash } from "./hash";

const dbPath = "./db";
const dbPathAbs = path.resolve(dbPath);

const db = new Level(dbPathAbs);

async function getBlock(height: number){
  console.log(await db.get(`b_${height}`));
}

async function getTxn(height: number){
  console.log(await db.get(`t_${height}`));
}

async function getTest(height: number){
  console.log(await db.get(`test_${height}`));
}
async function getCounts(){
  console.log(`TXN: `+ await db.get(`transactionCount`));
  console.log(`Block: `+ await db.get(`blockCount`));
}

async function setCounts(numB: number,numT: number){
  await db.put(`transactionCount`,numT)

  await db.put(`blockCount`,numB)
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

  for(var i = 0;i<10000;i++){
    db.put(`t_${sampleCoinbaseTxn.height}`,canonicalize(sampleCoinbaseTxn));
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

      console.log(prevBlock);

      console.log(`Failed at ${i}, block`);
      return;

    }

    if(block.txids[0] != hash(currentTxn)){

      console.log('TXN FROM INSIDE' + currentTxn);



      console.log(`Failed at ${i} , txn`);
      return;

    }

  }
  console.log(`all passes`)


}

async function longestBlock(){

  var blockCount = await db.get(`blockCount`);

  var i =0;
  for(i = 0; i<10000; i++){

    var prev = blockCount-1;
    var prevBlock = await db.get(`b_${prev}`);
    try {
      var currentBlock: string = await db.get(`b_${blockCount}`);
      var currentTxn = await db.get(`t_${blockCount}`);
      var block = JSON.parse(currentBlock);

      if(block.previd != hash(prevBlock)){

        console.log(`Longest block at ${blockCount-1}`);
        await db.put('blockCount',(blockCount-1))
        return;
  
      }
  
      if(block.txids[0] != hash(currentTxn)){
  
        console.log(`Longest block at ${blockCount-1}`);
        await db.put('blockCount',(blockCount-1))
        return;
  
      }
  
      blockCount++;

    } catch (error) {
      console.log(`Longest block at ${blockCount-1}`);
      await db.put('blockCount',(blockCount-1))
      return;
      
    }
    
  }

}


// longestBlock()
// checkAllBlocks()

// resetTxn();

// getTest(1242);

// getBlock(4)

// getTxn(4)

// getBlock(4)

getCounts();

// setCounts(1094,6000)

