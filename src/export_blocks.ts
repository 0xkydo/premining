import Level from 'level-ts';
import path from 'path';
import fs from 'fs';


const dbPath = "./db";
const dbPathAbs = path.resolve(dbPath);
const db = new Level(dbPathAbs);
