import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';

import { poolRoutes } from './routes/pool';
import { guessRoutes } from './routes/guess';
import { userRoutes } from './routes/user';
import { authRoutes } from './routes/auth';
import { gameRoutes } from './routes/game';
import { FastifyInstance } from 'fastify/types/instance';


async function bootstrap(){
    const fastify = Fastify({
        logger: true
    });

    await fastify.register(cors, {
        origin: true
    });

    await fastify.register(jwt, {
        secret: process.env.SECRET_KEY || "122322"
    })

    await fastify.register(authRoutes);
    await fastify.register(poolRoutes);
    await fastify.register(guessRoutes);
    await fastify.register(gameRoutes);
    await fastify.register(userRoutes);

    await fastify.listen({port: 3333 || process.env.PORT});
}

bootstrap();