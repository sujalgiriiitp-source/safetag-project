/** @type {import("next").NextConfig} */
const nextConfig = {
  swcMinify: false,
  experimental: {
    webpackBuildWorker: false,
    workerThreads: false
  },
  webpack(config, { isServer, webpack }) {
    config.cache = false;
    config.optimization.minimize = false;

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
