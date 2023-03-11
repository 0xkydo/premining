// I/O
import fs from 'fs';

// Crypto tools
import { hash } from './helper/hash';
import { canonicalize } from 'json-canonicalize'
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
ed.utils.sha512Sync = (...m) => sha512(ed.utils.concatBytes(...m));
const { getPublicKey } = ed.sync;
import Level from 'level-ts';
import path from 'path';

const TOTALTXN = 100000;


const dbPath = "./db";
const dbPathAbs = path.resolve(dbPath);
const db = new Level(dbPathAbs);


// // Generate SK and store it locally in plain text.
// const newPrivKey = ed.utils.randomPrivateKey();
// const o_pk = newPrivKey.join(",")
// console.log(`New PK: ${o_pk}`)

// fs.writeFileSync('privKey.txt', o_pk,{encoding:'utf8'});

// Read Private key from file and genearte pubKey
const privKeyFile = fs.readFileSync('3ac.txt', { encoding: "utf8" })

const privKey = Uint8Array.from(privKeyFile.split(",").map(Number));

const pubKey = getPublicKey(privKey);

const hexString = Array.from(pubKey, char => char.toString(16).padStart(2, '0')).join('');
console.log(hexString); // "010203"


// // Read current transaction count.
async function createTxn() {

  var sampleCoinbaseTxn ={
    "type": "transaction",
    "height": 1,
    "outputs": [
      {
        "pubkey": "f7c6335811ac0f4b207081025e3d21144c13d3b3e9c4a322ecc7cfabb231a4a0",
        "value": 50000000000000
      }
    ]
  }

  for(var i = 0;i<TOTALTXN;i++){
    await db.put(`t3ac_${sampleCoinbaseTxn.height}`,sampleCoinbaseTxn);
    sampleCoinbaseTxn.height++;
  }
  await db.put(`transactionCount`,{value:50000});

}

export async function sendBUPayment(height:number){

  const inputTx = await db.get(`t3ac_${height}`);
  const txid = hash(canonicalize(inputTx))

  const transaction = {
    "type": "transaction",
    "inputs": [
      {
        "outpoint": {
          "txid": txid,
          "index": 0
        },
        "sig": null
      }
    ],
    "outputs": [
      {
        "pubkey": "3f0bc71a375b574e4bda3ddf502fe1afd99aa020bf6049adfe525d9ad18ff33f",
        "value": 50000000000000
      }
    ]
  }

  const sig = await ed.sign(Uint8Array.from(Buffer.from(canonicalize(transaction), 'utf-8')),privKey)

  const signature = ed.utils.bytesToHex(sig)

  return {
    "type": "transaction",
    "inputs": [
      {
        "outpoint": {
          "txid": txid,
          "index": 0
        },
        "sig": signature
      }
    ],
    "outputs": [
      {
        "pubkey": "3f0bc71a375b574e4bda3ddf502fe1afd99aa020bf6049adfe525d9ad18ff33f",
        "value": 50000000000000
      }
    ]
  }

}



createTxn();