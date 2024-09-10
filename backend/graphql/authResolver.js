import jwt from "jsonwebtoken";
import { compare, hash } from "bcrypt";
import dotenv from "dotenv";

import User from "../models/user.js";
import { userSchema } from "../lib/zod.js";

dotenv.config();

const authResolver = {
  async createUser(args, context) {
    const {
      userInput: { email, name, password },
    } = args;
    try {
      await userSchema.parseAsync({ email, name, password });
    } catch (errorsZod) {
      const error = new Error("Validations failed");
      error.data = errorsZod.errors;
      error.status = 422;
      // console.log(error);
      throw error;
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        const error = new Error("E-Mail address already exists!");
        error.status = 422;
        throw error;
      }

      const hashedPassword = await hash(password, 12);
      const createdUser = await User.create({
        email,
        name,
        password: hashedPassword,
      });

      return { ...createdUser._doc, _id: createdUser._id.toString() };
    } catch (error) {
      throw error;
    }
  },
  async login(args) {
    const { email, password } = args;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error("User not found.");
        error.status = 401;
        throw error;
      }

      const isEqual = await compare(password, user.password);
      if (!isEqual) {
        const error = new Error("Password is incorrect.");
        error.status = 401;
        throw error;
      }

      const token = jwt.sign(
        { email, userId: user._id },
        process.env.SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );
      return { token, userId: user._id.toString() };
    } catch (error) {
      throw error;
    }
  },
  async user(args, context) {
    if (!context.isAuth) {
      const error = new Error("Not authenticated.");
      error.status = 401;
      // console.log(error);
      throw error;
    }

    try {
      const user = await User.findById(context.userId).populate("posts");
      if (!user) {
        const error = new Error("Could not find user.");
        error.status = 404;
        throw error;
      }

      return { ...user._doc, _id: user._id.toString() };
    } catch (error) {
      throw error;
    }
  },
  async updateStatus(args, context) {
    if (!context.isAuth) {
      const error = new Error("Not authenticated.");
      error.status = 401;
      // console.log(error);
      throw error;
    }

    const { status } = args;
    try {
      const user = await User.findByIdAndUpdate(
        context.userId,
        { status },
        { new: true }
      ).populate("posts");
      if (!user) {
        const error = new Error("Could not find user.");
        error.status = 404;
        throw error;
      }

      return { ...user._doc, _id: user._id.toString() };
    } catch (error) {
      throw error;
    }
  },
};

export default authResolver;
