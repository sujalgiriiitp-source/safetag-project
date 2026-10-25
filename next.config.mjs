/** @type {import("next").NextConfig} */
const demoModeSetting = process.env.DEMO_MODE?.trim().toLowerCase();
if (demoModeSetting && demoModeSetting !== "true" && demoModeSetting !== "false") {
  throw new Error("DEMO_MODE must be either true or false.");
}
if (demoModeSetting === "true" && process.env.NODE_ENV === "production") {
  throw new Error("DEMO_MODE cannot be enabled in production.");
}

const nextConfig = {
  experimental: {
    cpus: 2
  },
  webpack(config, { isServer, webpack }) {

    if (!isServer && process.env.SAFETAG_BUILD_PROGRESS === "1") {
      let lastLogged = 0;
      config.plugins.push(
        new webpack.ProgressPlugin((percentage, message, ...details) => {
          if (percentage - lastLogged >= 0.05 || percentage === 1) {
            lastLogged = percentage;
            console.log(
              `[client build] ${Math.round(percentage * 100)}% ${[message, ...details]
                .filter(Boolean)
                .join(" ")}`
            );
          }
        })
      );
    }

    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

export default nextConfig;
