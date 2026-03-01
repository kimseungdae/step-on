import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./demo/App.vue";
import DemoView from "./demo/DemoView.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: "/", component: DemoView }],
});

createApp(App).use(router).mount("#app");
