import CommentModel from '../models/Comment.js';
import PostModel from '../models/Post.js';
import UserModel from '../models/User.js';

const createResponse = (status, message, data = null) => {
    return { status, message, data };
};

export const getAllComments = async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await CommentModel.find({ post: postId })
            .populate({ path: 'user', select: ['fullName', 'avatarUrl'] })
            .exec();
        // res.setHeader('Cache-Control', 'public, max-age=3600');
        res.json(comments);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed',
        });
    }
};

export const remove = async (req, res) => {
    try {
        const commentId = req.params.id;

        const deletedComment = await CommentModel.findByIdAndDelete(commentId);

        if (!deletedComment) {
            return res.status(404).json({
                message: 'Comment not found',
            });
        }

        await PostModel.updateMany(
            { comments: commentId },
            { $pull: { comments: commentId } }
        );

        await UserModel.updateMany(
            { comments: commentId },
            { $pull: { comments: commentId } }
        );

        const updatedComments = await CommentModel.find()
            .populate('user')
            .populate('post');

        res.json(updatedComments);

        // res.json({
        //     success: true,
        // });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed to delete the comment',
        });
    }
};

export const getCommentsPost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await PostModel.findById(postId).populate('comments');
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        // res.setHeader('Cache-Control', 'public, max-age=3600');
        res.json(post.comments);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed',
        });
    }
};

export const getLastComments = async (req, res) => {
    try {
        const comments = await CommentModel.find()
            .populate({ path: 'user', select: ['fullName', 'avatarUrl'] })
            .sort({ createdAt: -1 })
            .limit(4)
            .exec();
        // res.setHeader('Cache-Control', 'public, max-age=3600');
        res.json(comments);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed',
        });
    }
};

export const createComment = async (req, res) => {
    try {
        const newComment = new CommentModel({
            comment: req.body.comment,
            user: req.body.userId,
            post: req.body.postId,
        });

        await newComment.save();

        await UserModel.findByIdAndUpdate(newComment.user, {
            $push: { comments: newComment._id },
        });

        await PostModel.findByIdAndUpdate(newComment.post, {
            $push: { comments: newComment._id },
        });

        res.status(201).json({ message: 'Comment added successfully' });
    } catch (err) {
        console.error('Error creating comment:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
