module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Add cssnano for production minification and optimization
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          colormin: true,
          convertValues: true,
          minifyFontValues: true,
          minifyGradients: true,
          minifyParams: true,
          minifySelectors: true,
          reduceIdents: false, // Keep false to avoid breaking CSS custom properties
          reduceInitial: true,
          reduceTransforms: true,
        }]
      }
    } : {})
  },
}