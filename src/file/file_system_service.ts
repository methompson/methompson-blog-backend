import { Stats } from 'fs';
import { mkdir, copyFile, rm, stat } from 'fs/promises';
import * as path from 'path';

import { DeleteFilesJSON } from '@/src/file/file_data.service';

/**
 * The FileService class represents an API to handle file operations. It performs
 * operations such as moving, renaming, deleting and reading files.
 */
export class FileSystemService {
  getNewFileName() {
    throw new Error('unimplemented');
  }

  async getFileInfo(pathToFile: string): Promise<Stats> {
    return await stat(pathToFile);
  }

  async pathExists(pathToFile: string) {
    await this.getFileInfo(pathToFile);
  }

  async makeDirectory(path: string) {
    await mkdir(path, {
      recursive: true,
    });
  }

  async moveFile(oldPath: string, newPath: string) {
    await copyFile(oldPath, newPath);
  }

  async deleteFile(filepath: string) {
    await rm(filepath);
  }

  async deleteFiles(
    filepath: string,
    filenames: string[],
  ): Promise<Record<string, DeleteFilesJSON>> {
    const output: Record<string, DeleteFilesJSON> = {};

    const ops = filenames.map(async (filename) => {
      try {
        await this.deleteFile(path.join(filepath, filename));
        output[filename] = {
          filename,
        };
      } catch (e) {
        output[filename] = {
          filename,
          error: e.toString(),
        };
      }
    });

    await Promise.all(ops);

    return output;
  }
}
