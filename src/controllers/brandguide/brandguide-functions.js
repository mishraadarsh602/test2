const axios = require('axios');
const sharp = require('sharp');
const getColors = require('get-image-colors');
const postcss = require('postcss');
const postcssScss = require('postcss-scss');
const AWS = require('aws-sdk');
// const icoToPng = require('ico-to-png');

function removeDuplicates(array) {
  return [...new Set(array)];
}


function cleanImageUrl(imageUrl) {
  return imageUrl.replace(/(.jpg|.png|.gif)(.*)$/, '$1');
}

async function getColorFromImageUrl(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer',
    timeout:5000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'    
    },
   });
    const imageBuffer = Buffer.from(response.data);
    const pngBuffer = await sharp(imageBuffer).toFormat('png').toBuffer();
    const colors = await getColors(pngBuffer, 'image/png');
    const hexColors = colors.slice(0, 3).map(color => color.hex());
    const uniqueHexColors = removeDuplicates(hexColors);

    return uniqueHexColors;
  } catch (error) {
    console.log('Error during color extraction from image function:', error.message);
  }
}



async function fetchBackgroundColorFromAllCSS($,url) {
  let backgroundColors = new Set();
  try {
    const cssLinks = $('link[rel="stylesheet"]').map((_, el) => $(el).attr('href')).get();

    for (const cssLink of cssLinks) {
      const absoluteCssUrl = new URL(cssLink, url).href;
      const cssResponse = await axios.get(absoluteCssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      const cssContent = cssResponse.data;

      // Use postcss to parse CSS without throwing errors on syntax issues
      const result = await postcss().process(cssContent, { parser: postcssScss });
      const root = result.root;

      let backgroundColorCount = 0;
      root.walkDecls(declaration => {
        if (declaration.prop === 'background-color' && !declaration.value.startsWith('var(--')) {
          let color = declaration.value.trim();
      
          // Check if the color is a valid hex color
          if (/^#([0-9a-f]{6})$/i.test(color)) {
            backgroundColors.add(color);
            backgroundColorCount = backgroundColors.size;
            if (backgroundColorCount >= 6) {
              // Break the loop if we have found 6 background colors
              return false;
            }
          }
        }
      });
    }
  } catch (error) {
    console.log('Error fetching background colors from CSS:', error);
    return [];
  }

  return Array.from(backgroundColors).slice(0, 3);
}

async function fetchLogoFromGoogle(query) {
  const keys = ['1688fdb821e025e9621fe74a5b6d2f03aa1c4e930a929d3369a2b71dd6ff6516', 'cf1a0875ce35f0eafaa1e0edc1d561963794350118e3b2f389dfda3757e69f7e', 'bd8bd609bba07e764ef0eab0d3b5fc76c308d198149d85531057b2d70976b63d', '135da8fc76d13668bd08e389eabc2c8704853b1253c93d1c3a74e97112a41c41', 'a4f81c0971e48c5a43beee0ffc8aee86ab63052f24f83c7a0124b060f705078e', 'df8a58cd02cb464b7e8247250d7ea11cfc162673725ce7a8159abf945dfa73fd', '82c9a514bf856c3104747d3117c65ffae63156134332cb35265088a7a8c43f52'];
  const apiKey = keys[Math.floor(Math.random() * keys.length)];

  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: query,
        api_key: apiKey,
        tbm: 'isch', // Image search
      },
    });

    const firstImageResult = response.data.images_results[0];

    if (firstImageResult) {
      let logoUrl = firstImageResult.original;
      logoUrl = cleanImageUrl(logoUrl);
      console.log("logo fetched from google: ",logoUrl);
      return logoUrl;
    } else {
      console.log('No logo found in google search results.');
     
    }
  } catch (error) {
    console.log('Error fetching logo from SerpApi:', error.message);
    
  }
}

function findLogoInSelector($, selector) {
  let logo = "";
  $(selector).each((index, element) => {
    const imgSrc = $(element).attr('src');
    if (imgSrc) {
      logo = imgSrc;
      return false;
    }

    // Check for SVG source
    const svgSrc = $(element).find('svg').attr('src');
    if (svgSrc) {
      logo = svgSrc;
      return false;
    }
  });
  return logo;
}

function findSvgLogo($, selectors) {
  let svgElement = null;

  selectors.split(',').some(selector => {
    $(selector).each((index, element) => {
      if (element.name === 'svg') {
        svgElement = $(element);
        return false; // Stop iterating over the elements
      }
    });

    if (svgElement) {
      return true; // Stop iterating over the selectors
    }
  });

  return svgElement;
}
async function cleanBrandFetchUrl(input) {
  // Check if the input is a URL
 try{
  if (input.startsWith('http://') || input.startsWith('https://')) {
    // Extract the domain from the URL
    const domainRegex = /^https?:\/\/(?:www\.)?(.*?)(\/|$)/;   
    const match = input.match(domainRegex);
    if (match) {
        const domainParts = match[1].split('.');
        const lastDomain = domainParts.slice(-2).join('.');
        return lastDomain;
    } else {
        return "Invalid URL format.";
    }
}
// Check if the input is an email address
else if (input.includes('@')) {
    // Extract the domain from the email address
    const [, domain] = input.split('@');
    const domainParts = domain.split('.');
    const lastDomain = domainParts.slice(-2).join('.');
    return lastDomain || "Invalid email address format.";
} else {
    return "Invalid input. Must be a URL or email address.";
}
 } catch(error){
    console.log("Error while getting domain for brandfetch");
    return input;
 }
}

async function getFromBrandFetch(brandUrl) {
  const keys = ['rLt8fYf7RrPDgXSk4DdsW9ysJIrWHGirCFNmDkdkrIU='];
  const apiKey = keys[Math.floor(Math.random() * keys.length)];

  let brandDomain =  await cleanBrandFetchUrl(brandUrl);
  const url = `https://api.brandfetch.io/v2/brands/${brandDomain}`;
  const options = {
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${apiKey}`
    }
  };

  return axios.get(url, options)
    .then(res => res.data)
    .catch(err => console.error('error:' + err));
}
async function getBrandFetchLogo(path){
  try{
    let  darkLogo = path.find(logo => logo.theme === "dark" && logo.type === "logo"  );
  if (darkLogo) {
    const pngFormat = darkLogo.formats.find(format => format.format === "png");
    const svgFormat = darkLogo.formats.find(format => format.format === "svg");
    if (pngFormat) {
     return pngFormat.src;
    } else if (svgFormat) {
    return svgFormat.src;
    } else {
      return darkLogo.formats[0].src;
    }
  } else {
    console.log("No matching logo found.");
  }
  } catch(error){
    console.log("No logo found in brand fetch:",error)
  }
}
  async function getBrandFetchFavicon(path){
    try{
      
    let  darkLogo = path.find(logo => logo.type === "icon" || logo.type === "symbol");
    if (darkLogo) {
      const pngFormat = darkLogo.formats.find(format => format.format === "png");
      const anyFormat = darkLogo.formats[0].src;
      if (pngFormat) {
      return pngFormat.src;
      } else if (anyFormat) {
      return anyFormat;
      } else {
        console.log("No 'png' or 'svg' format found in the logo.");
      }
    } else {
      console.log("No matching favicon found.");
      return "";

    }
    } catch(error){
      console.log("No Icon found in Brand Fetch")
      return "";

    }

  }


async function runBrandFetch(url,BASE_S3_URL){
  let logo = '', favicon = '', colors = [];
  let  res =  await getFromBrandFetch(url);
  if (res && res.logos) {
    logo = await getBrandFetchLogo(res.logos);
    favicon = await getBrandFetchFavicon(res.logos);
  }
  colors =  res && res.colors && res.colors.length>0 && res.colors.map(color => color.hex);

  if(logo){
    logo = await uploadLogo(logo,url,BASE_S3_URL);
  }
  if(favicon){
    favicon = await uploadFaviconToS3(favicon,url,BASE_S3_URL);
  }
  if(logo && logo.includes('site/')) {
    logo = logo.replace('site/', '');
  }
  if(favicon && favicon.includes('site/')) {
    favicon = favicon.replace('site/', '');
  }
 
  if(!logo || logo==="" && favicon){
    logo = favicon;
  }

  return {
    colors,
    logo,
    favicon,
  }

}
async function uploadFaviconToS3(faviconLink, url,BASE_S3_URL) {
  let faviconUrl = new URL(faviconLink, url).href, s3_url;
  if (faviconUrl.toString().includes('.ico')) {
    s3_url = await uploadToS3(faviconUrl, 'ico');
  } else {
    s3_url = await uploadToS3(faviconUrl, 'image');
  }
  if (s3_url && s3_url.key) {
    faviconUrl = BASE_S3_URL + s3_url.key;
  }
  return faviconUrl;
}

async function downloadImage (imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'    
    }
   });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.log('Error downloading image:', error);
    // throw error;
  }
}

async function uploadToS3(image,type) {
  try {

    let s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: "us-east-1"
    });

    let fileName = 'brandImage_' + new Date().getTime() + ".png", bufferData = '';
    if (type == 'image') {
      let buffer = await downloadImage(image);
      bufferData = await sharp(buffer).png().toBuffer();
    } else if (type == 'svg') {
      bufferData = image;
    }
    // else if (type == 'ico') {
    //   let buffer = await downloadImage(image);
    //   let pngBuffer = await icoToPng(buffer, 128);
    //   bufferData = await sharp(pngBuffer).png().toBuffer();
    // }

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: fileName,
      Body: bufferData,
      ACL: "public-read",
      ContentType: 'image/png',
    };
    return await s3.upload(params).promise();
  } catch (error) {
    console.log('Error uploading image to S3:', error);
    // throw error;
  }

}
async function uploadLogo(imageLogoUrl,url,BASE_S3_URL) {
  try {
    if (!imageLogoUrl.startsWith('https://')) {
      let new_url = new URL(imageLogoUrl, url).href;

      let s3_url = await uploadToS3(new_url, 'image');
      if (s3_url && s3_url.key) {
        new_url = BASE_S3_URL + s3_url.key
      }
      return new_url;
    } else {
      let s3_url = await uploadToS3(imageLogoUrl, 'image');
      if (s3_url && s3_url.key) {
        imageLogoUrl = BASE_S3_URL + s3_url.key
      }
      return imageLogoUrl;
    }
  }
    catch(error){
      console.log("Error during logo uploading to s3 aws:", error.message);
    }
}

  async function checkLogo(logoPath){
    if (!(logoPath.includes('https://dlvkyia8i4zmz.cloudfront.net') || logoPath.includes('https://dzvexx2x036l1.cloudfront.net'))) {
      if(faviconPath.includes('https://dlvkyia8i4zmz.cloudfront.net') || faviconPath.includes('https://dzvexx2x036l1.cloudfront.net')){
        return "replace";
      }else{
        throw new Error('Invalid favicon URL: ' + faviconPath);
      }
    } else{
      console.log("Valid s3 logo URL:", logoPath);
      return "no_change";
    }
}


module.exports = {
  getColorFromImageUrl,
  fetchBackgroundColorFromAllCSS,
  fetchLogoFromGoogle,
  findLogoInSelector,
  runBrandFetch,
  cleanBrandFetchUrl,
  findSvgLogo,
  uploadFaviconToS3,
  downloadImage,
  uploadToS3,
  uploadLogo,
  checkLogo,
};
