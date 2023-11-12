const mongoose = require("mongoose");
const express = require("express");
const schema = mongoose.Schema;

const user = new schema({
  username: String,
  password: String,
  email: String,
  role: { type: String, enum: ["user", "admin"], defualt: "user" },
  followers: {
    type: Array,
    default: [],
  },
  following: {
    type: Array,
    default: [],
  },
  status: {
    type: Boolean,
    default: true,
  }
});

const User = mongoose.model("User", user);
module.exports = User;
