import { isString } from '@/src/utils/type_guards';

export function blogConfiguration() {
  const defaultBlogConfig = {
    blogType: 'memory',
  };

  if (process.env.blogType === 'memory') {
    return defaultBlogConfig;
  }

  const port = process.env.MONGO_DB_PORT ?? '27017';
  const username = process.env.MONGO_DB_USERNAME;
  const password = process.env.MONGO_DB_PASSWORD;
  const url = process.env.MONGO_DB_HOST;

  if (
    isString(port) &&
    isString(username) &&
    isString(password) &&
    isString(url)
  ) {
    return {
      blogType: 'mongo_db',
      port,
      username,
      password,
      url,
    };
  }

  return defaultBlogConfig;
}