const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const InfoPage = require('../models/InfoPage');

// --- POSTS ---
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts.map(p => ({ id: p._id.toString(), title: p.title, content: p.content, date: p.date })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const post = new Post({ title: req.body.title, content: req.body.content });
    await post.save();
    res.status(201).json({ id: post._id.toString(), title: post.title, content: post.content, date: post.date });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { title: req.body.title, content: req.body.content }, { new: true });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ id: post._id.toString(), title: post.title, content: post.content, date: post.date });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INFO PAGES ---
router.get('/info', async (req, res) => {
  try {
    const pages = await InfoPage.find().sort({ date: -1 });
    res.json(pages.map(p => ({ id: p._id.toString(), name: p.name, body: p.body, date: p.date })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/info', async (req, res) => {
  try {
    const page = new InfoPage({ name: req.body.name, body: req.body.body });
    await page.save();
    res.status(201).json({ id: page._id.toString(), name: page.name, body: page.body, date: page.date });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/info/:id', async (req, res) => {
  try {
    const page = await InfoPage.findByIdAndUpdate(req.params.id, { name: req.body.name, body: req.body.body }, { new: true });
    if (!page) return res.status(404).json({ error: 'Info page not found' });
    res.json({ id: page._id.toString(), name: page.name, body: page.body, date: page.date });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/info/:id', async (req, res) => {
  try {
    const page = await InfoPage.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ error: 'Info page not found' });
    res.json({ message: 'Info page deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
