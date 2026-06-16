import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API calls through the Next server to the .NET backend. This lets the
  // whole app be exposed via a single tunnel/origin: the browser only ever calls
  // /api/* on the frontend's host, and Next forwards it server-side to the
  // backend — so no second tunnel and no cross-origin (CORS) setup is needed.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
