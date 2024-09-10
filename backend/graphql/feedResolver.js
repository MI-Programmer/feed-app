import User from "../models/user.js";
import Post from "../models/post.js";
import { postSchema } from "../lib/zod.js";
import { deleteFileImage } from "../utils/helper.js";

const ITEMS_PER_PAGE = 2;

const feedResolver = {
  async posts(args, context) {
    if (!context.isAuth) {
      const error = new Error("Not authenticated.");
      error.status = 401;
      // console.log(error);
      throw error;
    }

    const page = +args.page || 1;
    try {
      let posts = await Post.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .populate("creator");
      const totalPosts = await Post.find().countDocuments();
      posts = posts.map((post) => ({
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      }));

      return { posts, totalPosts };
    } catch (error) {
      throw error;
    }
  },
  async post(args, context) {
    if (!context.isAuth) {
      const error = new Error("Not authenticated.");
      error.status = 401;
      // console.log(error);
      throw error;
    }

    const { postId } = args;
    try {
      const post = await Post.findById(postId).populate("creator");
      if (!post) {
        const error = new Error("Could not find post.");
        error.status = 404;
        throw error;
      }
      post.imageUrl = `http://localhost:8080/${post.imageUrl}`;

      return {
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },
  async createPost(args, context) {
    if (!context.isAuth) {
      const error = new Error("Not authenticated.");
      error.status = 401;
      // console.log(error);
      throw error;
    }

    const {
      postInput: { title, image, content },
    } = args;
    try {
      await postSchema.parseAsync({ title, imageUrl: image, content });
    } catch (errorsZod) {
      const error = new Error("Validation failed");
      error.data = errorsZod.errors;
      error.status = 422;
      // console.log(error);
      throw error;
    }

    try {
      const user = await User.findById(context.userId);
      if (!user) {
        const error = new Error("Not found user");
        error.status = 401;
        throw error;
      }
      const post = await Post.create({
        title,
        imageUrl: image,
        content,
        creator: user,
      });

      user.posts.push(post._id);
      await user.save();
      return {
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },
  async updatePost(args, context) {
    if (!context.isAuth) {
      const error = new Error("Not authenticated.");
      error.status = 401;
      throw error;
    }

    const {
      postId,
      postInput: { title, image, content },
    } = args;
    try {
      await postSchema.parseAsync({ title, imageUrl: image, content });
    } catch (errorsZod) {
      const error = new Error("Validation failed");
      error.data = errorsZod.errors;
      error.status = 422;
      throw error;
    }

    try {
      const post = await Post.findById(postId);
      if (!post) {
        const error = new Error("Could not find post.");
        error.status = 404;
        throw error;
      }
      if (post.creator.toString() !== context.userId) {
        const error = new Error("Not authorized.");
        error.status = 403;
        throw error;
      }

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, imageUrl: image, content },
        { new: true }
      ).populate("creator");
      return {
        ...updatedPost._doc,
        imageUrl: `http://localhost:8080/${updatedPost.imageUrl}`,
        _id: updatedPost._id.toString(),
        createdAt: updatedPost.createdAt.toISOString(),
        updatedAt: updatedPost.updatedAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },
  async deletePost(args, context) {
    if (!context.isAuth) {
      const error = new Error("Not authenticated.");
      error.status = 401;
      throw error;
    }

    const { postId } = args;
    try {
      const post = await Post.findById(postId);
      if (!post) {
        const error = new Error("Could not find post.");
        error.status = 404;
        throw error;
      }
      if (post.creator.toString() !== context.userId) {
        const error = new Error("Not authorized.");
        error.status = 403;
        throw error;
      }

      await Post.findByIdAndDelete(postId);
      await User.findByIdAndUpdate(context.userId, {
        $pull: { posts: postId },
      });
      deleteFileImage(post.imageUrl);
      return true;
    } catch (error) {
      throw error;
    }
  },
};

export default feedResolver;
