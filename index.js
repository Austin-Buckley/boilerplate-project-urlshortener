require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.DB_URL);
const db = client.db("url-shortener");
const urls = db.collection("urls");

const dns = require("dns");
const urlParser = require("url");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", (req, res) => {
  const url = req.body.url;
  const dnsLookup = dns.lookup(
    urlParser.parse(url).hostname,
    async (err, address) => {
      if (!address) {
        res.json({ error: "invalid URL" });
      } else {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url: url,
          short_url: urlCount,
        };

        const result = await urls.insertOne(urlDoc);
        console.log(result);

        res.json({
          original_url: url,
          short_url: urlCount,
        });
      }
    }
  );
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const short_url = req.params.short_url;
  const urlDoc = await urls.findOne({ short_url: +short_url });
  res.redirect(urlDoc.url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
