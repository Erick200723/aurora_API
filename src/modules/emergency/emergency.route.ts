import { FastifyInstance } from 'fastify';
import { authenticate } from '../../hooks/authenticate.js';
import { createEmergencyAlert } from './emergency.service.js';

export default async function emergencyRoutes(app: FastifyInstance) {
  
  app.post(
    '/trigger',
    { preHandler: [authenticate],schema: { tags: ['Emegencia']}  },
    async (req, reply) => {
      const elderId = req.user.elderProfileId;

      if (!elderId) {
        return reply.status(403).send({ 
          message: "Apenas perfis de idosos vinculados podem disparar emergência" 
        });
      }

      try {
        const result = await createEmergencyAlert(elderId);
        
        app.io.to(result.chiefId).emit('emergency_received', {
          id: result.alert.id,
          elderName: result.elderName,
          message: `🚨 EMERGÊNCIA: ${result.elderName} precisa de ajuda!`,
          timestamp: new Date()
        });

        return { message: "Alerta de emergência disparado!", alertId: result.alert.id };
      } catch (error) {
        return reply.status(500).send({ message: "Erro ao disparar emergência" });
      }
    }
  );
}