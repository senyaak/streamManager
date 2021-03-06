import Vue from "vue";
import VueRouter from "vue-router";
// import * as Auth from "../components/pages/Authentication";
//pages
// import Authentication from "./../components/pages/Authentication/Authentication";
import Home from "./../components/pages/Home";
import Followers from "./../components/pages/Lists/Followers/Followers";
// Global components
// import Header from "./../components/pages/Header/Header";
// import List from "./../components/List/List";

// Register components
// Vue.component("app-header", Header);
// Vue.component("list", List)

Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home,
    }, {
      path: "/lists/followers",
      name: "followersList",
      component: Followers,
    }
  ]
});

// // redirect ro login page if not authenticated
// router.beforeEach((to, from, next) => {
//   if (to.path !== '/login') {
//     if (Auth.default.user.authenticated) {
//       next();
//     } else {
//       router.push('/login');
//     }
//   } else {
//     next();
//   }
// })

export default router;
