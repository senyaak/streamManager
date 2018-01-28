import * as electron from "electron";
import * as querystring from "querystring";
import axios from "axios";

const twitch_conf  = require("./../../config/twitch.json");
const streamlabs_conf  = require("./../../config/streamlabs.json");
import User from "./user";


function startTwitchAuth(window): Promise<any> {
  console.log("start twitch auth")
  let resolve;
  let responceType = "token";
  let scopes = "user:edit+channel_subscriptions+channel_read";
  let twitchAuth = `https://api.twitch.tv/kraken/oauth2/authorize?client_id=${twitch_conf.client_id}&redirect_uri=${twitch_conf.redirect_uri}&response_type=${responceType}&scope=${scopes}`;

  window = new electron.BrowserWindow({
    width: 800,
    height: 500,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  electron.ipcMain.once("twitch-token", (event, location) => {
    var token = querystring.parse(location.href.replace("http://localhost:3000/twitch#", ""));
    window.close();
    (<any>window) = null;
    console.log("openDevTools", token)
    resolve(token);
  });
  window.loadURL(twitchAuth);
  window.show();
  return new Promise((res) => resolve = res);
}

function getTwitchUser(twitchToken, clientId) {
  var headers = {
    Authorization: `OAuth ${twitchToken}`,
    "Client-ID": clientId,
  }
  return axios.get(`https://api.twitch.tv/kraken/channel`, {headers: {...headers}}).then(({data}) => {
    console.log("get name", data);
    return data;
  });
}

function getDataFromTwitch(user, clientId) {
  // get user info
  var headers = {
    Authorization: `OAuth ${user.twitchToken}`,
    "Client-ID": clientId,
  };
  axios(
  {
    method: "GET",
    url: `https://api.twitch.tv/kraken/channel`,
    headers: {...headers}
  }).then(({data}) => {
    Promise.all([
      axios({
        method: "GET",
        url: user.twitchFollowersLink,
        headers: {...headers},
      }), axios({
        method: "GET",
        url: user.twitchSubscriptionsLink,
        headers: {...headers},
      })
    ]).then((result) => {
      // mainWindow.webContents.send("got-user-data", [user,...result]);
    });
  });
}

function getStreamlabsToken(req, res) {
  res.send("");
  let code = req.query.code;
  var {client_id, client_secret,redirect_uri} = streamlabs_conf;

  return axios.post(`https://streamlabs.com/api/v1.0/token`, {
    grant_type: "authorization_code",
    client_id: client_id,
    client_secret: client_secret,
    redirect_uri: redirect_uri,
    code: code
  });
}

export default {
  startTwitchAuth: startTwitchAuth,
  getTwitchUser: getTwitchUser,
  getDataFromTwitch: getDataFromTwitch,
  getStreamlabsToken: getStreamlabsToken,
}
