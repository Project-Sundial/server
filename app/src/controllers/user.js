import { generateHash } from '../utils/bcrypt.js';
import { dbGetAllUsernames, dbAddUser } from '../db/queries.js';

const validateUser = async (user) => {
  const existingUsernames = await dbGetAllUsernames();

  if (existingUsernames.length > 0) {
    const error = new Error('User has already been created.');
    error.statusCode = 400;
    throw error;
  }

  /*
  this if statement is useless given the above, can be used later if we
  support multiple users
  if (existingUsernames.includes(user.username)) {
    const error = new Error('Username already in use.');
    error.statusCode = 400;
    throw error;
  }
  */

  if (user.password.length < 8) {
    const error = new Error('Password must be longer than 8 characters.');
    error.statusCode = 400;
    throw error;
  }
};

const addUser = async (request, response, next) => {
  try {
    const { username, password } = request.body;
    await validateUser({ username, password });

    const passwordHash = await generateHash(password);
    const user = {
      username,
      passwordHash,
    };

    await dbAddUser(user);
    response.status(201).send();
  } catch (error) {
    next(error);
  }
};

const userCount = async (request, response, next) => {
  try {
    const usernames = await dbGetAllUsernames();
    response.status(200).send({
      count: usernames.length,
    });
  } catch (error) {
    next(error);
  }
};

export {
  addUser,
  userCount
};
