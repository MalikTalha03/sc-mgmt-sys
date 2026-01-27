import { collection, getDocs, deleteDoc, query, where } from "firebase/firestore";
import { db } from "../firebase/db";

interface Enrollment {
  studentId: string;
  courseCode: string;
  status: "approved" | "pending" | "rejected" | "completed";
  createdAt?: any;
}

/**
 * Clean up duplicate enrollments - keeps only one enrollment per student+course combination
 * Priority: approved > pending > rejected > completed (keeps the highest priority one)
 */
export async function cleanupDuplicateEnrollments(): Promise<void> {
  console.log("Starting enrollment cleanup...");
  
  try {
    const querySnapshot = await getDocs(collection(db, "enrollments"));
    const allDocs = querySnapshot.docs;
    
    console.log(`Found ${allDocs.length} total enrollment documents`);
    
    // Group by studentId + courseCode
    const groups: Map<string, { id: string; data: Enrollment }[]> = new Map();
    
    allDocs.forEach(doc => {
      const data = doc.data() as Enrollment;
      const key = `${data.studentId}|${data.courseCode}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push({ id: doc.id, data });
    });
    
    // Find duplicates and delete extras
    const priority = ["approved", "pending", "rejected", "completed"];
    let deletedCount = 0;
    
    for (const [key, docs] of groups) {
      if (docs.length > 1) {
        console.log(`\nFound ${docs.length} duplicates for: ${key}`);
        
        // Sort by priority - keep the first one (highest priority)
        docs.sort((a, b) => priority.indexOf(a.data.status) - priority.indexOf(b.data.status));
        
        const toKeep = docs[0];
        const toDelete = docs.slice(1);
        
        console.log(`  Keeping: ${toKeep.data.status} (id: ${toKeep.id})`);
        
        for (const doc of toDelete) {
          console.log(`  Deleting: ${doc.data.status} (id: ${doc.id})`);
          const docRef = querySnapshot.docs.find(d => d.id === doc.id)?.ref;
          if (docRef) {
            await deleteDoc(docRef);
            deletedCount++;
          }
        }
      }
    }
    
    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate enrollments.`);
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  }
}

// Run immediately
cleanupDuplicateEnrollments();
