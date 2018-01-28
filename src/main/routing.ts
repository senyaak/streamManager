import * as express from "express";
import axios from "axios";

import User from "./user";

const twitch_conf = require("./../../config/twitch.json");

export default function declareRoutes(app: express.Express, user: User) {
  app.get("/followers", (req, res) => {
    axios.get(`${user.twitchFollowersLink}?client_id=${twitch_conf.client_id}`).then(({data}) => {
      res.json(data.follows);
    }).catch((err) => {
      res.sendStatus(500)
    });
  });
}
