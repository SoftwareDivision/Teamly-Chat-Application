/**
 * Cleanup Script for Orphaned Files
 * 
 * Deletes files from Firebase Storage that have:
 * - reference_count = 0 (no messages using them)
 * - Older than 7 days
 * 
 * Run manually or via cron job:
 * node src/scripts/cleanupOrphanedFiles.js
 */

require('dotenv').config();
const UserDocument = require('../models/UserDocument');
const FirebaseStorageService = require('../services/firebaseStorageService');

async function cleanupOrphanedFiles() {
  console.log('🧹 Starting cleanup of orphaned files...');
  
  try {
    // Find orphaned documents (reference_count = 0, older than 7 days)
    const orphanedDocs = await UserDocument.findOrphanedDocuments(7);
    
    console.log(`📊 Found ${orphanedDocs.length} orphaned files`);
    
    if (orphanedDocs.length === 0) {
      console.log('✅ No orphaned files to clean up');
      process.exit(0);
    }
    
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const doc of orphanedDocs) {
      try {
        // Delete from Firebase Storage
        const deleted = await FirebaseStorageService.deleteFile(doc.firebase_path);
        
        if (deleted) {
          // Delete from database
          await UserDocument.deleteDocument(doc.document_id);
          deletedCount++;
          console.log(`✅ Deleted: ${doc.firebase_path}`);
        } else {
          failedCount++;
          console.log(`⚠️ Failed to delete: ${doc.firebase_path}`);
        }
      } catch (error) {
        failedCount++;
        console.error(`❌ Error deleting ${doc.firebase_path}:`, error.message);
      }
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`   Total found: ${orphanedDocs.length}`);
    console.log(`   Deleted: ${deletedCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log('✅ Cleanup complete');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupOrphanedFiles();
