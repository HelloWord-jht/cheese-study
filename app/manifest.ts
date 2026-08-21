import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "小满的小世界｜三岁启蒙乐园",
    short_name: "小满的小世界",
    description: "90 个语文、数学、英语启蒙小游戏，每天还有三个个性化任务。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fffaf1",
    theme_color: "#5e8e62",
    lang: "zh-CN",
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
