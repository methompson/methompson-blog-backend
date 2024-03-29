import { FileHandle, mkdir, open } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { BlogPost, NewBlogPost } from '@/src/models/blog_post_model';
import { InMemoryBlogService } from '@/src/blog/blog.service.memory';

const BASE_NAME = 'blog_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileBlogService extends InMemoryBlogService {
  constructor(
    protected readonly fileHandle: FileHandle,
    protected readonly blogPath: string,
    inputPosts: BlogPost[] = [],
  ) {
    super(inputPosts);
  }

  get blogString(): string {
    return JSON.stringify(Object.values(this.blogPosts));
  }

  async addBlogPost(newPost: NewBlogPost): Promise<BlogPost> {
    const post = await super.addBlogPost(newPost);

    await this.writeToFile();

    return post;
  }

  async updateBlogPost(
    oldSlug: string,
    updatedPost: BlogPost,
  ): Promise<BlogPost> {
    const post = await super.updateBlogPost(oldSlug, updatedPost);

    await this.writeToFile();

    return post;
  }

  async deleteBlogPost(slug: string): Promise<BlogPost> {
    const post = await super.deleteBlogPost(slug);

    await this.writeToFile();

    return post;
  }

  async writeToFile(): Promise<void> {
    const postsJson = this.blogString;

    await this.fileHandle.truncate(0);
    await this.fileHandle.write(postsJson, 0);
  }

  async backup() {
    const backupPath = join(this.blogPath, 'backup');
    await FileBlogService.writeBackup(backupPath, this.blogString);
  }

  static async makeFileHandle(
    blogPath: string,
    name?: string,
  ): Promise<FileHandle> {
    await mkdir(blogPath, { recursive: true });

    const filename = name ?? FILE_NAME;

    const filepath = join(blogPath, filename);

    const fileHandle = await open(filepath, 'a+');

    return fileHandle;
  }

  static async writeBackup(blogPath: string, rawData: string, name?: string) {
    const filename =
      name ??
      `${BASE_NAME}_backup_${new Date().toISOString()}.${FILE_EXTENSION}`;
    const fileHandle = await FileBlogService.makeFileHandle(blogPath, filename);

    await fileHandle.truncate(0);
    await fileHandle.write(rawData, 0);
    await fileHandle.close();
  }

  static async init(blogPath: string): Promise<FileBlogService> {
    const fileHandle = await FileBlogService.makeFileHandle(blogPath);
    const buffer = await fileHandle.readFile();

    const blogPosts: BlogPost[] = [];
    let rawData = '';

    try {
      rawData = buffer.toString();

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            blogPosts.push(BlogPost.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }
    } catch (e) {
      console.error('Invalid or no data when reading file data file', e);

      if (rawData.length > 0) {
        await FileBlogService.writeBackup(blogPath, rawData);
      }

      await fileHandle.truncate(0);
      await fileHandle.write('[]', 0);
    }

    return new FileBlogService(fileHandle, blogPath, blogPosts);
  }
}
