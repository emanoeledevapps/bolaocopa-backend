import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import axios from 'axios';
import { authenticated } from "../plugins/authenticated";
import {hash, compare} from 'bcryptjs';

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
                    avatarUrl: userInfo.picture,
                    password: '1215'
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

    //----------------------------------------------------

    fastify.post('/auth/sign_up', async (req, reply) => {
        const singupUserBody = z.object({
            name: z.string(),
            email: z.string(),
            password: z.string()
        })

        const {name, email, password} = singupUserBody.parse(req.body);

        const emailAlreadyExists = await prisma.user.findFirst({
            where: {
                email: email
            }
        })

        if(emailAlreadyExists){
            return reply.status(400).send({
                message: 'Email exists',
            })
        }

        const passwordHash = await hash(password, 8);
        const user = await prisma.user.create({
            data:{
                name,
                email,
                password: passwordHash
            },
            select:{
                id: true,
                email: true,
                name: true
            }
        })

        return{user}
    })

    fastify.post('/auth/sign_in', async (req, reply) => {
        const signinUserBody = z.object({
            email: z.string(),
            password: z.string()
        })

        const {email, password} = signinUserBody.parse(req.body);

        const user = await prisma.user.findFirst({
            where: {
                email
            }
        });
        if(!user) {
            return reply.status(400).send({
                message: 'Email incorrect or not exists',
            })
        }

        const passwordMatch = await compare(password, user?.password);
        if(!passwordMatch) {
            return reply.status(400).send({
                message: 'Password incorrect',
            })
        }

        const token = fastify.jwt.sign({
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl
        }, {
            sub: user.id,
            expiresIn: '1 days'
        })

        return {token}
    })
}