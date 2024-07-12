import { body } from 'express-validator';

export const loginValidation = [
    body('email', 'Invalid email adress').isEmail(),
    body('password', 'Password must be min 5 symbols').isLength({ min: 5 }),
];

export const registerValidation = [
    body('email', 'Invalid email adress').isEmail(),
    body('password', 'Password must be min 5 symbols').isLength({ min: 5 }),
    body('fullName', 'Write your name').isLength({ min: 3 }),
    body('avatarUrl', 'Invalid url').optional().isString(),
];

export const postCreateValidation = [
    body('title', 'Write the title').isLength({ min: 3 }).isString(),
    body('text', 'write the text').isLength({ min: 10 }).isString(),
    body('tags', 'Wrong format of tags').optional().isString(),
    body('imageUrl', 'Wrong url').optional().isString(),
];
