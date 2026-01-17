export default async function audioRoutes(fastify) {
    fastify.post('/upload', async (request, reply) => {
        const data = await request.file();
        if (!data) {
            return reply.code(400).send({ error: 'Missing file' });
        }
        const buffer = await data.toBuffer();
        const result = await new Promise((resolve, reject) => {
            const stream = fastify.cloudinary.uploader.upload_stream({ resource_type: 'video' }, // áudio entra como video no Cloudinary
            (error, result) => {
                if (error)
                    return reject(error);
                resolve(result);
            });
            stream.end(buffer);
        });
        return {
            url: result.secure_url
        };
    });
}
