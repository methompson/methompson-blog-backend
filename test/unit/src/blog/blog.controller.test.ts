import { Request } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';

import { BlogController } from '@/src/blog/blog.controller';
import { InMemoryBlogService } from '@/src/blog/blog.memory.service';
import { LoggerService } from '@/src/logger/logger.service';
import { BlogPost } from '@/src/models/blog_post_model';
import { InvalidInputError } from '@/src/errors/invalid_input_error';
import { UserAuthRequest } from '@/src/middleware/auth_model_decorator';

const post1 = new BlogPost(
  'id1',
  'title1',
  'slug1',
  'body1',
  ['tag1'],
  'authorId1',
  new Date('2022-08-15'),
  {},
);

const post2 = new BlogPost(
  'id2',
  'title2',
  'slug2',
  'body2',
  ['tag2'],
  'authorId2',
  new Date('2022-08-10'),
  {},
);

const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});

describe('BlogController', () => {
  describe('getPosts', () => {
    test('returns the value returned from the blogService', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const page = 2;
      const pagination = 8;

      // Coercing this value into a Request object just to get TS to shut up
      const req = {
        query: {
          page: `${page}`,
          pagination: `${pagination}`,
        },
      } as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => ({
        posts: [post1, post2],
        morePages: false,
      }));

      const result = await controller.getPosts(req);

      expect(getPostsSpy).toHaveBeenCalledTimes(1);
      expect(getPostsSpy).toHaveBeenCalledWith(page, pagination);

      expect(result.posts.length).toBe(2);
      expect(result.morePages).toBe(false);

      const resultPost1 = result.posts[0];
      expect(resultPost1.toJSON()).toStrictEqual(post1.toJSON());

      const resultPost2 = result.posts[1];
      expect(resultPost2.toJSON()).toStrictEqual(post2.toJSON());
    });

    test('returns an empty array if the blogService returns an empty array', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {} as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => ({
        posts: [],
        morePages: false,
      }));

      const result = await controller.getPosts(req);

      expect(result.posts.length).toBe(0);
    });

    test('uses default page and pagination values if none are provided', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {} as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => ({
        posts: [],
        morePages: false,
      }));

      await controller.getPosts(req);

      expect(getPostsSpy).toHaveBeenCalledWith(1, 10);
    });

    test('uses default page and pagination values if provided values are not string numbers', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {
        query: {
          page: 100,
          pagination: 25,
        },
      } as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => ({
        posts: [],
        morePages: false,
      }));

      await controller.getPosts(req);

      expect(getPostsSpy).toHaveBeenCalledWith(1, 10);
    });

    test('throws an error if getPosts throws an error', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {} as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => {
        throw new Error('test error');
      });

      expect(() => controller.getPosts(req)).rejects.toThrow();
    });

    test('logs an error if getPosts throws an error', async () => {
      expect.assertions(1);

      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {} as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => {
        throw new Error('test error');
      });

      const loggerSpy = jest.spyOn(loggerService, 'addErrorLog');

      try {
        await controller.getPosts(req);
      } catch (e) {
        expect(loggerSpy).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('findBySlug', () => {
    test('Returns the value returned by findBySlug', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const slug = 'slug';

      const req = {
        params: {
          slug,
        },
      } as unknown as Request;

      const findBySlugSpy = jest.spyOn(blogService, 'findBySlug');
      findBySlugSpy.mockImplementationOnce(async () => post1);

      const value = await controller.findBySlug(req);

      expect(value.toJSON()).toStrictEqual(post1.toJSON());

      expect(findBySlugSpy).toHaveBeenCalledTimes(1);
      expect(findBySlugSpy).toHaveBeenCalledWith(slug);
    });

    test('throws an error if no slug is provided', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {
        params: {},
      } as unknown as Request;

      expect(() => controller.findBySlug(req)).rejects.toThrow(
        new HttpException('Invalid Slug', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the slug is an empty string', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {
        params: {
          slug: '',
        },
      } as unknown as Request;

      expect(() => controller.findBySlug(req)).rejects.toThrow(
        new HttpException('Invalid Slug', HttpStatus.BAD_REQUEST),
      );
    });

    test('Does not run findBySlug if slug is invalid', async () => {
      expect.assertions(1);

      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {
        params: {},
      } as unknown as Request;

      const findBySlugSpy = jest.spyOn(blogService, 'findBySlug');
      findBySlugSpy.mockImplementationOnce(async () => post1);

      try {
        await controller.findBySlug(req);
      } catch (e) {
        expect(findBySlugSpy).not.toHaveBeenCalled();
      }
    });

    test('Throws an error if findBySlug throws an error', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {
        params: {
          slug: 'slug',
        },
      } as unknown as Request;

      const findBySlugSpy = jest.spyOn(blogService, 'findBySlug');
      findBySlugSpy.mockImplementationOnce(async () => {
        throw new Error('Test Error');
      });

      expect(() => controller.findBySlug(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    test('Throws a specific error if findBySlug throws an InvalidInputError', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {
        params: {
          slug: 'slug',
        },
      } as unknown as Request;

      const findBySlugSpy = jest.spyOn(blogService, 'findBySlug');
      findBySlugSpy.mockImplementationOnce(async () => {
        throw new InvalidInputError('Test Error');
      });

      expect(() => controller.findBySlug(req)).rejects.toThrow(
        new HttpException('No Blog Post', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('addNewPost', () => {
    test('Returns a blog post returned by addBlogPost', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const postData = post1.toJSON();

      const req = {
        body: postData,
        authModel: { authorized: true },
      } as unknown as UserAuthRequest;

      const addBlogPostSpy = jest.spyOn(blogService, 'addBlogPost');
      addBlogPostSpy.mockImplementationOnce(async () => post1);

      const value = await controller.addNewPost(req);

      expect(value.toJSON()).toStrictEqual(post1.toJSON());

      expect(addBlogPostSpy).toHaveBeenCalledTimes(1);
      expect(addBlogPostSpy).toHaveBeenCalledWith(postData);
    });

    test('Throws a specific error if addBlogPost throws an InvalidInputError', async () => {
      expect.assertions(2);

      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const postData = post1.toJSON();

      const req = {
        body: postData,
        authModel: { authorized: true },
      } as unknown as UserAuthRequest;

      const addBlogPostSpy = jest.spyOn(blogService, 'addBlogPost');
      addBlogPostSpy.mockImplementationOnce(() => {
        throw new InvalidInputError('');
      });

      try {
        await controller.addNewPost(req);
      } catch (e) {
        expect(e).toStrictEqual(
          new HttpException(
            'Invalid New Blog Post Input',
            HttpStatus.BAD_REQUEST,
          ),
        );
        expect(addBlogPostSpy).toHaveBeenCalledTimes(1);
      }
    });

    test('Throws an error if addBlogPost throws an error', async () => {
      expect.assertions(2);

      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const postData = post1.toJSON();

      const req = {
        body: postData,
        authModel: { authorized: true },
      } as unknown as UserAuthRequest;

      const addBlogPostSpy = jest.spyOn(blogService, 'addBlogPost');
      addBlogPostSpy.mockImplementationOnce(() => {
        throw new Error('');
      });

      try {
        await controller.addNewPost(req);
      } catch (e) {
        expect(e).toStrictEqual(
          new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
        );
        expect(addBlogPostSpy).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('deleteBlogPost', () => {});
});