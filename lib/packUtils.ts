/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-dynamic-delete */

import { resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { ROOT_DIR, exec, getDirectoriesAtPath, getPackageDirectories } from '.';

interface DependencyDict {
  /**
   * /package-path : ttec-dig-vf dependency paths
   */
  [name: string]: string[];
}

const rootJsonPath = resolve(ROOT_DIR, 'package.json');
const packsDir = resolve(ROOT_DIR, 'packs');

function loadJson(jsonPath: string) {
  return JSON.parse(readFileSync(jsonPath, 'utf-8'));
}

/**
 * Locate absolute paths for @ttec-dig-vf dependencies, by project
 */
async function getTTECPaths(): Promise<DependencyDict> {
  const allDirs = await getPackageDirectories(true);
  const ttecPaths: DependencyDict = {};

  for (const dir of allDirs) {
    const path = resolve(dir, 'node_modules', '@ttec-dig-vf');
    if (!existsSync(path)) {
      continue;
    }
    const packagePaths = await getDirectoriesAtPath(path);
    if (packagePaths.length) {
      ttecPaths[dir] = packagePaths;
    }
  }
  return ttecPaths;
}

/**
 * Store ttec-dig-vf dependencies as tarballs in the ./packs directory
 */
async function generatePackFiles(paths: DependencyDict) {
  if (!existsSync(packsDir)) {
    await exec(`mkdir ${packsDir}`);
  }
  const all = Object.values(paths).flat();
  const packPromises = all.map(p => exec(`npm pack ${p} --pack-destination ${packsDir}`));
  await Promise.all(packPromises);
}

/**
 * Configure project to use the ./packs folder for ttec-dig-vf dependencies
 */
export async function installPackFiles() {
  const ttecPaths = await getTTECPaths();
  try {
    await generatePackFiles(ttecPaths);

    const overrides: Record<string, string> = {};

    for (const [projectDir, depPaths] of Object.entries(ttecPaths)) {
      const projectDeps: string[] = [];
      const projectJson = loadJson(resolve(projectDir, 'package.json'));
      Object.keys(projectJson?.dependencies || {}).forEach(x => projectDeps.push(x));
      Object.keys(projectJson?.devDependencies || {}).forEach(x => projectDeps.push(x));

      for (const depPath of depPaths) {
        const packageJson = loadJson(resolve(depPath, 'package.json'));
        const packageName = packageJson.name;
        const localPackName = `ttec-dig-vf-${packageName.split('/').pop()}-${packageJson.version}.tgz`;

        if (projectDeps.includes(packageName)) {
          // Install the local version
          await exec(`(cd ${projectDir} && npm i ${resolve(packsDir, localPackName)})`);
        }

        // Override nested package dependencies
        overrides[packageJson.name] = `file:packs/${localPackName}`;
      }
    }

    // Update overrides
    if (Object.keys(overrides).length) {
      const rootPackageJson = loadJson(rootJsonPath);
      rootPackageJson.overrides = overrides;
      writeFileSync(rootJsonPath, JSON.stringify(rootPackageJson, null, 2));
      await exec('npm i', false);
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Undo the installPackFiles configuration.
 * Use this for upgrading from the GH registry
 */
export async function resetPackFiles() {
  const ttecPaths = await getTTECPaths();
  try {
    for (const projectDir of Object.keys(ttecPaths)) {
      const projectJsonPath = resolve(projectDir, 'package.json');
      const projectJson = loadJson(projectJsonPath);

      let shouldDeletePackageLock = false;
      const resetDependencies = (deps: Record<string, string>) => {
        if (!deps) {
          return;
        }
        Object.entries(deps).forEach(([key, value]) => {
          if (key.startsWith('@ttec-dig-vf/') && value.startsWith('file:packs/')) {
            const version = value.replace('.tgz', '').split('-').pop();
            deps[key] = `^${version}`;
            shouldDeletePackageLock = true;
          }
        });
      };

      resetDependencies(projectJson?.dependencies);
      resetDependencies(projectJson?.devDependencies);

      writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 2));

      if (shouldDeletePackageLock) {
        await exec(`(cd ${projectDir} && rimraf package-lock.json)`);
      }
    }

    // Update overrides
    const rootPackageJson = loadJson(rootJsonPath);
    if (rootPackageJson.overrides) {
      const overrides = rootPackageJson.overrides as Record<string, string>;
      Object.entries(overrides).forEach(([key, value]) => {
        if (key.startsWith('@ttec-dig-vf/') && value.startsWith('file:packs/')) {
          delete rootPackageJson.overrides[key];
        }
      });
      if (Object.entries(overrides).length === 0) {
        delete rootPackageJson.overrides;
      }
      writeFileSync(rootJsonPath, JSON.stringify(rootPackageJson, null, 2));
      await exec('npm i', false);
    }
  } catch (error) {
    console.log(error);
  }
}
