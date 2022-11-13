import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticated } from "../plugins/authenticated";

export async function userRoutes(fastify: FastifyInstance){
    fastify.get('/users/count', async () => {
        const count = await prisma.user.count();
        
        return {count}
    })

    fastify.put('/user/avatar', {onRequest: [authenticated]}, async (req, reply) => {
        const reqAvatarBody = z.object({
            avatarUrl: z.string()
        })

        const {avatarUrl} = reqAvatarBody.parse(req.body);

        const user = await prisma.user.findUnique({
            where:{
                id: req.user.sub
            }
        });

        if(!user){
            return reply.status(400).send({
                message: 'User not found'
            })
        }

        const update = await prisma.user.update({
            where: {
                id: req.user.sub
            },
            data:{
                avatarUrl: avatarUrl
            },
            select:{
                avatarUrl: true
            }
        })

        return {update}
    })
}