const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.main = 'main.cjs';
pkg.author = 'nsdav';
pkg.description = 'Blog App';
pkg.version = '1.0.0';

pkg.scripts['start:electron'] = 'electron .';
pkg.scripts['build:electron'] = 'vite build && electron-builder';

pkg.build = {
  appId: 'com.blog.app',
  productName: 'Blog App',
  win: {
    target: 'msi'
  },
  directories: {
    output: 'dist_electron'
  },
  files: [
    'dist/**/*',
    'main.cjs'
  ]
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
