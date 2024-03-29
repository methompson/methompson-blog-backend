import * as uuid from 'uuid';
import * as path from 'path';

import {
  FileDetails,
  FileDetailsMetadata,
  NewFileDetailsJSON,
  ParsedFilesAndFields,
  UploadedFile,
  FileDetailsJSON,
} from '@/src/models/file_models';
import { FileOpsService } from '@/src/file/file_ops.service';
import { InMemoryFileDataService } from '@/src/file/file_data.service.memory';
import { FileSystemService } from '@/src/file/file_system_service';

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

describe('FileOpsService', () => {
  const testError = 'testError aosdlkfsdf';

  const authorId = 'bd70a89c-b862-44ad-a980-a884ae9df5ad';
  const filepath = '3d8ecf2d-7629-4132-8665-7f14d94b6887';

  const id1 = '9cc7ca64-5fa4-42ef-b790-67b640c76d28';
  const filename1 = 'originalFileName1';
  const mimetype1 = 'image/jpeg';
  const size1 = 1024;
  const metadata1: FileDetailsMetadata = {};

  const id2 = '8c17b304-4fbf-477a-be84-05117ed4393e';
  const filename2 = 'originalFileName2';
  const mimetype2 = 'application/json';
  const size2 = 512;
  const metadata2: FileDetailsMetadata = {};

  const uploadedFile1 = new UploadedFile(filepath, filename1, mimetype1, size1);

  const uploadedFile2 = new UploadedFile(filepath, filename2, mimetype2, size2);

  const newFileDetails1: NewFileDetailsJSON = {
    filepath,
    fileDetails: FileDetails.fromJSON({
      filename: filename1,
      id: id1,
      dateAdded: new Date().toISOString(),
      authorId,
      mimetype: mimetype1,
      size: size1,
      isPrivate: true,
      metadata: {},
    }),
  };

  const newFileDetails2: NewFileDetailsJSON = {
    filepath,
    fileDetails: FileDetails.fromJSON({
      filename: filename2,
      id: id2,
      dateAdded: new Date().toISOString(),
      authorId,
      mimetype: mimetype2,
      size: size2,
      isPrivate: true,
      metadata: {},
    }),
  };

  const fileDetailsJSON1: FileDetailsJSON = {
    filename: filename1,
    id: id1,
    dateAdded: new Date(1).toISOString(),
    authorId: authorId,
    mimetype: mimetype1,
    size: size1,
    isPrivate: true,
    metadata: metadata1,
  };
  const fileDetails1 = FileDetails.fromJSON(fileDetailsJSON1);

  const fileDetailsJSON2: FileDetailsJSON = {
    filename: filename2,
    id: id2,
    dateAdded: new Date(2).toISOString(),
    authorId: authorId,
    mimetype: mimetype2,
    size: size2,
    isPrivate: true,
    metadata: metadata2,
  };
  const fileDetails2 = FileDetails.fromJSON(fileDetailsJSON2);

  const savedFilePath = 'savedFilePath';
  const uploadFilePath = 'uploadFilePath';

  beforeEach(() => {
    uuidv4.mockReset();
    uuidv4.mockClear();

    uuidv4.mockImplementation(() => 'v4');
  });

  describe('saveUploadedFiles', () => {
    test('Makes new file details and returns the results from saveFilesToService', async () => {
      const parsedFiles: ParsedFilesAndFields = {
        files: [uploadedFile1, uploadedFile2],
        ops: {},
        fileOps: {},
      };

      let x = 0;
      uuidv4.mockImplementation(() => {
        if (x === 0) {
          x++;
          return id1;
        } else {
          return id2;
        }
      });

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      const saveFilesToSystemSpy = jest.spyOn(fos, 'saveFilesToFileSystem');
      saveFilesToSystemSpy.mockImplementation(async () => {});

      const saveFilesToServiceSpy = jest.spyOn(fos, 'saveFilesToService');
      saveFilesToServiceSpy.mockImplementationOnce(async () => [
        fileDetails1,
        fileDetails2,
      ]);

      const result = await fos.saveUploadedFiles(parsedFiles, authorId);

      const file1 = result.find((el) => el.id === id1);
      expect(file1?.toJSON()).toMatchObject({
        filename: uploadedFile1.originalFilename,
        id: id1,
        authorId,
        mimetype: uploadedFile1.mimetype,
        size: uploadedFile1.size,
        isPrivate: true,
        metadata: {},
      });

      const file2 = result.find((el) => el.id === id2);
      expect(file2?.toJSON()).toMatchObject({
        filename: uploadedFile2.originalFilename,
        id: id2,
        authorId,
        mimetype: uploadedFile2.mimetype,
        size: uploadedFile2.size,
        isPrivate: true,
        metadata: {},
      });
    });

    test('runs makeNewFileDetails, saveFilesToService and saveFilesToFileSystem with expected input', async () => {
      const parsedFiles: ParsedFilesAndFields = {
        files: [uploadedFile1, uploadedFile2],
        ops: {},
        fileOps: {},
      };

      let x = 0;
      uuidv4.mockImplementation(() => {
        if (x === 0) {
          x++;
          return id1;
        } else {
          return id2;
        }
      });

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      const newFileResults = fos.makeNewFileDetails(parsedFiles, authorId);

      const makeFileSpy = jest.spyOn(fos, 'makeNewFileDetails');
      makeFileSpy.mockImplementationOnce(() => newFileResults);

      const saveFilesToSystemSpy = jest.spyOn(fos, 'saveFilesToFileSystem');
      saveFilesToSystemSpy.mockImplementation(async () => {});

      const saveFilesToServiceSpy = jest.spyOn(fos, 'saveFilesToService');
      saveFilesToServiceSpy.mockImplementationOnce(async () => [
        fileDetails1,
        fileDetails2,
      ]);

      await fos.saveUploadedFiles(parsedFiles, authorId);

      expect(makeFileSpy).toHaveBeenCalledTimes(1);
      expect(makeFileSpy).toHaveBeenCalledWith(parsedFiles, authorId);

      expect(saveFilesToServiceSpy).toHaveBeenCalledTimes(1);
      expect(saveFilesToServiceSpy).toHaveBeenCalledWith(newFileResults);

      expect(saveFilesToSystemSpy).toHaveBeenCalledTimes(1);
      expect(saveFilesToSystemSpy).toHaveBeenCalledWith(newFileResults);
    });

    test('throws an error if makeNewFileDetails throws an error', async () => {
      const parsedFiles: ParsedFilesAndFields = {
        files: [uploadedFile1, uploadedFile2],
        ops: {},
        fileOps: {},
      };

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      const makeNewSpy = jest.spyOn(fos, 'makeNewFileDetails');
      makeNewSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      const saveFilesToSystemSpy = jest.spyOn(fos, 'saveFilesToFileSystem');
      saveFilesToSystemSpy.mockImplementation(async () => {});
      const saveFilesToServiceSpy = jest.spyOn(fos, 'saveFilesToService');

      await expect(() =>
        fos.saveUploadedFiles(parsedFiles, authorId),
      ).rejects.toThrow(testError);

      expect(makeNewSpy).toHaveBeenCalledTimes(1);
      expect(saveFilesToServiceSpy).toHaveBeenCalledTimes(0);
      expect(saveFilesToSystemSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if saveFilesToFileSystem throws an error', async () => {
      const parsedFiles: ParsedFilesAndFields = {
        files: [uploadedFile1, uploadedFile2],
        ops: {},
        fileOps: {},
      };

      let x = 0;
      uuidv4.mockImplementation(() => {
        if (x === 0) {
          x++;
          return id1;
        } else {
          return id2;
        }
      });

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      const newFileResults = fos.makeNewFileDetails(parsedFiles, authorId);

      const rollBackSpy = jest.spyOn(fos, 'rollBackFSWrites');
      rollBackSpy.mockImplementationOnce(async () => {});

      const makeFileSpy = jest.spyOn(fos, 'makeNewFileDetails');
      makeFileSpy.mockImplementationOnce(() => newFileResults);

      const saveFilesToSystemSpy = jest.spyOn(fos, 'saveFilesToFileSystem');
      saveFilesToSystemSpy.mockImplementation(async () => {
        throw new Error(testError);
      });
      const saveFilesToServiceSpy = jest.spyOn(fos, 'saveFilesToService');

      await expect(() =>
        fos.saveUploadedFiles(parsedFiles, authorId),
      ).rejects.toThrow(testError);

      expect(makeFileSpy).toHaveBeenCalledTimes(1);
      expect(makeFileSpy).toHaveBeenCalledWith(parsedFiles, authorId);

      expect(saveFilesToSystemSpy).toHaveBeenCalledTimes(1);
      expect(saveFilesToSystemSpy).toHaveBeenCalledWith(newFileResults);

      expect(saveFilesToServiceSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if saveFilesToService throws an error', async () => {
      const parsedFiles: ParsedFilesAndFields = {
        files: [uploadedFile1, uploadedFile2],
        ops: {},
        fileOps: {},
      };

      let x = 0;
      uuidv4.mockImplementation(() => {
        if (x === 0) {
          x++;
          return id1;
        } else {
          return id2;
        }
      });

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      const newFileResults = fos.makeNewFileDetails(parsedFiles, authorId);

      const rollBackSpy = jest.spyOn(fos, 'rollBackFSWrites');
      rollBackSpy.mockImplementationOnce(async () => {});

      const makeFileSpy = jest.spyOn(fos, 'makeNewFileDetails');
      makeFileSpy.mockImplementationOnce(() => newFileResults);

      const saveFilesToSystemSpy = jest.spyOn(fos, 'saveFilesToFileSystem');
      saveFilesToSystemSpy.mockImplementation(async () => {});

      const saveFilesToServiceSpy = jest.spyOn(fos, 'saveFilesToService');
      saveFilesToServiceSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        fos.saveUploadedFiles(parsedFiles, authorId),
      ).rejects.toThrow(testError);

      expect(makeFileSpy).toHaveBeenCalledTimes(1);
      expect(makeFileSpy).toHaveBeenCalledWith(parsedFiles, authorId);

      expect(saveFilesToServiceSpy).toHaveBeenCalledTimes(1);
      expect(saveFilesToServiceSpy).toHaveBeenCalledWith(newFileResults);

      expect(saveFilesToSystemSpy).toHaveBeenCalledTimes(1);
      expect(saveFilesToSystemSpy).toHaveBeenCalledWith(newFileResults);
    });

    test('does not run rollBackWrites when makeNewFileDetails throws an error', async () => {
      const parsedFiles: ParsedFilesAndFields = {
        files: [uploadedFile1, uploadedFile2],
        ops: {},
        fileOps: {},
      };

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      const rollBackSpy = jest.spyOn(fos, 'rollBackFSWrites');

      const makeNewSpy = jest.spyOn(fos, 'makeNewFileDetails');
      makeNewSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() =>
        fos.saveUploadedFiles(parsedFiles, authorId),
      ).rejects.toThrow(testError);

      expect(rollBackSpy).toHaveBeenCalledTimes(0);
    });

    test('runs rollBackWrites when an error is thrown and makeNewFileDetails succeeds', async () => {
      const files = [uploadedFile1, uploadedFile2];
      const parsedFiles: ParsedFilesAndFields = {
        files,
        ops: {},
        fileOps: {},
      };

      let x = 0;
      uuidv4.mockImplementation(() => {
        if (x === 0) {
          x++;
          return id1;
        } else {
          return id2;
        }
      });

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      const newFileResults = fos.makeNewFileDetails(parsedFiles, authorId);

      const rollBackSpy = jest.spyOn(fos, 'rollBackFSWrites');
      rollBackSpy.mockImplementationOnce(async () => {});

      const makeFileSpy = jest.spyOn(fos, 'makeNewFileDetails');
      makeFileSpy.mockImplementationOnce(() => newFileResults);

      const saveFilesToSystemSpy = jest.spyOn(fos, 'saveFilesToFileSystem');
      saveFilesToSystemSpy.mockImplementation(async () => {});
      const saveFilesSpy = jest.spyOn(fos, 'saveFilesToService');
      saveFilesSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        fos.saveUploadedFiles(parsedFiles, authorId),
      ).rejects.toThrow(testError);

      expect(rollBackSpy).toHaveBeenCalledTimes(1);
      expect(rollBackSpy).toHaveBeenCalledWith(newFileResults, files);
    });

    test('throws an error if saveFilesToFileSystem throws an error and rollBackWrites throws an error', async () => {
      const files = [uploadedFile1, uploadedFile2];
      const parsedFiles: ParsedFilesAndFields = {
        files,
        ops: {},
        fileOps: {},
      };

      let x = 0;
      uuidv4.mockImplementation(() => {
        if (x === 0) {
          x++;
          return id1;
        } else {
          return id2;
        }
      });

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      const newFileResults = fos.makeNewFileDetails(parsedFiles, authorId);

      const newError = 'Another Error oaishdfkasd';
      const rollBackSpy = jest.spyOn(fos, 'rollBackFSWrites');
      rollBackSpy.mockImplementationOnce(() => {
        throw new Error(newError);
      });

      const makeFileSpy = jest.spyOn(fos, 'makeNewFileDetails');
      makeFileSpy.mockImplementationOnce(() => newFileResults);

      const saveFilesToSystemSpy = jest.spyOn(fos, 'saveFilesToFileSystem');
      saveFilesToSystemSpy.mockImplementation(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        fos.saveUploadedFiles(parsedFiles, authorId),
      ).rejects.toThrow(newError);

      expect(rollBackSpy).toHaveBeenCalledTimes(1);
      expect(rollBackSpy).toHaveBeenCalledWith(newFileResults, files);
    });

    test('throws an error if saveFilesToService throws an error and rollBackWrites throws an error', async () => {
      const files = [uploadedFile1, uploadedFile2];
      const parsedFiles: ParsedFilesAndFields = {
        files,
        ops: {},
        fileOps: {},
      };

      let x = 0;
      uuidv4.mockImplementation(() => {
        if (x === 0) {
          x++;
          return id1;
        } else {
          return id2;
        }
      });

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      const newFileResults = fos.makeNewFileDetails(parsedFiles, authorId);

      const newError = 'Another Error oaishdfkasd';
      const rollBackSpy = jest.spyOn(fos, 'rollBackFSWrites');
      rollBackSpy.mockImplementationOnce(() => {
        throw new Error(newError);
      });

      const makeFileSpy = jest.spyOn(fos, 'makeNewFileDetails');
      makeFileSpy.mockImplementationOnce(() => newFileResults);

      const saveFilesToSystemSpy = jest.spyOn(fos, 'saveFilesToFileSystem');
      saveFilesToSystemSpy.mockImplementation(async () => {});

      const saveFilesSpy = jest.spyOn(fos, 'saveFilesToService');
      saveFilesSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        fos.saveUploadedFiles(parsedFiles, authorId),
      ).rejects.toThrow(newError);

      expect(rollBackSpy).toHaveBeenCalledTimes(1);
      expect(rollBackSpy).toHaveBeenCalledWith(newFileResults, files);
    });
  });

  describe('makeNewFileDetails', () => {
    test('creates new files for all files provided', () => {
      const parsedFiles: ParsedFilesAndFields = {
        files: [uploadedFile1, uploadedFile2],
        ops: {},
        fileOps: {},
      };

      let x = 0;
      uuidv4.mockImplementation(() => {
        if (x === 0) {
          x++;
          return id1;
        } else {
          return id2;
        }
      });

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      const result = fos.makeNewFileDetails(parsedFiles, authorId);

      const file1 = result.find((el) => el.fileDetails.id === id1);
      expect(file1?.filepath).toBe(uploadedFile1.filepath);
      expect(file1?.fileDetails.toJSON()).toMatchObject({
        filename: uploadedFile1.originalFilename,
        id: id1,
        authorId,
        mimetype: uploadedFile1.mimetype,
        size: uploadedFile1.size,
        isPrivate: true,
        metadata: {},
      });

      const file2 = result.find((el) => el.fileDetails.id === id2);
      expect(file2?.filepath).toBe(uploadedFile2.filepath);
      expect(file2?.fileDetails.toJSON()).toMatchObject({
        filename: uploadedFile2.originalFilename,
        id: id2,
        authorId,
        mimetype: uploadedFile2.mimetype,
        size: uploadedFile2.size,
        isPrivate: true,
        metadata: {},
      });
    });

    test('respects isPrivate set for a fileOp', () => {
      const parsedFiles: ParsedFilesAndFields = {
        files: [uploadedFile1, uploadedFile2],
        ops: {
          isPrivate: true,
        },
        fileOps: {
          [uploadedFile1.originalFilename]: {
            isPrivate: false,
            filename: uploadedFile1.originalFilename,
          },
        },
      };

      let x = 0;
      uuidv4.mockImplementation(() => {
        if (x === 0) {
          x++;
          return id1;
        } else {
          return id2;
        }
      });

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      const result = fos.makeNewFileDetails(parsedFiles, authorId);

      const file1 = result.find((el) => el.fileDetails.id === id1);
      expect(file1?.filepath).toBe(uploadedFile1.filepath);
      expect(file1?.fileDetails.toJSON()).toMatchObject({
        filename: uploadedFile1.originalFilename,
        id: id1,
        authorId,
        mimetype: uploadedFile1.mimetype,
        size: uploadedFile1.size,
        isPrivate: false,
        metadata: {},
      });

      const file2 = result.find((el) => el.fileDetails.id === id2);
      expect(file2?.filepath).toBe(uploadedFile2.filepath);
      expect(file2?.fileDetails.toJSON()).toMatchObject({
        filename: uploadedFile2.originalFilename,
        id: id2,
        authorId,
        mimetype: uploadedFile2.mimetype,
        size: uploadedFile2.size,
        isPrivate: true,
        metadata: {},
      });
    });

    test('runs uuidv4 for all files getting mapped', () => {
      const parsedFiles: ParsedFilesAndFields = {
        files: [uploadedFile1, uploadedFile2],
        ops: {},
        fileOps: {},
      };

      uuidv4.mockImplementation(() => id1);

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      fos.makeNewFileDetails(parsedFiles, authorId);
      expect(uuidv4).toHaveBeenCalledTimes(2);
    });

    test('Throws an error if the data ops are invalid', () => {
      const parsedFiles: ParsedFilesAndFields = {
        files: [uploadedFile1, uploadedFile2],
        ops: {
          isPrivate: 'maybe',
        },
        fileOps: {},
      };

      uuidv4.mockImplementation(() => id1);

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        new InMemoryFileDataService(),
      );

      expect(() => fos.makeNewFileDetails(parsedFiles, authorId)).toThrow(
        /Invalid File Details/,
      );
    });
  });

  describe('saveFilesToFileSystem', () => {
    test('Runs FileSystemService.move for each provided file', async () => {
      const fileService = new InMemoryFileDataService();

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        fileService,
      );

      const newFiles = [newFileDetails1, newFileDetails2];

      const fss = new FileSystemService();

      const moveFileSpy = jest.spyOn(fss, 'moveFile');
      moveFileSpy.mockImplementation(async () => {});

      await fos.saveFilesToFileSystem(newFiles, fss);
    });

    test('Throws an error if FileSystemService.move throws an error for any file', async () => {
      const fileService = new InMemoryFileDataService();

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        fileService,
      );

      const newFiles = [newFileDetails1, newFileDetails2];

      const fss = new FileSystemService();

      const moveFileSpy = jest.spyOn(fss, 'moveFile');
      moveFileSpy.mockImplementation(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        fos.saveFilesToFileSystem(newFiles, fss),
      ).rejects.toThrow(testError);
    });
  });

  describe('saveFilesToService', () => {
    test('Runs FileDataService.addFiles for each provided file', async () => {
      const fileService = new InMemoryFileDataService();

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        fileService,
      );

      const addFilesSpy = jest.spyOn(fileService, 'addFiles');

      const newFiles = [newFileDetails1, newFileDetails2];

      await fos.saveFilesToService(newFiles);

      expect(addFilesSpy).toHaveBeenCalledTimes(1);
      expect(addFilesSpy).toHaveBeenCalledWith(newFiles);
    });

    test('Returns the result from saveFiles', async () => {
      const fileService = new InMemoryFileDataService();

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        fileService,
      );

      const addFilesSpy = jest.spyOn(fileService, 'addFiles');
      addFilesSpy.mockImplementationOnce(async () => [
        fileDetails1,
        fileDetails2,
      ]);

      const newFiles = [newFileDetails1, newFileDetails2];

      const result = await fos.saveFilesToService(newFiles);
      expect(result).toStrictEqual([fileDetails1, fileDetails2]);
    });

    test('Throws an error if FileDataService.addFiles throws an error for any file', async () => {
      const fileService = new InMemoryFileDataService();

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        fileService,
      );

      const addFilesSpy = jest.spyOn(fileService, 'addFiles');
      addFilesSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      const newFiles = [newFileDetails1, newFileDetails2];

      await expect(() => fos.saveFilesToService(newFiles)).rejects.toThrow(
        testError,
      );

      expect(addFilesSpy).toHaveBeenCalledTimes(1);
      expect(addFilesSpy).toHaveBeenCalledWith(newFiles);
    });
  });

  describe('rollBackWrites', () => {
    test('deleteFile is run for all NewFileDetails provided and all UploadedFile provided', async () => {
      const fileService = new InMemoryFileDataService();

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        fileService,
      );

      const fss = new FileSystemService();

      const delSpy = jest.spyOn(fss, 'deleteFile');
      delSpy.mockImplementation(async () => {});

      await fos.rollBackFSWrites(
        [newFileDetails1, newFileDetails2],
        [uploadedFile1, uploadedFile2],
        fss,
      );

      expect(delSpy).toHaveBeenCalledTimes(4);

      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails1.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails2.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(uploadedFile1.filepath);
      expect(delSpy).toHaveBeenCalledWith(uploadedFile2.filepath);
    });

    test('An error is thrown if deleteFile throws for any NewFileDetails object', async () => {
      const fileService = new InMemoryFileDataService();

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        fileService,
      );

      const fss = new FileSystemService();

      const newFilePath = path.join(
        savedFilePath,
        newFileDetails1.fileDetails.id,
      );

      const delSpy = jest.spyOn(fss, 'deleteFile');
      delSpy.mockImplementation(async (input) => {
        if (input === newFilePath) {
          throw new Error(testError);
        }
      });

      await expect(() =>
        fos.rollBackFSWrites(
          [newFileDetails1, newFileDetails2],
          [uploadedFile1, uploadedFile2],
          fss,
        ),
      ).rejects.toThrow(new RegExp(`Unable to delete files.*${newFilePath}`));

      expect(delSpy).toHaveBeenCalledTimes(4);

      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails1.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails2.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(uploadedFile1.filepath);
      expect(delSpy).toHaveBeenCalledWith(uploadedFile2.filepath);
    });

    test('An error is thrown if deleteFile throws for multiple NewFileDetails objects', async () => {
      const fileService = new InMemoryFileDataService();

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        fileService,
      );

      const fss = new FileSystemService();

      const newFile1Path = path.join(
        savedFilePath,
        newFileDetails1.fileDetails.id,
      );
      const newFile2Path = path.join(
        savedFilePath,
        newFileDetails2.fileDetails.id,
      );

      const delSpy = jest.spyOn(fss, 'deleteFile');
      delSpy.mockImplementation(async (input) => {
        if (input === newFile1Path || input === newFile2Path) {
          throw new Error(testError);
        }
      });

      await expect(() =>
        fos.rollBackFSWrites(
          [newFileDetails1, newFileDetails2],
          [uploadedFile1, uploadedFile2],
          fss,
        ),
      ).rejects.toThrow(
        new RegExp(`Unable to delete files.*${newFile1Path}.*${newFile2Path}`),
      );

      expect(delSpy).toHaveBeenCalledTimes(4);

      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails1.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails2.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(uploadedFile1.filepath);
      expect(delSpy).toHaveBeenCalledWith(uploadedFile2.filepath);
    });

    test('An error is thrown if deleteFile throws for any UploadedFile object', async () => {
      const fileService = new InMemoryFileDataService();

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        fileService,
      );

      const fss = new FileSystemService();

      const delSpy = jest.spyOn(fss, 'deleteFile');
      delSpy.mockImplementation(async (input) => {
        if (input === uploadedFile1.filepath) {
          throw new Error(testError);
        }
      });

      await expect(() =>
        fos.rollBackFSWrites(
          [newFileDetails1, newFileDetails2],
          [uploadedFile1, uploadedFile2],
          fss,
        ),
      ).rejects.toThrow(
        new RegExp(`Unable to delete files.*${uploadedFile1.filepath}`),
      );

      expect(delSpy).toHaveBeenCalledTimes(4);

      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails1.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails2.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(uploadedFile1.filepath);
      expect(delSpy).toHaveBeenCalledWith(uploadedFile2.filepath);
    });

    test('An error is thrown if deleteFile throws for multiple UploadedFile objects', async () => {
      const fileService = new InMemoryFileDataService();

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        fileService,
      );

      const fss = new FileSystemService();

      const delSpy = jest.spyOn(fss, 'deleteFile');
      delSpy.mockImplementation(async (input) => {
        if (
          input === uploadedFile1.filepath ||
          input === uploadedFile2.filepath
        ) {
          throw new Error(testError);
        }
      });

      await expect(() =>
        fos.rollBackFSWrites(
          [newFileDetails1, newFileDetails2],
          [uploadedFile1, uploadedFile2],
          fss,
        ),
      ).rejects.toThrow(
        new RegExp(
          `Unable to delete files.*${uploadedFile1.filepath}.*${uploadedFile2.filepath}`,
        ),
      );

      expect(delSpy).toHaveBeenCalledTimes(4);

      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails1.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails2.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(uploadedFile1.filepath);
      expect(delSpy).toHaveBeenCalledWith(uploadedFile2.filepath);
    });

    test('An error is thrown if deleteFile throws for any object', async () => {
      const fileService = new InMemoryFileDataService();

      const fos = new FileOpsService(
        savedFilePath,
        uploadFilePath,
        fileService,
      );

      const fss = new FileSystemService();

      const newFile1Path = path.join(
        savedFilePath,
        newFileDetails1.fileDetails.id,
      );
      const newFile2Path = path.join(
        savedFilePath,
        newFileDetails2.fileDetails.id,
      );

      const delSpy = jest.spyOn(fss, 'deleteFile');
      delSpy.mockImplementation(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        fos.rollBackFSWrites(
          [newFileDetails1, newFileDetails2],
          [uploadedFile1, uploadedFile2],
          fss,
        ),
      ).rejects.toThrow(
        new RegExp(
          `Unable to delete files.*${newFile1Path}.*${newFile2Path}.*${uploadedFile1.filepath}.*${uploadedFile2.filepath}`,
        ),
      );

      expect(delSpy).toHaveBeenCalledTimes(4);

      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails1.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(
        path.join(savedFilePath, newFileDetails2.fileDetails.id),
      );
      expect(delSpy).toHaveBeenCalledWith(uploadedFile1.filepath);
      expect(delSpy).toHaveBeenCalledWith(uploadedFile2.filepath);
    });
  });
});
