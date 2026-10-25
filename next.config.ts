import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      // Achievement badge artwork
      { protocol: "https", hostname: "github.githubassets.com", pathname: "/assets/**" },
    ],
  },
  async redirects() {
    // Profiles moved from /u/:username to /github/:username; keep old links (and ?year=) working.
    return [{ source: "/u/:username", destination: "/github/:username", permanent: true }];
  },
};

export default nextConfig;
