import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import axios from 'axios';
import { authenticated } from "../plugins/authenticated";

export async function authRoutes(fastify: FastifyInstance){
    fastify.get('/me',{onRequest: [authenticated]} ,async (req) => {

        return {user: req.user}
    })

    fastify.post('/users', async (req) => {
        const createUserBody = z.object({
            access_token: z.string()
        })

        const {access_token} = createUserBody.parse(req.body);
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers:{
                Authorization: `Bearer ${access_token}`
            }
        })
        
        const userInfoSchema = z.object({
            id: z.string(),
            email: z.string().email(),
            name: z.string(),
            picture: z.string().url()
        });
        const userInfo = userInfoSchema.parse(userResponse.data);

        let user = await prisma.user.findUnique({
            where:{
                googleId: userInfo.id
            }
        })

        if(!user){
            user = await prisma.user.create({
                data:{
                    googleId: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.name,
                    avatarUrl: userInfo.picture
                }
            })
        }

        const token = fastify.jwt.sign({
            name: user.name,
            avatarUrl: user.avatarUrl
        }, {
            sub: user.id,
            expiresIn: '5 days'
        })

        return {token}
    })
}