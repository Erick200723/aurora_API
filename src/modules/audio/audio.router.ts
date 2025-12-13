import { FastifyInstance } from 'fastify';
import { MultipartFile } from '@fastify/multipart';

export default async function audioRoutes(fastify: FastifyInstance) {
  fastify.post('/upload', async (request, reply) => {
    const data = await request.file() as MultipartFile | undefined;

    if (!data) {
      return reply.code(400).send({ error: 'Missing file' });
    }

    const buffer = await data.toBuffer();

    const result = await new Promise<any>((resolve, reject) => {
      const stream = fastify.cloudinary.uploader.upload_stream(
        { resource_type: 'video' }, // áudio entra como video no Cloudinary
        (error: unknown, result: unknown) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      stream.end(buffer);
    });

    return {
      url: result.secure_url
    };
  });
}
