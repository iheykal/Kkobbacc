#!/usr/bin/env node

/**
 * WebP Conversion Script
 * Converts all PNG, JPG, and JPEG images to WebP format
 * Maintains original images as fallbacks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Directories to process
  directories: [
    'public/icons',
    'public/uploads',
    'src/assets',
    'src/images'
  ],
  
  // Supported input formats
  inputFormats: ['.png', '.jpg', '.jpeg'],
  
  // Output format
  outputFormat: '.webp',
  
  // Quality settings (0-100)
  quality: 85,
  
  // Whether to keep original files
  keepOriginals: true,
  
  // Whether to create a mapping file
  createMapping: true
};

class WebPConverter {
  constructor() {
    this.convertedFiles = [];
    this.failedFiles = [];
    this.mapping = {};
  }

  /**
   * Check if ImageMagick or Sharp is available
   */
  checkDependencies() {
    try {
      // Try ImageMagick first
      execSync('magick -version', { stdio: 'ignore' });
      console.log('✅ ImageMagick found');
      return 'imagemagick';
    } catch (error) {
      try {
        // Try Sharp (Node.js library)
        require('sharp');
        console.log('✅ Sharp library found');
        return 'sharp';
      } catch (error) {
        console.log('❌ Neither ImageMagick nor Sharp found');
        console.log('Please install one of them:');
        console.log('  ImageMagick: https://imagemagick.org/script/download.php');
        console.log('  Sharp: npm install sharp');
        return null;
      }
    }
  }

  /**
   * Get all image files from directories
   */
  getImageFiles() {
    const imageFiles = [];
    
    CONFIG.directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = this.getAllFiles(dir);
        const imageFilesInDir = files.filter(file => 
          CONFIG.inputFormats.some(format => 
            file.toLowerCase().endsWith(format)
          )
        );
        imageFiles.push(...imageFilesInDir);
      }
    });
    
    return imageFiles;
  }

  /**
   * Recursively get all files in a directory
   */
  getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(fullPath);
      }
    });
    
    return arrayOfFiles;
  }

  /**
   * Convert image using ImageMagick
   */
  convertWithImageMagick(inputPath, outputPath) {
    try {
      const command = `magick "${inputPath}" -quality ${CONFIG.quality} "${outputPath}"`;
      execSync(command, { stdio: 'pipe' });
      return true;
    } catch (error) {
      console.error(`❌ ImageMagick conversion failed for ${inputPath}:`, error.message);
      return false;
    }
  }

  /**
   * Convert image using Sharp
   */
  async convertWithSharp(inputPath, outputPath) {
    try {
      const sharp = require('sharp');
      await sharp(inputPath)
        .webp({ quality: CONFIG.quality })
        .toFile(outputPath);
      return true;
    } catch (error) {
      console.error(`❌ Sharp conversion failed for ${inputPath}:`, error.message);
      return false;
    }
  }

  /**
   * Convert a single image file
   */
  async convertFile(inputPath, method) {
    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(parsedPath.dir, `${parsedPath.name}${CONFIG.outputFormat}`);
    
    console.log(`🔄 Converting: ${inputPath} → ${outputPath}`);
    
    let success = false;
    
    if (method === 'imagemagick') {
      success = this.convertWithImageMagick(inputPath, outputPath);
    } else if (method === 'sharp') {
      success = await this.convertWithSharp(inputPath, outputPath);
    }
    
    if (success) {
      this.convertedFiles.push({
        original: inputPath,
        webp: outputPath,
        size: {
          original: fs.statSync(inputPath).size,
          webp: fs.statSync(outputPath).size
        }
      });
      
      // Create mapping entry
      this.mapping[inputPath] = outputPath;
      
      const originalSize = this.convertedFiles[this.convertedFiles.length - 1].size.original;
      const webpSize = this.convertedFiles[this.convertedFiles.length - 1].size.webp;
      const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
      
      console.log(`✅ Converted successfully (${savings}% smaller)`);
    } else {
      this.failedFiles.push(inputPath);
    }
  }

  /**
   * Create a mapping file for easy reference
   */
  createMappingFile() {
    if (!CONFIG.createMapping) return;
    
    const mappingPath = 'webp-mapping.json';
    const mappingData = {
      generated: new Date().toISOString(),
      totalFiles: this.convertedFiles.length,
      totalSavings: this.calculateTotalSavings(),
      mapping: this.mapping,
      config: CONFIG
    };
    
    fs.writeFileSync(mappingPath, JSON.stringify(mappingData, null, 2));
    console.log(`📄 Mapping file created: ${mappingPath}`);
  }

  /**
   * Calculate total file size savings
   */
  calculateTotalSavings() {
    const totalOriginal = this.convertedFiles.reduce((sum, file) => sum + file.size.original, 0);
    const totalWebp = this.convertedFiles.reduce((sum, file) => sum + file.size.webp, 0);
    const savings = totalOriginal - totalWebp;
    const percentage = (savings / totalOriginal * 100).toFixed(1);
    
    return {
      bytes: savings,
      percentage: percentage,
      originalSize: totalOriginal,
      webpSize: totalWebp
    };
  }

  /**
   * Print conversion summary
   */
  printSummary() {
    console.log('\n📊 Conversion Summary');
    console.log('==================');
    console.log(`✅ Successfully converted: ${this.convertedFiles.length} files`);
    console.log(`❌ Failed conversions: ${this.failedFiles.length} files`);
    
    if (this.convertedFiles.length > 0) {
      const savings = this.calculateTotalSavings();
      console.log(`💾 Total size reduction: ${savings.percentage}% (${this.formatBytes(savings.bytes)} saved)`);
      console.log(`📦 Original size: ${this.formatBytes(savings.originalSize)}`);
      console.log(`📦 WebP size: ${this.formatBytes(savings.webpSize)}`);
    }
    
    if (this.failedFiles.length > 0) {
      console.log('\n❌ Failed files:');
      this.failedFiles.forEach(file => console.log(`  - ${file}`));
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Main conversion process
   */
  async run() {
    console.log('🚀 Starting WebP conversion process...\n');
    
    // Check dependencies
    const method = this.checkDependencies();
    if (!method) {
      process.exit(1);
    }
    
    // Get image files
    const imageFiles = this.getImageFiles();
    console.log(`📁 Found ${imageFiles.length} images to convert\n`);
    
    if (imageFiles.length === 0) {
      console.log('ℹ️ No images found to convert');
      return;
    }
    
    // Convert files
    for (const file of imageFiles) {
      await this.convertFile(file, method);
    }
    
    // Create mapping file
    this.createMappingFile();
    
    // Print summary
    this.printSummary();
    
    console.log('\n🎉 WebP conversion completed!');
  }
}

// Run the converter
if (require.main === module) {
  const converter = new WebPConverter();
  converter.run().catch(console.error);
}

module.exports = WebPConverter;
