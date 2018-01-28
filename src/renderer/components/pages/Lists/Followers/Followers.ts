import Vue from "vue";
import Component from "vue-class-component";
import Axios from "axios";

import template from "./Followers.html";

const serverConfig = require("./../../../../../../config/express.json");

@Component({
  template: template,
  components: {}
})
export default class Followers extends Vue {
  followers: Follower[] | null  = null;
  mounted() {
    Axios.get(`http://${serverConfig.host}:${serverConfig.port}/followers`).then(({data}) => {
      console.log(data);
      this.followers = data;
    })
  }
}

// TODO create twitch data interfaces

interface Follower {
  created_at: Date,
  _links: {
    self: string,
  },
  notifications: boolean,
  user: {
    display_name: string,
    _id: number,
    name: string,
    type: string,
    bio: string | null,
    created_at: Date,
    updated_at: Date,
    logo: string,
    _links: {
      self: string,
    }
  }
}
