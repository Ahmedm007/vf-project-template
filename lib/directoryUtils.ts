import { resolve, sep } from 'path';
import { readdir } from 'fs/promises';

export const ROOT_DIR = resolve(__dirname, '..');

export function fromRoot(path: string | string[]): string {
  const segments: string[] = typeof path === 'string' ? path.split(/[/\\]/).filter(seg => seg !== '') : path;
  return resolve(ROOT_DIR, ...segments);
}

/**
 * @description returns absolute path of directories within
 * location passed as path argument
 */
export async function getDirectoriesAtPath(path: string): Promise<string[]> {
  const names = await readdir(path, { withFileTypes: true });
  return names.filter(x => x.isDirectory()).map(x => resolve(path, x.name));
}

export async function getPackageDirectories(includeRoot = false) {
  const packages = await getDirectoriesAtPath(resolve(ROOT_DIR, 'packages'));
  return includeRoot ? packages.concat(ROOT_DIR) : packages;
}

export async function getPackageNames() {
  const packages = await getPackageDirectories();
  return packages.map(p => p.split(sep).pop());
}
