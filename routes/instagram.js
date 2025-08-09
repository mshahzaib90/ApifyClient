const express = require("express");
const { ApifyClient } = require("apify-client");
const router = express.Router();

const APIFY_TOKEN = process.env.APIFY_API_TOKEN; // Make sure this is set
const ACTOR_ID = process.env.ACTOR_ID;

const REELS_ACTOR_ID = "xMc5Ga1oCONPmWJIa";

router.post("/fetch", async (req, res) => {

  const { url, directUrls } = req.body;

  const finalUrl = url || (directUrls && directUrls[0]);

  if (!finalUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  const input = {
    directUrls: [finalUrl],
    resultsType: "posts",
    resultsLimit: 1,
    addParentData: true,
    scrapeComments: true,
    commentsLimit: 50
  };

  try {
    const run = await client.actor(ACTOR_ID).call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items.length) {
      return res.status(404).json({ error: "No post found" });
    }

    const post = items[0];

    return res.json({
      caption: post.caption ?? "No caption",
      likes: post.likesCount ?? "N/A",
      views: post.videoViewCount ?? "N/A",
      commentsCount: post.commentsCount ?? 0,
      comments: post.childPosts?.map((c) => ({
        text: c.text ?? "No text",
        from: c.ownerUsername ?? "Unknown",
        at: new Date(c.timestamp * 1000).toLocaleString(),
      })) ?? [],
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({ error: "Failed to fetch post" });
  }
});

// 🎥 New endpoint for fetching reels
router.post("/fetch-reels", async (req, res) => {
  const { username, resultsLimit } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  const input = {
    username: Array.isArray(username) ? username : [username],
    resultsLimit: resultsLimit || 10, // default 10 reels
  };

  try {
    const run = await client.actor(REELS_ACTOR_ID).call(input);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items.length) {
      return res.status(404).json({ error: "No reels found" });
    }

    const reelsData = items.map((reel) => ({
      id: reel.id ?? null,
      caption: reel.caption ?? "No caption",
      likes: reel.likesCount ?? 0,
      views: reel.videoViewCount ?? 0,
      commentsCount: reel.commentsCount ?? 0,
      videoUrl: reel.videoUrl ?? null,
      thumbnailUrl: reel.displayUrl ?? null,
      postedAt: reel.timestamp
        ? new Date(reel.timestamp * 1000).toLocaleString()
        : null,
    }));

    return res.json(reelsData);
  } catch (error) {
    console.error("❌ Error fetching reels:", error.message);
    return res.status(500).json({ error: "Failed to fetch reels" });
  }
});

module.exports = router;