var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
var User = require("../models/userModel");
var Blog = require("../models/blogModel");
const jwt = require("jsonwebtoken");
const jwtSecret = "secret";

async function authenticationMiddleware(req, res, next) {
  console.log(req.body);
  const { username, password } = req.body;
  console.log("name --> " + username + " password" + password);
  const user = await User.findOne({ username: username });
  console.log("user --> " + user);
  if (user) {
    console.log("pass -->" + user.password);
    console.log("pass -->" + password);

    if (password == user.password && user.status == true) {
      req.user = user;
      next();
    } else {
      res.status(401).send("Invalid password or Access Blocked By Admin");
    }
  } else {
    res.status(401).send("User not found");
  }
}
async function verifyToken(req, res, next) {
  const token = req.body.token;
  console.log("token --> " + token);
  if (!token) return res.status(401).send("Access denied. No token provided.");

  const decoded = jwt.decode(token);
  if (!decoded) return res.status(401).send("Invalid token.");

  req.user = decoded.user;
  console.log("Verified token user --> " + req.user);
  next();
}
router.post("/login", authenticationMiddleware, async function (req, res) {
  const token = jwt.sign({ user: req.user }, jwtSecret, {
    expiresIn: "1h",
  });
  res.json({ token, message: "Logged in successfully" });
});

router.post("/register", async function (req, res) {
  const { userName, paswd, emai, type } = req.body;
  console.log(req.body);
  let newUser = new User({
    username: userName,
    password: paswd,
    email: emai,
    role: type,
  });
  console.log(newUser);
  await newUser.save();
  res.send(newUser);
});

router.post("/user/upload_blog", verifyToken, async function (req, res) {
  const { blogTitle, blogData, keyWords, categories } = req.body;
  console.log(blogData);
  const userId = req.user._id;
  try {
    const newBlog = new Blog({
      user_id: userId,
      title: blogTitle,
      blog: blogData,
      keyWords: keyWords,
      categories: categories,
    });

    const savedBlog = await newBlog.save();
    res.send(savedBlog);
  } catch (error) {
    res.status(500).send("Error uploading blog");
  }
});
router.post(
  "/user/delete_blog/:blog_id",
  verifyToken,
  async function (req, res) {
    const blog = await Blog.findOne({ _id: req.params.blog_id });
    if (blog) {
      const blog_author = blog.user_id;
      console.log("blog author --> " + blog_author);
      const blogId = req.params.blog_id;
      if (blog_author == req.user._id) {
        const deletedBlog = await Blog.findByIdAndDelete(blogId);
        res.send(deletedBlog);
      } else {
        res.status(401).send("Access denied");
      }
    }
  }
);
router.get("/user/show_blog/:blog_id", verifyToken, async function (req, res) {
  const blog = await Blog.findOne({ _id: req.params.blog_id });
  if (blog) {
    const blog_author = blog.user_id;
    console.log("blog author --> " + blog_author);
    const blogId = req.params.blog_id;
    const showBlog = await Blog.findById(blogId);
    res.send(showBlog);
  }
});

router.post("/user/edit_blog/:blog_id", verifyToken, async function (req, res) {
  const blog = await Blog.findOne({ _id: req.params.blog_id });
  if (blog) {
    const blog_author = blog.user_id;
    console.log("blog author --> " + blog_author);
    const blogId = req.params.blog_id;
    console.log("blog author" + blog_author);
    console.log("req user " + req.user._id);
    if (blog_author.toString() == req.user._id.toString()) {
      const { blog } = req.body;
      const editedBlog = await Blog.findByIdAndUpdate(
        blogId,
        { blog },
        { new: true }
      );
      res.send(editedBlog);
    }
  } else {
    res.status(401).send("Access denied");
  }
});

router.get("/user/showblog", verifyToken, async function (req, res) {
  try {
    const user_id = req.user._id;
    const blogs = await Blog.find({ user_id }); // Find blogs with the specified user_id
    res.json(blogs); // Send the blogs as a JSON response
  } catch (error) {
    console.error("Error retrieving blogs:", error);
    res.status(500).send("Error retrieving blogs");
  }
});

router.post("/user/follow", verifyToken, async function (req, res) {
  try {
    const user_id = req.user._id;
    const follower_id = req.body.follower_id;
    const follower = await User.findOne({ _id: follower_id });
    const user = await User.findOne({ _id: user_id });
    console.log(follower);
    if (follower) {
      follower.followers.push(user_id);
      user.following.push(follower_id);
      follower.save();
      user.save();
      res.send(follower);
    } else {
      res.status(401).send("Access denied");
    }
  } catch (error) {
    console.error("Error retriving:", error);
    res.status(500).send("Error retrieving blogs");
  }
});

router.get("/user/followingFeed", verifyToken, async function (req, res) {
  try {
    const user_id = req.user._id;
    const user = await User.findById(user_id);
    if (user) {
      const followingUserIds = user.following.map((user) => user._id);
      const blogsPromises = followingUserIds.map(async (userId) => {
        return await Blog.find({ user_id: userId });
      });
      const blogsArray = await Promise.all(blogsPromises);
      const blogs = [].concat(...blogsArray);
      res.json(blogs);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error retrieving feed:", error);
    res.status(500).send("Error retrieving feed");
  }
});

router.get("/user/notifications", verifyToken, async function (req, res) {
  try {
    const user_id = req.user._id;
    const user = await User.findById(user_id);
    if (user) {
      const followerUserIds = user.followers.map((user) => user._id);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).send("Error retrieving notifications");
  }
});

router.get(
  "/user/blogByAutor/:authorId",
  verifyToken,
  async function (req, res) {
    try {
      const authorId = req.params.authorId;
      const blogs = await Blog.find({ user_id: authorId });
      res.json(blogs);
    } catch (error) {
      console.error("Error retrieving blogs:", error);
      res.status(500).send("Error retrieving blogs");
    }
  }
);

router.get(
  "/user/blogByKeyword/:keyword",
  verifyToken,
  async function (req, res) {
    keywordToSearch = req.params.keyword;
    try {
      const blogs = await Blog.find({ keyWords: { $in: [keywordToSearch] } });
      res.json(blogs);
    } catch (error) {
      console.error("Error retrieving blogs:", error);
      res.status(500).send("Error retrieving blogs");
    }
  }
);

router.get(
  "/user/blogByCategory/:category",
  verifyToken,
  async function (req, res) {
    categoryToSearch = req.params.category;
    try {
      const blogs = await Blog.find({
        categories: { $in: [categoryToSearch] },
      });
      res.json(blogs);
    } catch (error) {
      console.error("Error retrieving blogs:", error);
      res.status(500).send("Error retrieving blogs");
    }
  }
);

router.get("/admin/all_users", verifyToken, async function (req, res) {
  if (req.user.role.toString() != "admin") {
    res.status(401).send("Access denied");
  } else {
    const users = await User.find();
    res.json(users);
  }
});
router.post("/admin/block/:user_id", verifyToken, async function (req, res) {
  if (req.user.role.toString() != "admin") {
    res.status(401).send("Access denied");
  } else {
    const userToBlockId = req.params.user_id;
    const userToBlock = await User.findById(userToBlockId);
    userToBlock.status = false;
    await userToBlock.save();
    res.send(userToBlock);
  }
});

router.post("/user/rateBlog/:blogId", verifyToken, async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const { rating } = req.body;
    const blog = await Blog.findById(blogId);
    blog.rating.push(rating);
    await blog.save();
    res.send(blog);
  } catch {
    console.log("Error saving blog in rating ");
    res.send("error");
  }
});
router.get("/admin/allBlogs", verifyToken, async (req, res) => {
  try {
    if (req.user.role.toString() !== "admin") {
      return res.status(401).send("Access denied");
    }
    const blogs = await Blog.find(
      {},
      { projection: { title: 1, blog: 1, user_id: 1, date: 1, rating: 1 } }
    );
    for (const blog of blogs) {
      console.log(blog.title);
      console.log(blog.blog);
      console.log(blog.user_id);
      console.log(blog.date);
      console.log(blog.rating);
    }
    console.log(blogs);
    res.json(blogs);
    // const blogsWithAverageRating = blogs.map((blog) => {
    //   const ratings = blog.rating || [];
    //   const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    //   const averageRating = ratings.length > 0 ? sum / ratings.length : 0;
    //   return {
    //     ...blog._doc,
    //     averageRating: averageRating.toFixed(2),
    //   };
    // });
    // res.json(blogsWithAverageRating);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/admin/particularBlog/:blogId", verifyToken, async (req, res) => {
  try {
    if (req.user.role.toString() == "admin") {
      const blogId = req.params.blogId;
      const blog = await Blog.findById(blogId);
      res.send(blog);
    } else {
      console.log("access denied");
      res.send("request denied");
    }
  } catch {
    console.log("Error saving blog in rating ");
    res.send("error");
  }
});

module.exports = router;
