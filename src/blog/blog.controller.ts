import {
  Controller,
  Inject,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

import { BlogPost, NewBlogPost } from '@/src/models/blog_post_model';
import {
  DatabaseNotAvailableException,
  InvalidInputError,
  MutateDataException,
  NotFoundError,
} from '@/src/errors';
import { isString } from '@/src/utils/type_guards';

import { BlogService, BlogPostRequestOutput } from '@/src/blog/blog.service';
import { LoggerService } from '@/src/logger/logger.service';
import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { AuthRequiredIncerceptor } from '@/src/middleware/auth_interceptor';
import { pageAndPagination } from '@/src/utils/page_and_pagination';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/blog' })
export class BlogController {
  constructor(
    @Inject('BLOG_SERVICE')
    private readonly blogService: BlogService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  async getPosts(@Req() request: Request): Promise<BlogPostRequestOutput> {
    const { page, pagination } = pageAndPagination(request);

    try {
      const posts = await this.blogService.getPosts(page, pagination);
      return posts;
    } catch (e) {
      if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      await this.loggerService.addErrorLog(e);
      throw e;
    }
  }

  @Get('allPosts')
  @UseInterceptors(AuthRequiredIncerceptor)
  async getAllPosts(@Req() request: Request): Promise<BlogPostRequestOutput> {
    const { page, pagination } = pageAndPagination(request);

    try {
      const posts = await this.blogService.getAllPosts(page, pagination);
      return posts;
    } catch (e) {
      if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      await this.loggerService.addErrorLog(e);
      throw e;
    }
  }

  @Get(':slug')
  async findBySlug(@Req() request: Request): Promise<BlogPost> {
    const slug = request.params?.slug;

    if (!isString(slug) || slug.length === 0) {
      throw new HttpException('Invalid Slug', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.blogService.findBySlug(slug);
    } catch (e) {
      if (e instanceof InvalidInputError || e instanceof NotFoundError) {
        throw new HttpException('No Blog Post', HttpStatus.NOT_FOUND);
      } else if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.loggerService.addErrorLog(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @UseInterceptors(AuthRequiredIncerceptor)
  async addNewPost(@Req() request: Request): Promise<BlogPost> {
    try {
      const newPost = NewBlogPost.fromJSON(request.body);
      const post = await this.blogService.addBlogPost(newPost);

      return post;
    } catch (e) {
      if (e instanceof InvalidInputError) {
        throw new HttpException(
          'Invalid New Blog Post Input',
          HttpStatus.BAD_REQUEST,
        );
      } else if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.loggerService.addErrorLog(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('update')
  @UseInterceptors(AuthRequiredIncerceptor)
  async updatePost(@Req() request: Request): Promise<BlogPost> {
    try {
      const updatedPost = BlogPost.fromJSON(request.body?.updatedPost);
      const oldSlug = request.body?.oldSlug;

      if (!isString(oldSlug)) {
        throw new InvalidInputError('Invalid old slug');
      }

      return await this.blogService.updateBlogPost(oldSlug, updatedPost);
    } catch (e) {
      if (e instanceof MutateDataException) {
        throw new HttpException(
          'Invalid Blog Post. Original post does not exist',
          HttpStatus.BAD_REQUEST,
        );
      } else if (e instanceof InvalidInputError) {
        throw new HttpException(
          'Invalid Blog Post Input',
          HttpStatus.BAD_REQUEST,
        );
      } else if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.loggerService.addErrorLog(`Error Updating Post: ${e}`);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('delete/:slug')
  @UseInterceptors(AuthRequiredIncerceptor)
  async deleteBlogPost(@Req() request: Request): Promise<BlogPost> {
    const slug = request.params?.slug;

    if (!isString(slug) || slug.length === 0) {
      throw new HttpException('Invalid Slug', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.blogService.deleteBlogPost(slug);
    } catch (e) {
      if (e instanceof InvalidInputError || e instanceof NotFoundError) {
        throw new HttpException('No Blog Post', HttpStatus.NOT_FOUND);
      } else if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.loggerService.addErrorLog(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
