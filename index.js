const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nuhoilk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client
      .db("teacherOfHablu")
      .collection("services");

    const reviewCollection = client.db("teacherOfHablu").collection("review");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    app.get("/services", async (req, res) => {
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = serviceCollection.find(query);
      const service = await cursor.limit(size).sort({ date: -1 }).toArray();
      res.send(service);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    app.post("/addService", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    // review section

    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { postId: id };
      const postId = reviewCollection.find(query).sort({ date: -1 });
      const result = await postId.toArray();
      res.send(result);
    });
    app.get("/review/", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const allReview = await reviewCollection
        .find({})
        .sort({ date: -1 })
        .toArray();
      const result = allReview.filter((item) => item?.userEmail === email);
      res.send(result);
    });

    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const review = req.body.review;
      const option = { upsert: true };
      const updateReview = { $set: { review } };
      const result = await reviewCollection.updateOne(
        query,
        updateReview,
        option
      );
      res.send(result);
    });
  } finally {
  }
}

run().catch((error) => console.log(error));
app.get("/", (req, res) => {
  res.send("Assignment 11 running");
});

app.listen(port, () => {
  console.log(`Assignment 11 listening on port ${port}`);
});
