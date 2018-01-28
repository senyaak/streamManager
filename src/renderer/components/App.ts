import Vue from "vue";
import Component from "vue-class-component";
import RouterView from "vue";
import template from  "./App.html";
import * as SocketIo from "socket.io-client";
import * as electron from "electron";
import Axios from "axios";
// import "vue-cookie/types";
import router from "./../router";
const ipc: electron.IpcRenderer = electron.ipcRenderer;

@Component({
  template: template,
})
export default class App extends Vue {
  components: [
    RouterView
  ];
  drawer = null;
  socket: SocketIO.Client;
  created() {
    console.log("init");
    ipc.on("token-got", (event, token) => {
      console.log("got",token);
      (<any>this).$cookie.set("token", token, "1D");
      // Init web socket for alerts
      Axios.get(`https://streamlabs.com/api/v1.0/socket/token?access_token=${token}`).then(({data}) => {
        let token = data.socket_token;
        this.socket = SocketIo(`https://sockets.streamlabs.com?token=${token}`);
        console.log(this.socket);
      });
    });
  }
};
