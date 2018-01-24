import * as electron from "electron";
import * as express from "express";
import * as path from "path";
import * as request from "request-promise-native";
import * as querystring from "querystring";
import auth_template from "./auth_template.html"
import User from "./user";
// config
const streamlabs_conf = require("./../../config/streamlabs.json");
const twitch_conf =     require("./../../config/twitch.json");

const app: electron.App = electron.app;

var user: User;

let auth_token: string;
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

var auth_config = {
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
  let authUrl = `https://streamlabs.com/api/v1.0/authorize?response_type=code&client_id=${streamlabs_conf.client_id}&redirect_uri=${streamlabs_conf.redirect_uri}&scope=socket.token`;
  authWindow.loadURL(authUrl);
  // // FIXME remove
  // authWindow.on("close",() => {
  //   app.quit();
  // });

  let serv = express();
  serv.get("/streamlabs", (req, res) => {
    res.send("");
    let code = req.query.code;

    var {client_id, client_secret,redirect_uri} = streamlabs_conf;
    request(
    {
      method: "POST",
      url: `https://streamlabs.com/api/v1.0/token?grant_type=authorization_code&client_id=${client_id}&client_secret=${client_secret}&redirect_uri=${redirect_uri}&code=${code}`,
      qsStringifyOptions: {
        encode: false
      }
    }).then(
      (a) => {
        console.log(a)
      }
    ).catch((err) => {
      console.log("error - use curl now");
      auth_token = "hQjB6IBZoo3UE3ytG0XiDtmBPriAUb3WFMWynfMy";
      mainWindow.webContents.send("token-got", auth_token);
      // authWindow.close();
      let responceType = "token";
      let scopes = "user:edit+channel_subscriptions+channel_read";
      let twitchAuth = `https://api.twitch.tv/kraken/oauth2/authorize?client_id=${twitch_conf.client_id}&redirect_uri=${twitch_conf.redirect_uri}&response_type=${responceType}&scope=${scopes}`;
      console.log(twitchAuth);
      authWindow.close();
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
        console.log("token", token.access_token);
        authWindow.close();
        (<any>authWindow) = null;
        mainWindow.show();
        // get user info
        var headers = {
          Authorization: `OAuth ${token.access_token}`,
          "Client-ID": twitch_conf.client_id,
        };
        request(
        {
          method: "GET",
          url: `https://api.twitch.tv/kraken/channel`,
          headers: {...headers}
        }).then((data) => {
          user = new User(data.name, data._links.follows, data._link.subscriptions);
          Promise.all([
            request({
              method: "GET",
              url: user.followers,
              headers: {...headers},
            }), request({
              method: "GET",
              url: user.subscriptions,
              headers: {...headers},
            })
          ]).then((result) => {
            mainWindow.webContents.send("got-user-data", [user,...result]);
          });
        });
      });
      authWindow.loadURL(twitchAuth);
      authWindow.show();
    });
  });


  serv.get("/twitch", (req, res) => {
    res.send(auth_template);
  });
  serv.listen(3000);
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createMainWindow();
  }
});
