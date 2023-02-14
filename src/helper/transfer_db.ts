import Level from "level-ts";
import { readFileSync} from "fs";
import * as path from "path";

const dbPath = "./db";
const blocksPath = "./src/blocks"
const txnPath = "./src/transactions"
const testPath ="./src/test"
const dbPathAbs = path.resolve(dbPath);
const blocksPathAbs = path.resolve(blocksPath);
const txnPathAbs = path.resolve(txnPath);
const testPathAbs = path.resolve(testPath);

const db = new Level(dbPathAbs);

var i = 0;

async function transferBlock(){
  for(i=0;i<1095;i++){
    var temp = readFileSync(`${blocksPathAbs}/${i}.txt`, { encoding: "utf8" });
    await db.put(`b_${i}`,temp);
  }
  console.log(await db.get(`b_1094`));

}

async function transferTxn(){
  for(i=1;i<6001;i++){
    var temp = readFileSync(`${txnPathAbs}/${i}.txt`, { encoding: "utf8" });
    await db.put(`t_${i}`,temp);
  }
  console.log(await db.get(`t_6000`));
}

async function transferTest(){
  for(i=1095;i<1243;i++){
    var temp = readFileSync(`${testPathAbs}/${i}.txt`, { encoding: "utf8" });
    await db.put(`test_${i}`,temp);
  }
  console.log(await db.get(`test_1242`));
}

async function transferConstants(){

  await db.put(`blockCount`,"1094");

}



transferConstants()