import fp from 'fastify-plugin';
import { v2 as cloudinary } from 'cloudinary';

export default fp(async (fastify) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME!,
    api_key: process.env.CLOUDINARY_KEY!,
    api_secret: process.env.CLOUDINARY_SECRET!
  });

  fastify.decorate('cloudinary', cloudinary);
});
