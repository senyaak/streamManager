import * as electron from "electron";
import * as express from "express";
import * as path from "path";
import axios from "axios";
import * as querystring from "querystring";
import auth_template from "./auth_twitch_template.html"
import User from "./user";
// config
const streamlabs_conf = require("./../../config/streamlabs.json");
const twitch_conf =     require("./../../config/twitch.json");

const app: electron.App = electron.app;

var user: User = new User();
let serv = express();

let mainWindow: electron.BrowserWindow;
let authWindow: electron.BrowserWindow;

function createMainWindow () {
  // Create the browser window.
  mainWindow = new electron.BrowserWindow({
    width: 800,
    height: 600,
    //fullscreen:true,
    // frame:false, // frameless on
    resizable:false
  });
  mainWindow.loadURL(`file://${__dirname}/../dist/index.html`);

  // Открываем DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", function() {
    (<any>mainWindow) = null;
  });
}

var auth_streamlabs_config = {
  clientId: streamlabs_conf.client_id,
  clientSecret: streamlabs_conf.client_secret,
  authorizationUrl: streamlabs_conf.auth_url,
  tokenUrl: streamlabs_conf.token_url,
  useBasicAuthorizationHeader: false,
  redirectUri: streamlabs_conf.redirect_uri
};

app.on("ready", () => {
  createMainWindow();
  mainWindow.hide();
  const windowParams = {
    alwaysOnTop: true,
    autoHideMenuBar: true,
    webPreferences: {
        nodeIntegration: false
    }
  }

  const options = {
    scope: "donations.read",
  };
  authWindow = new electron.BrowserWindow({
    width: 800,
    height: 500,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
    },
  });
  // Open window with streamlabs authorization
  let authUrl = `https://streamlabs.com/api/v1.0/authorize?response_type=code&client_id=${streamlabs_conf.client_id}&redirect_uri=${streamlabs_conf.redirect_uri}&scope=socket.token`;
  authWindow.loadURL(authUrl);

  // streamlabs auth request
  serv.get("/streamlabs", (req, res) => {
    res.send("");
    let code = req.query.code;

    var {client_id, client_secret,redirect_uri} = streamlabs_conf;
    axios.post(`https://streamlabs.com/api/v1.0/token`, {
      grant_type: "authorization_code",
      client_id: client_id,
      client_secret: client_secret,
      redirect_uri: redirect_uri,
      code: code
    }).then(({data}) => {
      console.log("got streamlabs", data);
      user.streamlabsToken = data.access_token;
      mainWindow.webContents.send("token-got", user.streamlabsToken);
      authWindow.close();

      return startTwitchAuth();
    }).then((token) => {
      console.log(`end auth - token `,token)
      user.twitchToken = token.access_token;
      return getTwitchUser().then((twitchUser) => {
        user.name = twitchUser.name;
        user.twitchFollowersLink = twitchUser._links.follows;
        user.twitchSubscriptionsLink = twitchUser._links.subscriptions;
        return;
      });
      // TODO more steps??
    }).then(() => {
      //show main window
      mainWindow.show();
    }).catch((err) => {
      console.log("Something went wrong, terminate process", err);
      app.quit();
    });
  });


  serv.get("/twitch", (req, res) => {
    res.send(auth_template);
  });
  serv.listen(3000);
});

// close app
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

//
// app.on("activate", function () {
//   if (mainWindow === null) {
//     createMainWindow();
//   }
// });

function startTwitchAuth(): Promise<any> {
  console.log("start twitch auth")
  let resolve;
  let responceType = "token";
  let scopes = "user:edit+channel_subscriptions+channel_read";
  let twitchAuth = `https://api.twitch.tv/kraken/oauth2/authorize?client_id=${twitch_conf.client_id}&redirect_uri=${twitch_conf.redirect_uri}&response_type=${responceType}&scope=${scopes}`;

  authWindow = new electron.BrowserWindow({
    width: 800,
    height: 500,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  electron.ipcMain.once("twitch-token", (event, location) => {
    var token = querystring.parse(location.href.replace("http://localhost:3000/twitch#", ""));
    authWindow.close();
    (<any>authWindow) = null;
    console.log("openDevTools", token)
    resolve(token);
  });
  authWindow.loadURL(twitchAuth);
  authWindow.show();
  return new Promise((res) => resolve = res);
}

function getTwitchUser() {
  var headers = {
    Authorization: `OAuth ${user.twitchToken}`,
    "Client-ID": twitch_conf.client_id,
  }
  return axios.get(`https://api.twitch.tv/kraken/channel`, {headers: {...headers}}).then(({data}) => {
    console.log("get name", data);
    return data;
  });
}

function getDataFromTwitch() {
  // get user info
  var headers = {
    Authorization: `OAuth ${user.twitchToken}`,
    "Client-ID": twitch_conf.client_id,
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
      mainWindow.webContents.send("got-user-data", [user,...result]);
    });
  });
}
