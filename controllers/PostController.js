import PostModel from '../models/Post.js';
export const getLastTags = async (req, res) => {
    try {
        const posts = await PostModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .exec();

        let tags = [];
        posts.forEach((post) => {
            tags = tags.concat(post.tags.filter((tag) => tag.trim() !== ''));
        });

        const uniqueTags = [...new Set(tags)].slice(0, 5);

        res.json(uniqueTags);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Failed',
        });
    }
};

export const getPostsByTags = async (req, res) => {
    try {
        const tag = req.params.tag;
        const posts = await PostModel.find({ tags: tag });
        res.json(posts);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed',
        });
    }
};

export const getAll = async (req, res) => {
    try {
        const posts = await PostModel.find()
            .populate({ path: 'user', select: ['fullName', 'avatarUrl'] })
            .populate({ path: 'comments', select: ['comment'] })
            .sort({ createdAt: -1 })
            .exec();

        res.json(posts);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed',
        });
    }
};

export const getNew = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const posts = await PostModel.find({
            createdAt: {
                $gte: today,
                $lt: tomorrow,
            },
        })
            .populate({ path: 'user', select: ['fullName', 'avatarUrl'] })
            .exec();

        res.json(posts);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed',
        });
    }
};

export const getPopularPosts = async (req, res) => {
    try {
        const posts = await PostModel.find()
            .populate({ path: 'user', select: ['fullName', 'avatarUrl'] })
            .sort({ views: 1 })
            .limit(5)
            .exec();

        res.json(posts);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed',
        });
    }
};

export const getOne = (req, res) => {
    try {
        const postId = req.params.id;
        PostModel.findOneAndUpdate(
            {
                _id: postId,
            },
            {
                $inc: { viewsCount: 1 },
            },
            {
                returnDocument: 'after',
            }
        )
            .populate('user')
            .then((doc, err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        message: "Can't get article.",
                    });
                }

                if (!doc) {
                    return res.status(404).json({
                        message: 'Article not found.',
                    });
                }
                // res.setHeader('Cache-Control', 'public, max-age=3600');
                res.json(doc);
            });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed to return the title',
        });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const id = req.params.id;
        const posts = await PostModel.find({ user: id })
            .populate({ path: 'user', select: ['fullName', 'avatarUrl'] })
            .exec();
        // res.setHeader('Cache-Control', 'public, max-age=3600');
        res.json(posts);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed',
        });
    }
};

export const remove = async (req, res) => {
    try {
        const postId = req.params.id;
        await PostModel.findOneAndDelete({ _id: postId }),
            res.json({
                success: true,
            });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed to delete the title',
        });
    }
};

export const create = async (req, res) => {
    try {
        const doc = new PostModel({
            title: req.body.title,
            text: req.body.text,
            imageUrl: req.body.imageUrl,
            tags: req.body.tags.split(','),
            user: req.userId,
        });

        const post = await doc.save();
        res.json(post);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed to make a post',
        });
    }
};

export const update = async (req, res) => {
    try {
        const postId = req.params.id;

        await PostModel.updateOne(
            { _id: postId },
            {
                title: req.body.title,
                text: req.body.text,
                imageUrl: req.body.imageUrl,
                tags: req.body.tags.split(','),
                user: req.userId,
            }
        );
        res.json({
            success: true,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Failed to update the title',
        });
    }
};
