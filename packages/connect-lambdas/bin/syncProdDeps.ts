import { exists as EXISTS, promises as FR_PROMISES } from 'fs';
import { resolve, sep } from 'path';
import { promisify } from 'util';

import { exec, fromRoot } from '../../../lib';
import pkg from '../../../package.json';

const { writeFile, mkdir } = FR_PROMISES;
const exists = promisify(EXISTS);

const outDirName = 'dist';
const OUTPUT_DIR: string = fromRoot(outDirName);
const layerDirName = 'lambdaLayer';
const LAYER_DIR: string = resolve(OUTPUT_DIR, layerDirName);
const nodeDirName = 'nodejs';
const NODE_FOLDER: string = resolve(LAYER_DIR, nodeDirName);
const PACKAGE_JSON: string = resolve(NODE_FOLDER, 'package.json');

export async function buildPackageJson(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newPkg: any = { ...pkg };
  delete newPkg.scripts;
  delete newPkg.devDependencies;
  newPkg.name = pkg.name + '-lambda-layers';
  newPkg.description = 'lambda layers for ' + pkg.name;
  await writeFile(PACKAGE_JSON, JSON.stringify(newPkg, undefined, 2));
}

export async function buildFileStructure(): Promise<void> {
  for (const folder of [OUTPUT_DIR, LAYER_DIR, NODE_FOLDER]) {
    // eslint-disable-next-line no-await-in-loop
    if (!(await exists(folder))) {
      // eslint-disable-next-line no-await-in-loop
      await mkdir(folder);
    }
  }
}

export async function syncDependencies(): Promise<void> {
  await buildFileStructure();
  await buildPackageJson();
  await exec(`cd ${[outDirName, layerDirName, nodeDirName].join(sep)} && npm i --only=prod --no-package-lock`);
}

if (require.main === module) {
  syncDependencies();
}
