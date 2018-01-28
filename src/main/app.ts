import * as electron from "electron";
import * as express from "express";
import * as path from "path";
import axios from "axios";
import * as querystring from "querystring";
import auth_template from "./auth_twitch_template.html"
import User from "./user";
import authApi from "./auth"
import router from "./routing"

// config
const streamlabs_conf = require("./../../config/streamlabs.json");
const twitch_conf     = require("./../../config/twitch.json");
const serverConf      = require("./../../config/express.json");

// server
var user: User = new User();
let serv = express();
serv.listen(serverConf.port);

// electorn
const app: electron.App = electron.app;
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
    return authApi.getStreamlabsToken(req, res).then(({data}) => {
      console.log("got streamlabs", data);
      user.streamlabsToken = data.access_token;
      mainWindow.webContents.send("token-got", user.streamlabsToken);
      authWindow.close();

      // TODO split fn to avoid window manipulations in it
      return authApi.startTwitchAuth(authWindow);
    }).then((token) => {
      console.log(`end auth - token `,token)
      user.twitchToken = token.access_token;
      return authApi.getTwitchUser(user.twitchToken, twitch_conf.client_id).then((twitchUser) => {
        user.name = twitchUser.name;
        user.twitchFollowersLink = twitchUser._links.follows;
        user.twitchSubscriptionsLink = twitchUser._links.subscriptions;
        return;
      });
      // TODO more steps??
    }).then(() => {
      router(serv, user);
      //show main window
      mainWindow.show();
    }).catch((err) => {
      console.log("Something went wrong, terminate process", err);
      app.quit();
    })
  });

  serv.get("/twitch", (req, res) => {
    res.send(auth_template);
  });
});

// close app
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
