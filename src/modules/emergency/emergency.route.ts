import { FastifyInstance } from 'fastify';
import { authenticate } from '../../hooks/authenticate.js';
import { createEmergencyAlert,getEmergenciesForUser,resolveEmergencyAlert } from './emergency.service.js';

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

        const emergencyPayload = {
          id: result.alert.id,
          elderName: result.elderName,
          message: `🚨 EMERGÊNCIA: ${result.elderName} precisa de ajuda!`,
          timestamp: new Date()
        };

        result.targetIds.forEach(id => {
          app.io.to(id).emit('emergency_received', emergencyPayload);
          console.log(`📡 Alerta enviado para a sala: ${id}`);
        });

        return { 
          message: "Alerta de emergência disparado!", 
          alertId: result.alert.id 
        };

      } catch (error) {
        console.error("Erro ao disparar emergência:", error);
        return reply.status(500).send({ message: "Erro ao disparar emergência" });
      }
    }
  );
  app.get(
    '/',
    { preHandler: [authenticate] },
    async (req, reply) => {
      const userId = req.user.id;
      const role = req.user.role; 
      
      const emergencies = await getEmergenciesForUser(userId, role);
      return emergencies;
    }
  );
  app.patch(
    '/:id/resolve',
    { preHandler: [authenticate] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      
      // Correção do erro: extrai com segurança, mesmo se o body vier vazio
      const body = (req.body as { observation?: string }) || {};
      const { observation } = body;

      try {
        await resolveEmergencyAlert(id, observation);
        return { message: "Emergência marcada como resolvida no banco!" };
      } catch (error) {
        console.error("Erro ao resolver:", error);
        return reply.status(500).send({ message: "Erro interno ao resolver emergência." });
      }
    }
  );
}