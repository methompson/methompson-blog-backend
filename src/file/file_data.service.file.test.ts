import { mkdir, open } from 'fs/promises';
import { Buffer } from 'node:buffer';
import { join } from 'path';

import {
  FILE_NAME,
  FileFileDataService,
} from '@/src/file/file_data.service.file';
import {
  FileDetailsMetadata,
  NewFileDetails,
  FileDetails,
} from '@/src/models/file_models';

const filepath = 'path/to/file';

const originalFilename1 = 'originalFilename1';
const filename1 = '1e10c7c6-26d8-4a68-8d04-54af93ac9142';
const dateAdded1 = new Date(1);
const authorId1 = '123';
const mimetype1 = 'image/jpeg';
const size1 = 1024;
const isPrivate1 = true;
const metadata1: FileDetailsMetadata = {};

const nfd1 = new NewFileDetails(
  filepath,
  originalFilename1,
  filename1,
  dateAdded1,
  authorId1,
  mimetype1,
  size1,
  isPrivate1,
  metadata1,
);

const originalFilename2 = 'originalFilename2';
const filename2 = '94ee3041-90e9-455c-b124-1eacdfaa3b45';
const dateAdded2 = new Date(2);
const authorId2 = '987';
const mimetype2 = 'application/json';
const size2 = 512;
const isPrivate2 = false;
const metadata2: FileDetailsMetadata = {};

const nfd2 = new NewFileDetails(
  filepath,
  originalFilename2,
  filename2,
  dateAdded2,
  authorId2,
  mimetype2,
  size2,
  isPrivate2,
  metadata2,
);

const fd1 = FileDetails.fromNewFileDetails('id1', nfd1);
const fd2 = FileDetails.fromNewFileDetails('id2', nfd2);

jest.mock('fs/promises', () => {
  const mkdir = jest.fn();
  const open = jest.fn();

  return {
    mkdir,
    open,
  };
});

const closeMock = jest.fn();
const readFileMock = jest.fn();
const truncateMock = jest.fn();
const writeMock = jest.fn();

function MockFileHandle() {}
MockFileHandle.prototype.close = closeMock;
MockFileHandle.prototype.readFile = readFileMock;
MockFileHandle.prototype.truncate = truncateMock;
MockFileHandle.prototype.write = writeMock;

const mockOpen = open as unknown as jest.Mock;
const mockMkdir = mkdir as unknown as jest.Mock;

const testError = 'test error aoisdhfjnk';

describe('FileFileDataService', () => {
  const makeFileHandleSpy = jest.spyOn(FileFileDataService, 'makeFileHandle');
  const writeBackupSpy = jest.spyOn(FileFileDataService, 'writeBackup');

  beforeEach(() => {
    closeMock.mockReset();
    readFileMock.mockReset();
    truncateMock.mockReset();
    writeMock.mockReset();
    mockMkdir.mockReset();
    mockOpen.mockReset();

    makeFileHandleSpy.mockClear();
    writeBackupSpy.mockClear();
  });

  describe('addFiles', () => {
    test('Adds a file', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileFileDataService(await open(''), 'path');

      expect(svc.filesList.length).toBe(0);

      await svc.addFiles([nfd1]);

      expect(svc.filesList.length).toBe(1);

      const post = svc.filesList[0];
      expect(post.toJSON()).toStrictEqual(
        expect.objectContaining(nfd1.toJSON()),
      );
    });

    test('Runs writeToFile', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileFileDataService(await open(''), 'path');

      const writeToFileSpy = jest.spyOn(svc, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await svc.addFiles([nfd1]);

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if writeToFile throws an error', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileFileDataService(await open(''), 'path');

      const writeToFileSpy = jest.spyOn(svc, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.addFiles([nfd1])).rejects.toThrow(testError);

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteFiles', () => {
    test('deletes a file from files, returns post', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileFileDataService(await open(''), 'path', [fd1, fd2]);
      expect(svc.filesList.length).toBe(2);

      const result = await svc.deleteFiles([fd1.filename]);
      expect(svc.filesList.length).toBe(1);
      expect(result[fd1.filename]?.fileDetails).toBe(fd1);
    });

    test('throws an error if the slug does not exist', async () => {
      const svc = new FileFileDataService(await open(''), 'path', [fd1, fd2]);
      expect(svc.filesList.length).toBe(2);

      await expect(() => svc.deleteFiles(['not a filename'])).rejects.toThrow();
      expect(svc.filesList.length).toBe(2);
    });

    test('Runs writeToFile', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileFileDataService(await open(''), 'path', [fd1, fd2]);

      const writeToFileSpy = jest.spyOn(svc, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await svc.deleteFiles([fd1.filename]);

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if writeToFile throws an error', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileFileDataService(await open(''), 'path', [fd1, fd2]);

      const writeToFileSpy = jest.spyOn(svc, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.deleteFiles([fd1.filename])).rejects.toThrow(
        testError,
      );

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('fileString', () => {
    test('Returns a JSON string with an empty array with no posts', async () => {
      const svc = new FileFileDataService(await open(''), 'path');
      expect(svc.fileString).toBe('[]');
    });

    test('Returns a JSON string with expected values', async () => {
      const svc = new FileFileDataService(await open(''), 'path', [fd1]);
      expect(svc.fileString).toBe(`[${JSON.stringify(fd1.toJSON())}]`);
    });
  });

  describe('writeToFile', () => {
    test('gets the string, runs truncate and writes to the file handle', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const svc = new FileFileDataService(await open(''), 'path', [fd1]);

      const str = svc.fileString;

      await svc.writeToFile();

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.write).toHaveBeenCalledWith(str, 0);
    });

    test('Throws an error if truncate throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new FileFileDataService(await open(''), 'path', [fd1]);

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(0);
    });

    test('Throws an error if write throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new FileFileDataService(await open(''), 'path', [fd1]);

      const str = svc.fileString;

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.write).toHaveBeenCalledWith(str, 0);
    });
  });

  describe.skip('backup', () => {
    test('runs writeBackup with expected values', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileFileDataService(await open(''), 'path', [fd1]);
      await svc.backup();

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('blog_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.fileString, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);

      const svc = new FileFileDataService(await open(''), 'path', [fd1]);

      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('blog_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if truncate throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileFileDataService(await open(''), 'path', [fd1]);

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('blog_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if write throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileFileDataService(await open(''), 'path', [fd1]);

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('blog_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.fileString, 0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if close throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileFileDataService(await open(''), 'path', [fd1]);

      closeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('blog_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.fileString, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe.skip('makeFileHandle', () => {
    const path = 'path/to/file';
    const name = 'name.ext';

    test('calls mkdir and open', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const result = await FileFileDataService.makeFileHandle(path, name);

      expect(result).toBe(mockFileHandle);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, name), 'a+');
    });

    test('uses the default file name if not provided', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const result = await FileFileDataService.makeFileHandle(path);

      expect(result).toBe(mockFileHandle);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, FILE_NAME), 'a+');
    });

    test('throws an error if mkdir throws an error', async () => {
      mockMkdir.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() =>
        FileFileDataService.makeFileHandle(path, name),
      ).rejects.toThrow(testError);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(0);
    });

    test('throws an error if open throws an error', async () => {
      mockOpen.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() =>
        FileFileDataService.makeFileHandle(path, name),
      ).rejects.toThrow(testError);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, name), 'a+');
    });
  });

  describe.skip('writeBackup', () => {
    const stringData = 'string data';
    const backupPath = 'backupPath';
    const filename = 'name';

    test('runs functions with expected values', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      await FileFileDataService.writeBackup(backupPath, stringData, 'name');

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(stringData, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileFileDataService.writeBackup(backupPath, stringData, 'name'),
      ).rejects.toThrow();

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if truncate throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileFileDataService.writeBackup(backupPath, stringData, 'name'),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if write throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileFileDataService.writeBackup(backupPath, stringData, 'name'),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(stringData, 0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if close throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      closeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileFileDataService.writeBackup(backupPath, stringData, 'name'),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(stringData, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe.skip('init', () => {
    const blogPath = 'blog path';

    test('creates a file handle, reads a file, creates blog posts and returns a new FileFileDataService', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from(JSON.stringify([fd1, fd2]), 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FileFileDataService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).filesList.length).toBe(4);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('Only includes posts that are valid', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from(JSON.stringify([fd1, fd2, {}]), 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FileFileDataService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).filesList.length).toBe(3);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('If the raw data buffer is a zero length string, truncate and write are called', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FileFileDataService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).filesList.length).toBe(0);
    });

    test('If the raw data buffer is a non-zero length non-JSON string, truncate and write are called and a backup is made', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {});

      const svc = await FileFileDataService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);

      expect((await svc).filesList.length).toBe(0);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith('[]', 0);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => FileFileDataService.init(blogPath)).rejects.toThrow(
        testError,
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect(readFileMock).toHaveBeenCalledTimes(0);
      expect(writeBackupSpy).toHaveBeenCalledTimes(0);
      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if readFile throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      readFileMock.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() => FileFileDataService.init(blogPath)).rejects.toThrow(
        testError,
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);

      expect(writeBackupSpy).toHaveBeenCalledTimes(0);
      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if writeBackup throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => FileFileDataService.init(blogPath)).rejects.toThrow(
        testError,
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if truncate throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {});

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => FileFileDataService.init(blogPath)).rejects.toThrow(
        testError,
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledTimes(1);

      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if write throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {});

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => FileFileDataService.init(blogPath)).rejects.toThrow(
        testError,
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledTimes(1);
    });
  });
});
