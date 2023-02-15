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
// Generate SK and store it locally in plain text.
// const newPrivKey = ed.utils.randomPrivateKey();
// const o_pk = newPrivKey.join(",")
// console.log(`OLD PK: ${o_pk}`)

// fs.writeFileSync('privKey.txt', o_pk,{encoding:'utf8'});

// Read Private key from file and genearte pubKey
// const privKeyFile = fs.readFileSync('privKey.txt', { encoding: "utf8" })

// const privKey = Uint8Array.from(privKeyFile.split(",").map(Number));

// const pubKey = getPublicKey(privKey);

// const hexString = Array.from(pubKey, char => char.toString(16).padStart(2, '0')).join('');
// console.log(hexString); // "010203"


// // Read current transaction count.
async function createTxn() {


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

  for(var i = 0;i<TOTALTXN;i++){
    db.put(`t_${sampleCoinbaseTxn.height}`,canonicalize(sampleCoinbaseTxn));
    sampleCoinbaseTxn.height++;
  }
  db.put(`transactionCount`,TOTALTXN);

}

createTxn();