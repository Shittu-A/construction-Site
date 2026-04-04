const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const srcDir = path.join(__dirname, 'src');
const publicDir = path.join(__dirname, 'public');
const countries = ['africa', 'asia', 'europ', 'north-america', 'sourth-america', 'australia', 'antarctica'];

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Ensure country directories exist
countries.forEach(c => {
  const cPath = path.join(publicDir, c);
  if (!fs.existsSync(cPath)) {
    fs.mkdirSync(cPath, { recursive: true });
  }
});

// Recursive file copy/process
function walkAndProcess(dir, relPath = '') {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const itemRelPath = path.join(relPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Create this directory in public (for shared assets)
      const pubDirPath = path.join(publicDir, itemRelPath);
      if (!fs.existsSync(pubDirPath)) {
        fs.mkdirSync(pubDirPath, { recursive: true });
      }
      
      // We also need to recreate directories in country folders if they hold HTML files
      countries.forEach(c => {
         const cDirPath = path.join(publicDir, c, itemRelPath);
         if (!fs.existsSync(cDirPath)) {
            fs.mkdirSync(cDirPath, { recursive: true });
         }
      });
      
      walkAndProcess(fullPath, itemRelPath);
    } else {
      if (item.toLowerCase().endsWith('.html')) {
        // Process HTML
        const content = fs.readFileSync(fullPath, 'utf8');
        const $ = cheerio.load(content);

        // Remove the top country navigation. We can target .bg-light.py-2 which has the country links
        // Let's be safe and check if it contains 'asia/' or 'africa/' to be absolutely sure it's the right stripped element
        $('.bg-light.py-2').each(function() {
            if ($(this).html().includes('asia/index.html') || $(this).html().includes('africa/index.html')) {
                $(this).remove();
            }
        });

        // Convert relative paths to absolute paths for assets
        // Elements to fix: link[href], img[src], script[src], source[src]
        const updatePath = (attr) => {
           return function() {
              let val = $(this).attr(attr);
              if (val && !val.startsWith('http') && !val.startsWith('//') && !val.startsWith('/') && !val.startsWith('#') && !val.startsWith('mailto:')) {
                 // It's a relative path. If it's an asset (css, img, js, etc.) we should make it absolute
                 // Actually, all assets are moved to /public, so their absolute path is / + val
                 // If it's a link to another html page, it's relative inside the same country directory, so we don't need to change it!
                 if (val.includes('.html')) {
                    // It's an internal link, keep it relative so it stays within /ng/ or /us/
                 } else {
                    // It's an asset (like img/foo.png or css/styles.css)
                    // But wait, what if it's currently inside a subfolder (like src/asia/index.html)? 
                    // Its relative path might be ../css/styles.css
                    // We can resolve it based on the current relPath
                    // Assuming the structure is preserved, resolving absolute path:
                    // e.g. for src/asia/index.html, relPath is "asia/index.html". Dir is "asia"
                    // If href="../css/styles.css", absolute is "/css/styles.css"
                    // So we can do:
                    let dirname = path.dirname(itemRelPath).replace(/\\/g, '/');
                    if (dirname === '.') dirname = '';
                    let abspath = path.posix.join('/', dirname, val);
                    
                    // Avoid things like /../css so use path.posix.normalize
                    abspath = path.posix.normalize(abspath);
                    $(this).attr(attr, abspath);
                 }
              }
           };
        };

        $('link[href]').each(updatePath('href'));
        $('img[src]').each(updatePath('src'));
        $('script[src]').each(updatePath('src'));
        $('source[src]').each(updatePath('src'));

        // Write processed HTML to all country folders
        const outHtml = $.html();
        countries.forEach(c => {
           fs.writeFileSync(path.join(publicDir, c, itemRelPath), outHtml);
        });
      } else {
        // It's an asset. Copy directly to public folder
        fs.copyFileSync(fullPath, path.join(publicDir, itemRelPath));
      }
    }
  });
}

walkAndProcess(srcDir);
console.log("Migration complete!");
