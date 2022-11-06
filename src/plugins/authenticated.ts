import { FastifyRequest } from "fastify";

export async function authenticated(req: FastifyRequest){
    await req.jwtVerify();
}