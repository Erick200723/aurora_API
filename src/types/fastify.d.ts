import 'fastify';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import admin from 'firebase-admin';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    cloudinary: typeof cloudinary;
    fcm: admin.messaging.Messaging;
    authenticate: any;
  }
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      role: 'FAMILIAR' | 'ADMIN' | 'IDOSO';
    };
  }
}