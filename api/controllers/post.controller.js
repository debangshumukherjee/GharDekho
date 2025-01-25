import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const getPosts = async (req, res) => {
  const query = req.query;

  try {
    const posts = await prisma.post.findMany({
      where: {
        city: query.city || undefined,
        type: query.type || undefined,
        property: query.property || undefined,
        bedroom: parseInt(query.bedroom) || undefined,
        price: {
          gte: parseInt(query.minPrice) || undefined,
          lte: parseInt(query.maxPrice) || undefined,
        },
      },
    });

    // setTimeout(() => {
    res.status(200).json(posts);
    // }, 3000);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get posts" });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: {
            firstname: true,
            middlename: true,
            lastname: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const token = req.cookies?.token;

    if (token) {
      return jwt.verify(
        token,
        process.env.JWT_SECRET_KEY,
        async (err, payload) => {
          if (!err) {
            const saved = await prisma.savedPost.findUnique({
              where: {
                userId_postId: {
                  postId: id,
                  userId: payload.id,
                },
              },
            });
            res.status(200).json({ ...post, isSaved: saved ? true : false });
          }
        }
      );
    }
    res.status(200).json({ ...post, isSaved: false });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get post" });
  }
};

export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const newPost = await prisma.post.create({
      data: {
        ...body.postData,
        user: {
          connect: {
            id: tokenUserId,
          },
        },
        postDetail: {
          create: body.postDetail,
        },
      },
    });
    console.log("New Post Created!");
    res.status(200).json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  const tokenUserId = req.userId; // Assumes middleware sets req.userId
  const { id } = req.params;
  const { post, postDetail } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Post ID is required" });
  }

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { postDetail: true },
    });

    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (existingPost.userId !== tokenUserId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...post,
        postDetail: postDetail
          ? {
              upsert: {
                create: postDetail,
                update: postDetail,
              },
            }
          : undefined,
      },
    });

    res.status(200).json(updatedPost);
    console.log("Post Updated!");
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ message: "Failed to update the post" });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: { postDetail: true }, // Fetch associated postDetail
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }
    const savedPost = await prisma.savedPost.findMany({
      where: { postId: id },
    });

    if (savedPost && savedPost.length > 0) {
      return res
        .status(400)
        .json({ message: "Post is saved and cannot be deleted" });
    }

    // Delete postDetail first
    await prisma.postDetail.delete({
      where: { postId: id }, // Assuming postId is the foreign key in PostDetail model
    });

    // Then delete the post
    await prisma.post.delete({
      where: { id },
    });
    console.log("Post Deleted Successfully!");
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};
