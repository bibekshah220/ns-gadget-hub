import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: __dirname,
    /* Production checks can build into their own directory, so a `next build`
       never corrupts the `.next` a running dev server is serving from.
       Unset means the default, which is what deployments expect. */
    distDir: process.env.NEXT_DIST_DIR || '.next',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '**',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        /* 'unsafe-inline'/'unsafe-eval' are what the Next runtime
                           needs without per-request nonces; everything else is
                           pinned to self plus the image and payment hosts. */
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: blob: https://res.cloudinary.com https://raw.githubusercontent.com",
                            "font-src 'self' data:",
                            "connect-src 'self' https://api.stripe.com https://a.khalti.com",
                            "frame-src 'self' https://js.stripe.com https://maps.google.com https://www.google.com",
                            "form-action 'self' https://rc-epay.esewa.com.np https://epay.esewa.com.np",
                            "frame-ancestors 'none'",
                            "base-uri 'self'",
                            "object-src 'none'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
