import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';

import { Env, Variables } from '../app';
import { connectToDatabaseViaHTTP, connectToDatabaseViaWebSockets } from '../services/databaseService';
import { tokens, tweets, users } from '../db/schema';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// creates a new user
router.post('/', async (c) => {
	throw new HTTPException(401);
});

// lists all users
router.get('/', async (c) => {
	const db = connectToDatabaseViaHTTP(c.env.DATABASE_URL);
	const allUsers = await db.query.users.findMany();

	return c.json(allUsers);
});

// gets current user
router.get('/myself', async (c) => {
	const user = c.get('user');
	return c.json(user);
});

// gets one user
router.get('/:id', async (c) => {
	const { id } = c.req.param();

	const db = connectToDatabaseViaHTTP(c.env.DATABASE_URL);
	const user = await db.query.users.findFirst({
		where: eq(users.id, id),
		with: {
			tweets: {
				columns: { id: true, content: true, image: true },
			},
		},
	});

	if (!user) throw new HTTPException(404, { message: 'Cannot get user' });
	return c.json(user);
});

// updates one user
router.put('/:id', async (c) => {
	const { id } = c.req.param();
	const { name, image, bio } = await c.req.json();
	const user = c.get('user');

	// validate updated user = logged in user
	if (user.id !== id) throw new HTTPException(401, { message: 'Unauthorized' });

	try {
		const db = connectToDatabaseViaHTTP(c.env.DATABASE_URL);
		const updatedUsers = await db.update(users).set({ bio, image }).where(eq(users.id, id)).returning();
		const updatedUser = updatedUsers[0];

		return c.json(updatedUser);
	} catch (err) {
		throw new HTTPException(400, { message: 'Cannot update user' });
	}
});

// deletes one user along with their tweets and tokens
router.delete('/:id', async (c) => {
	const { id } = c.req.param();
	const user = c.get('user');

	// validate deleted user = logged in user
	if (user.id !== id) throw new HTTPException(401, { message: 'Unauthorized' });

	try {
		const db = connectToDatabaseViaWebSockets(c.env.DATABASE_URL);
		await db.delete(tokens).where(eq(tokens.userId, id));
		await db.delete(tweets).where(eq(tweets.userId, id));
		await db.delete(users).where(eq(users.id, id));

		c.status(200);
		return c.text('OK');
	} catch (err) {
		throw new HTTPException(400, { message: 'Cannot delete user' });
	}
});

export default router;
