const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'cuckchat';

let config;

try {
  // Dynamic require allows Webpack to bundle all .json files in this directory
  // and select the right one at build time based on the env var.
  config = require(`./${siteName}.json`);
} catch (e) {
  // Fallback or Error
  console.warn(`Config for site '${siteName}' not found. Check your NEXT_PUBLIC_SITE_NAME env var.`);
  // We can fallback to cuckchat or just throw
  config = require('./cuckchat.json');
}

export default config;
