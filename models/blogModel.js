const mongoose = require("mongoose");
const express = require("express");
const schema = mongoose.Schema;

const blog = new schema({
  user_id: String,
  title: String,
  blog: String,
  keyWords: {
    type: Array,
    default: [],
  },
  categories: {
    type: Array,
    default: [],
  },
  rating: {
    type: Array,
    default: [],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: Boolean,
    default: true,
  },
});

const Blog = mongoose.model("Blog", blog);
module.exports = Blog;
