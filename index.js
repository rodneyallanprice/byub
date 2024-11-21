/* eslint-disable import/no-extraneous-dependencies */
import express from "express";
import bodyParser from "body-parser";
import { sendErrorResponse } from "./src/utils.js";
import { init, lookupRequest } from "./src/lookup.js";
import cors from "cors";

init();

const app = express();
const jsonParser = bodyParser.json();
const port = 3460;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

app.use(
  cors({
    origin: ["http://localhost:3000", "http://eats.priceswrite.org"],
    methods: ["POST"],
  })
);

app.post("/open", jsonParser, (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const list = lookupRequest(req.body);
    res.json(list);
  } catch (err) {
    sendErrorResponse(res, err);
  }
});
