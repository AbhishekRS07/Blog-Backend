const { Router } = require("express");

const { BlogModel } = require("../models/Blog.modal");
const { UserModel } = require("../models/User.modal");

const blogRouter = Router();

blogRouter.get("/", async (req, res) => {
  try {
    const { title, category, q, sortBy, page, limit } = req.query;
    const filter = {};

    if (title) filter.title = { $regex: title, $options: "i" };
    if (category) filter.category = { $regex: category, $options: "i" };

    const query = BlogModel.find(filter);

    if (q) {
      query.or([{ title: { $regex: q, $options: "i" } }]);
    }

    if (sortBy) {
      query.sort({ [sortBy]: -1 });
    }

    const total = await BlogModel.countDocuments(filter);
    const blogs = await query.skip((page - 1) * limit).limit(limit);

    res.status(200).json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      blogs,
    });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
});

blogRouter.post("/create", async (req, res) => {
  const { title, content, category } = req.body;
  const author_id = req.user_id;
  const user = await UserModel.findOne({ _id: author_id });
  const new_blog = new BlogModel({
    title,
    content,
    category,
    author_name: user.name,
    author_email: user.email,
  });
  await new_blog.save();
  res.status(200).send({ msg: "blog created" });
});

blogRouter.put("/edit/:blogID", async (req, res) => {
  try {
    const blogID = req.params.blogID;
    const payload = req.body;

    const user_id = req.user_id;
    const user = await UserModel.findOne({ _id: user_id });
    const user_email = user.email;

    const blog = await BlogModel.findOne({ _id: blogID });
    const blog_author_email = blog.author_email;

    if (user_email !== blog_author_email) {
      res.send({ msg: "unauthorized" });
    } else {
      await BlogModel.findByIdAndUpdate(blogID, payload);
      res.status(200).send({ msg: `blog ${blogID} updated` });
    }
  } catch (error) {
    console.log(error);
  }
});

blogRouter.delete("/delete/:blogID", async (req, res) => {
  try {
    const blogID = req.params.blogID;

    const user_id = req.user_id;
    const user = await UserModel.findOne({ _id: user_id });
    const user_email = user.email;

    const blog = await BlogModel.findOne({ _id: blogID });
    const blog_author_email = blog.author_email;

    if (user_email !== blog_author_email) {
      res.send("unauthorized");
    } else {
      await BlogModel.findByIdAndDelete(blogID);
      res.status(200).send({ msg: `blog ${blogID} deleted` });
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = {
  blogRouter,
};
