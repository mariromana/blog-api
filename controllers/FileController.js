import { bucket } from '../firebase/admin.js';
import FileModel from '../models/File.js';
import PostModel from '../models/Post.js';
import UserModel from '../models/User.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        const blob = bucket.file(Date.now() + '-' + req.file.originalname);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        blobStream.on('error', (err) => {
            console.error('Error uploading file:', err);
            res.status(500).json({ message: 'Error uploading file.' });
        });

        blobStream.on('finish', async () => {
            try {
                await blob.makePublic();
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

                res.json({
                    filename: req.file.originalname,
                    url: publicUrl,
                });
            } catch (err) {
                console.error(
                    'Error making file public or saving metadata:',
                    err
                );
                res.status(500).json({
                    message: 'Error saving file metadata.',
                });
            }
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error during file upload:', error);
        res.status(500).json({ message: 'Error uploading file.' });
    }
};

export const migrateFilesToFirebase = async () => {
    try {
        //posts
        const posts = await PostModel.find({
            imageUrl: { $regex: '^uploads/' },
        });

        for (const post of posts) {
            const localFilePath = path.join(__dirname, '../', post.imageUrl);
            const filename = path.basename(localFilePath);

            const publicUrl = await uploadFileToFirebase(
                localFilePath,
                filename
            );

            await PostModel.updateOne(
                { _id: post._id },
                { $set: { imageUrl: publicUrl } }
            );

            console.log(`Updated post ${post._id} with URL: ${publicUrl}`);
        }
        //users
        const users = await UserModel.find({
            avatarUrl: { $regex: '^uploads/' },
        });

        for (const user of users) {
            const localFilePath = path.join(__dirname, '../', user.avatarUrl);
            const filename = path.basename(localFilePath);

            const publicUrl = await uploadFileToFirebase(
                localFilePath,
                filename
            );

            await UserModel.updateOne(
                { _id: user._id },
                { $set: { avatarUrl: publicUrl } }
            );

            console.log(
                `Updated user ${user._id} with avatar URL: ${publicUrl}`
            );
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
};
const uploadFileToFirebase = async (filePath, filename) => {
    const blob = bucket.file(Date.now() + '-' + filename);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: path.extname(filename),
        },
    });

    return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
            reject(err);
        });

        blobStream.on('finish', async () => {
            await blob.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(publicUrl);
        });

        const fileBuffer = fs.readFileSync(filePath);
        blobStream.end(fileBuffer);
    });
};
