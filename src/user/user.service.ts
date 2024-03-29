import { Injectable } from '@nestjs/common';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';

@Injectable()
export class UserService extends MongoDBClient {
  protected async makeUserCollection() {
    const db = await this.db;

    // Enforce required values
    const userCollection = await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['username', 'passwordHash', 'email', 'enabled'],
          properties: {
            username: {
              bsonType: 'string',
              description: 'username is required and must be a string',
            },
            passwordHash: {
              bsonType: 'string',
              description: 'passwordHash is required and must be a string',
            },
            email: {
              bsonType: 'string',
              description: 'email is required and must be a string',
            },
            enabled: {
              bsonType: 'bool',
              description: 'enabled is required and must be a boolean',
            },
          },
        },
      },
    });

    // Enforce uniqueness
    await userCollection.createIndex({ username: 1 }, { unique: true });
    await userCollection.createIndex({ email: 1 }, { unique: true });
  }
}
