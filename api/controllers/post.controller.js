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
    res.status(200).json(newPost);
    console.log("New Post Created");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

// export const updatePost = async (req, res) => {
//   const tokenUserId = req.userId; // Assumes req.userId is set with user token
//   const  {id, body}  = req.body;

//   try {
//     // Find the post to ensure the correct user is updating it
//     const post = await prisma.post.findUnique({
//       where: { id }, // Use the string ID directly
//     });

//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     // Optionally check if the token user ID matches the post's user ID for authorization
//     if (post.userId !== tokenUserId) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to update this post" });
//     }

//     // Update the post's status
//     const updatedPost = await prisma.post.update({
//       where: { id }, // Use the string ID for update as well
//       data: { status: !post.status }, // Toggling the status value
//     });
//     // console.log(updatedPost);
//     console.log("Post Updated!!!");
//     res.status(200).json(updatedPost);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to update post" });
//   }
// };

// export const updatePost = async (req, res) => {
//   console.log("Update Post Backend");
//   const tokenUserId = req.userId; // Assumes middleware sets req.userId
//   const { id, body } = req.body;

//   if (!id) {
//     return res.status(400).json({ message: "Post ID is required" });
//   }
//   console.log("Dhur bapu");

//   try {
//     const post = await prisma.post.findUnique({
//       where: { id },
//     });

//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     if (post.userId !== tokenUserId) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to update this post" });
//     }

//     // Prepare the update data
//     const updateData = {
//       ...post, // Copy existing fields to ensure no undefined overwrites
//       title: body.title || post.title,
//       price: body.price || post.price,
//       images: body.images || post.images,
//       address: body.address || post.address,
//       city: body.city || post.city,
//       bedroom: body.bedroom || post.bedroom,
//       bathroom: body.bathroom || post.bathroom,
//       latitude: body.latitude || post.latitude,
//       longitude: body.longitude || post.longitude,
//       type: body.type || post.type,
//       property: body.property || post.property,
//       status: typeof body.status !== "undefined" ? body.status : post.status,
//     };

//     if (body.postDetail) {
//       updateData.postDetail = {
//         update: {
//           desc: body.postDetail.desc || post.postDetail?.desc,
//           utilities: body.postDetail.utilities || post.postDetail?.utilities,
//           pet: body.postDetail.pet || post.postDetail?.pet,
//           income: body.postDetail.income || post.postDetail?.income,
//           size: body.postDetail.size || post.postDetail?.size,
//           school: body.postDetail.school || post.postDetail?.school,
//           bus: body.postDetail.bus || post.postDetail?.bus,
//           restaurant: body.postDetail.restaurant || post.postDetail?.restaurant,
//           status:
//             typeof body.postDetail.status !== "undefined"
//               ? body.postDetail.status
//               : post.postDetail?.status,
//         },
//       };
//     }

//     const updatedPost = await prisma.post.update({
//       where: { id },
//       data: updateData,
//     });

//     return res.status(200).json(updatedPost);
//   } catch (err) {
//     console.error("Error updating post:", err.message);
//     return res.status(500).json({ message: "Failed to update the post" });
//   }
// };
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
