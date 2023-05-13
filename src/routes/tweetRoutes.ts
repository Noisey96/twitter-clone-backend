import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// create a new tweet
router.post('/', async (req, res) => {
	const { content, image, userId } = req.body;

	try {
		const result = await prisma.tweet.create({
			data: {
				content,
				image,
				userId, // TODO manage based on the auth user
			},
		});

		res.json(result);
	} catch (err) {
		res.status(400).json({ error: 'User needs to exist.' });
	}
});

// list all tweets
router.get('/', async (req, res) => {
	const allTweets = await prisma.tweet.findMany();

	res.json(allTweets);
});

// get one tweet
router.get('/:id', async (req, res) => {
	const { id } = req.params;

	const tweet = await prisma.tweet.findUnique({ where: { id: Number(id) } });

	if (!tweet) return res.status(404).json({ error: `Tweet ${id} not found` });
	res.json(tweet);
});

// update one tweet
router.put('/:id', async (req, res) => {
	const { id } = req.params;
	const { content, image } = req.body;

	try {
		const result = await prisma.tweet.update({
			where: { id: Number(id) },
			data: { content, image },
		});

		res.json(result);
	} catch (err) {
		res.status(400).json({ error: `Failed to update tweet ${id}` });
	}
});

// delete one tweet
router.delete('/:id', async (req, res) => {
	const { id } = req.params;

	await prisma.tweet.delete({ where: { id: Number(id) } });

	res.sendStatus(200);
});

export default router;
