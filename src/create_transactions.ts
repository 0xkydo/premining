// I/O
import fs from 'fs';

// Crypto tools
import {hash} from './helper/hash';
import { canonicalize } from 'json-canonicalize'
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
ed.utils.sha512Sync = (...m) => sha512(ed.utils.concatBytes(...m));
const { getPublicKey} = ed.sync;

const ADDITIONAL_TXN = 4000;

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


// Read current transaction count.
const txnCountTxt = fs.readFileSync('transactionCount.txt', { encoding: "utf8" });
var txnCount = parseInt(txnCountTxt,10);

const sample_Coinbase = {
  "type": "transaction",
  "height": txnCount,
  "outputs": [
    {

      "pubkey": "0513817d1170f4152666f367c5c1d822f38e954eb5c368e1938266d2de9969f4",
      "value": 50000000000
    }
  ]
};

for(var i = 0; i < ADDITIONAL_TXN; ++i){
  sample_Coinbase.height++;
  fs.writeFileSync(`./src/transactions/${++txnCount}.txt`, canonicalize(sample_Coinbase));
}

fs.writeFileSync('transactionCount.txt', txnCount.toString(), {encoding:'utf8'});
