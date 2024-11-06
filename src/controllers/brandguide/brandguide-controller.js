const cheerio = require('cheerio');
const functions = require("./brandguide-functions");
const axios = require('axios');
const sharp = require('sharp');
let  BASE_S3_URL = 'https://dlvkyia8i4zmz.cloudfront.net/';
 if(process.env.NODE_ENV === 'production'){
  BASE_S3_URL = 'https://dzvexx2x036l1.cloudfront.net/';
}

const controller = {
  extractFontsColorsLogos: async function extractFontsColorsLogos(url) {
    try {
      // url = await prepareUrl(url);
      // url = url;
      const response = await axios.get(url, {
        timeout: 10000, // Increase timeout to 120 seconds
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 300; // default
        },
      }).catch(error => {});
      if (response && response.data) {
        const $ = cheerio.load(response.data);
        let logo = await extractLogo($, url);
        let favicon = await extractFavicon($, url);
        if (logo && logo.includes('site/')) {
          logo = logo.replace('site/', '');
        }
        if (favicon && favicon.includes('site/')) {
          favicon = favicon.replace('site/', '');
        }
        let checkLogo = await functions.checkLogo(logo, favicon);
        if (checkLogo == 'replace' && favicon) {
          logo = favicon;
        }
        let colorArray = await extractColors(logo, favicon, $, url);
        let colors = [...new Set(colorArray)];

        return {
          colors,
          logo,
          favicon,
        };
      } else {
        let result = await functions.runBrandFetch(url, BASE_S3_URL);
        return result;
      }

    } catch (error) {
      let result = await functions.runBrandFetch(url, BASE_S3_URL);
      return result;
    }
  },
  extractColorsLogos: async function getColors(logourl) {
    try {
      let colors = [];
      let logoColor = await functions.getColorFromImageUrl(logourl);
      if (logoColor ) {
        colors.push(...logoColor);
      } 
      // let faviconColor = await functions.getColorFromImageUrl(favicon);
      // if (faviconColor) {
      //   colors.push(...faviconColor);
      // }   
      // if (colors.length <6 || colors===undefined || colors===null) {
      //    const backgroundColors  = await functions.fetchBackgroundColorFromAllCSS($,url);
      //    if(backgroundColors.length>1){
      //     colors.push(...backgroundColors);
      //    }
      //   }
      return colors.slice(0, 6);
    } catch (error) {
      console.log('Error during color extraction:', error.message);
    }
  }
};

function prepareUrl(url) {
  return url.includes('@') ? `https://${url.split('@')[1]}` : url;
}


async function extractFonts($,url) {  
  try{
    let sortedFonts = [];
    let fontFromBody = await functions.fetchFontFromBody($,url);
      if(fontFromBody && fontFromBody.length>=1){
        sortedFonts.push(fontFromBody );
      }
      let fontFromHeading = await functions.fetchFontFromHeading($,url);
      if(fontFromHeading && fontFromHeading.length>=1){
        sortedFonts.push(fontFromHeading );
      }
      if(sortedFonts.length>=2){
       return sortedFonts;
      } else{
          let installedFontFamilies = await functions.fetchFontsFromWebsite($,url);
          if(installedFontFamilies && installedFontFamilies.length>=2){
            sortedFonts.push(...installedFontFamilies );
          }else{
            sortedFonts.push(...await functions.fetchFontFamilyFromFontFace($,url));
          }
          let uniqueSortedFonts = Array.from(new Set(sortedFonts));
          let limitedSortedFonts = uniqueSortedFonts.slice(0,2);
          if(limitedSortedFonts.length > 0){
            let promises = limitedSortedFonts.map(async (font, index) => {
              let fontStatus = await functions.includesCssVariable(font);
              if(fontStatus){
                let extractedFont = await functions.extractFontValue(font, $, url);
                if(extractedFont){
                  limitedSortedFonts[index] = extractedFont;
                }   
              }
            });
          
            await Promise.all(promises);
          }
         //check  each item of font if it
          limitedSortedFonts = limitedSortedFonts.map(font => font.replace(/['"]/g, ''));
          return limitedSortedFonts.reverse();
      }
    }  catch(error){
      console.log("Error during all font extraction:", error.message);
    }
     
  }

async function extractColors(logo,favicon,$,url) {
  try {
    let colors = [];
    let logoColor = await functions.getColorFromImageUrl(logo);
    if (logoColor ) {
      colors.push(...logoColor);
    } 
    let faviconColor = await functions.getColorFromImageUrl(favicon);
    if (faviconColor) {
      colors.push(...faviconColor);
    }   
    if (colors.length <6 || colors===undefined || colors===null) {
       const backgroundColors  = await functions.fetchBackgroundColorFromAllCSS($,url);
       if(backgroundColors.length>1){
        colors.push(...backgroundColors);
       }
      }
    return colors.slice(0, 6);
  } catch (error) {
    console.log('Error during color extraction:', error.message);
  }
}
async function extractLogo($, url) {

  let website;
  if (url.includes('@')) {

    website = url.split('@')[1];
    website = website.split('.')[0];


  } else if (url.includes('https://www.')) {

    website = url.split('.')[1];

  } else if (url.includes('https://')) {

    website = url.split('.')[0];
    // below is remove https:// from url
    website = website.split('//')[1];

  }
  try{
  let logoFromHeader = functions.findLogoInSelector($,
    `nav img[alt*="logo"],.navbar img[alt*="logo"], .navbar img,.navbar-brand img[alt*="logo"], .navbar-brand img, header img[alt*="logo"], .header img[alt*="logo"],header a img[alt*="logo"],header  div[class*="logo"] img, .header  div[class*="logo"] img,header a img[class*="logo"], header  a[class*="logo"] img,.navbar-brand img[alt*="logo"], .navbar-brand img,div[class*="logo"] a img,header a img[src*="logo"],.elementor a img[alt*="logo"],header a img[alt*=${website}],.header a img[alt*=${website}]`);
  
    if (!logoFromHeader) {
      let logoSvg = functions.findSvgLogo($, `header a svg,.header a svg,div[class*="logo"] a svg,div[class*="logo"] svg,.navbar-brand a svg, a[class*="logo"] svg, div[class*="navbar"] a svg,div[class*="nav"] a svg`);
      if (logoSvg) {
        // If the logo is an SVG, return its string representation
        let imageLogoUrl = await sharp(Buffer.from(logoSvg.toString()))
          .png({ compressionLevel: 9, adaptiveFiltering: true, quality: 100 })
          .toBuffer();
        let s3_url = await functions.uploadToS3(imageLogoUrl, 'svg');
        if (s3_url && s3_url.key) {
          imageLogoUrl = BASE_S3_URL + s3_url.key;
          return imageLogoUrl;
        }
        return '';
      }
    }

  if (!logoFromHeader || logoFromHeader === '' || logoFromHeader === undefined || logoFromHeader === null) {
    try {
      let logo = await functions.fetchLogoFromGoogle('original png logo from website ' + url);
      logoFromHeader = logo;
    } catch (error) {
      // console.log("error while fetching logo from google:", error);
    }
  }

  let imageLogoUrl = logoFromHeader;
  if (imageLogoUrl) {
    return await functions.uploadLogo(imageLogoUrl, url, BASE_S3_URL);
  }
  return "";

}
catch(error){
  // console.log("Error during logo extraction:", error.message);
  try {
    let logo = await functions.fetchLogoFromGoogle('original png logo from website ' + url);
    imageLogoUrl = logo;
    if (imageLogoUrl) {
      return await functions.uploadLogo(imageLogoUrl, url, BASE_S3_URL);
     }
  } catch (error) {
    // console.log("error while fetching logo from google:", error);
  }
  return "";

}
}



async function extractFavicon($, url) {
 try{
  let faviconLink = $('link[rel="shortcut icon"]').attr('href'); 
  if(!faviconLink){
    faviconLink = $('link[rel="icon"]').attr('href'); 
  }

  if(!faviconLink){
    faviconLink = $('link[rel="apple-touch-icon"]').attr('href'); 
  }

  //add check if dont have http or https add it to url
  if (faviconLink && !faviconLink.includes('http')) {
    faviconLink = url +'/' + faviconLink;
  }
  if (faviconLink) {
     return  await functions.uploadFaviconToS3(faviconLink,url,BASE_S3_URL);
  } else {
    return "";
  }
 } catch(error){
  console.log("Error while during favicon uploading to aws", error.message);
  }
}




module.exports = controller;
