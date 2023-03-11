// I/O
import fs from 'fs';
import process from 'process';

// Processes
import * as child_process from 'child_process';

// Crypto tools
import { hash } from './helper/hash';
import { canonicalize } from 'json-canonicalize'
import Level from 'level-ts';
import path from 'path';
import { sendBUPayment } from './txn_3ac';

const dbPath = "./db";
const dbPathAbs = path.resolve(dbPath);
const db = new Level(dbPathAbs);


const command = process.argv[2];
const fileName = command.slice(1);
const filePath = `./a_${fileName}.out`;
const filePathAbs = path.resolve(filePath);


// Constants

(async () => {
  const txnCountObj = await db.get('transactionCount');
  const txnCount = txnCountObj.value;
  console.log(`Total transactions: ` + txnCount);
  // all of the script.... 
  var lastBlockHeightObj = await db.get(`blockCount`);
  var lastBlockHeight = lastBlockHeightObj.value;
  console.log(`Total blocks : ` + lastBlockHeight);


  // Store block object to a specific height number.
  async function storeBlock(block: any, height: number) {
    await db.put(`b_${height}`, block);
    await db.put('blockCount', { value: height });
  };

  async function loadStartingBlock(): Promise<any> {
    const block = await db.get(`b_${lastBlockHeight}`);
    console.log(`Starting Block Loaded`)
    console.log(block);

    return block;
  };

  // Load txn and compute hash.
  async function loadTxn(height: number): Promise<any> {
    console.log(`Transaction at height ${height}`);
    const tx = await db.get(`t3ac_${height}`)
    console.log(tx)
    return tx;
  };

  // Store prefix and suffix into local txt file.
  function storePrefixSuffix(text: string, prefix: boolean) {
    // If it is prefix
    if (prefix) {

      fs.writeFileSync(`prefix.txt`, text, { encoding: 'utf8' });

    }
    else {

      fs.writeFileSync(`suffix.txt`, text, { encoding: 'utf8' });

    }
  };

  //
  async function waitForMining(child: child_process.ChildProcess) {
    return new Promise<void>((resolve, reject) => {
      child.on('exit', (code) => {
        console.log(`HASH FOUND`);
        resolve();
      });
    });
  }

  // Define template block
  const currentBlock = {
    "T": "00000000abc00000000000000000000000000000000000000000000000000000",
    "created": 1671148900,
    "miner": "Su and Kyle",
    "studentids": ["jchudnov", "wweng"],
    "note": 'Making it all back block by block',
    "nonce": "15551b5116783ace79cf19d95cca707a94f48e4cc69f3db32f41081dab3e6641",
    "previd": "0000000052a0e645eca917ae1c196e0d0a4fb756747f29ef52594d68484bb5e2",
    "txids": ["8265faf623dfbcb17528fcd2e67fdf78de791ed4c7c60480e8cd21c6cdc8bcd4"],
    "type": "block"
  };

  // Load last block
  var prevBlock = await loadStartingBlock();
  var previd = hash(canonicalize(prevBlock));

  currentBlock.previd = previd;
  currentBlock.created = prevBlock.created;

  // Testing Cases
  async function run() {

    // Iterate through all the unused transactions.
    // TESTING USE 10 as max length
    let startTime = new Date().getTime();
    var counter = 0;
    var nonce: string = "";
    var currentBlockHash: string = "";


    for (var i = lastBlockHeight; i < txnCount; i++) {
      counter++;

      // Load current txn
      var curTxn = await loadTxn(lastBlockHeight + 1);
      var coinTxn = hash(canonicalize(curTxn));
      var paymentTxn = await db.get(`tbu_${lastBlockHeight}`)
      var TATx = null ;


      // Change template block to the correct number.
      currentBlock.nonce = "";
      currentBlock.created += 300;
      currentBlock.txids[0] = coinTxn;
      // Send Bu Payment
      // currentBlock.txids.push(paymentTxn);

      // Include TA txn
      // currentBlock.txids[1] = TATx;


      // Format block into two strings.

      var block_splitted = canonicalize(currentBlock).split(`"nonce":"`);
      var prefix = block_splitted[0] + `"nonce":"`;
      var suffix = block_splitted[1];

      storePrefixSuffix(prefix, true);
      storePrefixSuffix(suffix, false);

      const child = child_process.spawn(filePathAbs);


      child.stdout.on('data', (data) => {

        const dataArray = data.toString().split('\n');
        nonce = dataArray[0];
        currentBlockHash = dataArray[1];

      });

      child.stderr.on('data', (data) => {
        // console.error(`stderr: ${data}`);
      });

      child.on('close', (code) => {
        // console.log(`child process exited with code ${code}`);
      });

      await waitForMining(child);

      // Fill in nonce for the current block.
      currentBlock.nonce = nonce;

      // TEST

      await storeBlock(currentBlock, ++lastBlockHeight);
      // await storeTestBlock(currentBlock, ++lastBlockHeight);

      console.log(currentBlock)
      console.log(curTxn)

      // Preping next block.
      // previd = current blockhash.
      currentBlock.previd = currentBlockHash;

      console.log(`Block at Height ${lastBlockHeight} Mined`);
      console.log(`Hash value: ${currentBlockHash}`);
      console.log(`Nonce: ${nonce}`);
      let endTime = new Date().getTime();
      let elapsedTime = endTime - startTime;
      console.log("Elapsed time: " + elapsedTime + "ms");
      console.log(`Average block production rate: ${elapsedTime / counter / 1000}s/block`)

    }

    let endTime = new Date().getTime();

    let elapsedTime = endTime - startTime;

    console.log("********************************************");
    console.log("**************** Completed *****************");
    console.log("Elapsed time: " + elapsedTime + "ms");
    console.log(`Average block production rate: ${elapsedTime / txnCount / 1000}s/block`)
    console.log("********************************************");
    console.log("********************************************");

  }

  run();

})();