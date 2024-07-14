import express from 'express';
import fs from 'fs';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import { config } from 'dotenv';

import {
    loginValidation,
    registerValidation,
    postCreateValidation,
} from '../validations.js';

import { checkAuth, handleValidationErrors } from '../utils/index.js';
import {
    UserController,
    PostController,
    CommentController,
} from '../controllers/index.js';

config();
const app = express();

// app.use(cors());
app.use(
    cors({
        origin: process.env.FRONTEND_URL.replace(/\/$/, ''),
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true,
    })
);

console.log('MONGODB_URI:', process.env.MONGODB_URI);
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('db ok'))
    .catch((err) => console.log('db error', err));

app.get('/', (req, res) => {
    res.send('heello world');
});

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err));

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }
        cb(null, 'uploads');
    },
    filename: (_, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.post(
    '/auth/login',
    loginValidation,
    handleValidationErrors,
    UserController.login
);

app.post(
    '/auth/register',
    registerValidation,
    handleValidationErrors,
    UserController.register
);

app.get('/auth/me', checkAuth, UserController.getMe);
app.post('/forgot-password', UserController.passwordForgot);
app.post('/reset-password', UserController.resetPassword);
app.patch('/users/:id', checkAuth, UserController.update);
app.post('/upload', upload.single('image'), (req, res) => {
    res.json({
        url: `uploads/${req.file.originalname}`,
    });
});
app.delete('/auth/:id', checkAuth, UserController.removeUser);
app.get('/posts/new', PostController.getNew);
app.get('/posts/popular', PostController.getPopularPosts);

app.get('/tags', PostController.getLastTags);
app.get('/tags/:tag', PostController.getPostsByTags);
app.get('/posts', PostController.getAll);
app.get('/posts/:id', PostController.getOne);
app.get('/profile/:id', PostController.getUserPosts);
app.post(
    '/posts',
    checkAuth,
    postCreateValidation,
    handleValidationErrors,
    PostController.create
);
app.delete('/posts/:id', checkAuth, PostController.remove);

app.patch(
    '/posts/:id',
    checkAuth,
    postCreateValidation,
    handleValidationErrors,
    PostController.update
);

app.post('/comments', checkAuth, CommentController.createComment);
app.get('/comments/:id', CommentController.getAllComments);
app.delete('/comments/:id', checkAuth, CommentController.remove);
app.get('/comments', CommentController.getLastComments);

const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
    if (err) {
        return console.log(err);
    }
    console.log(`Server was started from port ${PORT}`);
});
