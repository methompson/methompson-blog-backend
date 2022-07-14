import {
  Controller,
  Inject,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { BlogPost } from '@/src/models/blog_post_model';
import { BlogPostRequestOutput } from '@/src/data/blog/blog_post_controller';
import { InvalidInputError } from '@/src/errors/invalid_input_error';
import { isString } from '@/src/utils/type_guards';

import { BlogService } from '@/src/blog/blog.service';
import { LoggerService } from '@/src/logger/logger.console.service';

@Controller({ path: 'api/blog' })
export class BlogController {
  constructor(
    @Inject('BLOG_SERVICE')
    private blogService: BlogService,
    private loggerService: LoggerService,
  ) {}

  @Get()
  async getPosts(@Req() request: Request): Promise<BlogPostRequestOutput> {
    this.loggerService.addLog();

    const pageQP = request.query?.page;
    const paginationQP = request.query?.pagination;

    let page = 1;
    let pagination = 10;

    if (isString(pageQP)) {
      const parsedInt = Number.parseInt(pageQP, 10);
      if (!Number.isNaN(parsedInt)) {
        page = parsedInt;
      }
    }

    if (isString(paginationQP)) {
      const parsedInt = Number.parseInt(paginationQP, 10);
      if (!Number.isNaN(parsedInt)) {
        pagination = parsedInt;
      }
    }

    return this.blogService.getPosts(page, pagination);
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
      console.log('Caught');
      if (e instanceof InvalidInputError) {
        throw new HttpException('No Blog Post', HttpStatus.NOT_FOUND);
      }

      console.error(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async addNewPost(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Record<string, unknown>> {
    if (!(response.locals?.auth?.authorized ?? false)) {
      throw new HttpException('Not Authorized', HttpStatus.UNAUTHORIZED);
    }

    let blogPost: BlogPost;

    try {
      blogPost = await this.blogService.addBlogPost(request.body);
    } catch (e) {
      if (e instanceof InvalidInputError) {
        throw new HttpException(
          'Invalid New Blog Post Input',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.error(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return blogPost.toJSON();
  }
}
