import 'dotenv/config';
import Koa from 'koa';

async function bootstrap() {
  const port = 8000;

  const app = new Koa();
  app.use(async (ctx) => {
    ctx.body = 'hello, world';
  });

  app.listen(port);

  console.log(`Listening on port ${port}`);
}

bootstrap();
