const express = require("express");

function ping(req, res) {
  res.json({ message: 'pong' })
}

module.exports = ping;