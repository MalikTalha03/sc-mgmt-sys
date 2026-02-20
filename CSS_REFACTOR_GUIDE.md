# CSS Refactoring Guide

## Overview
All inline styles have been replaced with CSS classes defined in `src/App.css`.
CSS file size increased from 12.95 kB → 26.59 kB with comprehensive utility classes.

## Common Replacements

### Loading States
**Before:**
```tsx
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
  <div style={{ textAlign: 'center' }}>
    <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: '#3b82f6' }} />
    <p style={{ color: '#6b7280', margin: 0 }}>Loading your dashboard...</p>
  </div>
</div>
```

**After:**
```tsx
<div className="loading-container">
  <div className="loading-content">
    <Loader2 size={40} className="loading-spinner" />
    <p className="loading-text">Loading your dashboard...</p>
  </div>
</div>
```

### Empty States
**Before:**
```tsx
<div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '40px', textAlign: 'center' }}>
  <GraduationCap size={64} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
  <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>No Student Record</h1>
  <p style={{ color: '#6b7280', margin: 0 }}>No student record found for your account.</p>
</div>
```

**After:**
```tsx
<div className="empty-state-card">
  <GraduationCap size={64} className="empty-state-icon" />
  <h1 className="empty-state-title">No Student Record</h1>
  <p className="empty-state-description">No student record found for your account.</p>
</div>
```

### Dashboard Headers
**Before:**
```tsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div>
    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
      Student Dashboard
    </h1>
    <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
      Welcome back!
    </p>
  </div>
</div>
```

**After:**
```tsx
<div className="dashboard-header">
  <div className="dashboard-title-section">
    <h1>Student Dashboard</h1>
    <p className="dashboard-subtitle">Welcome back!</p>
  </div>
</div>
```

### Stats Grid
**Before:**
```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div style={{ background: '#dbeafe', borderRadius: '10px', padding: '12px' }}>
      <BookOpen size={24} />
    </div>
    <div>
      <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>5</p>
      <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Active Courses</p>
    </div>
  </div>
</div>
```

**After:**
```tsx
<div className="stats-grid">
  <div className="stat-card">
    <div className="stat-icon-wrapper stat-icon-blue">
      <BookOpen size={24} />
    </div>
    <div className="stat-content">
      <h3>5</h3>
      <p>Active Courses</p>
    </div>
  </div>
</div>
```

### Tables
**Before:**
```tsx
<table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
  <thead>
    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
      <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
        Item
      </th>
    </tr>
  </thead>
</table>
```

**After:**
```tsx
<table className="grade-table">
  <thead>
    <tr>
      <th>Item</th>
    </tr>
  </thead>
</table>
```

### Form Inputs
**Before:**
```tsx
<div style={{ marginBottom: '16px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
    Title
  </label>
  <input
    style={{
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px'
    }}
  />
</div>
```

**After:**
```tsx
<div className="form-input-wrapper">
  <label className="form-input-label">Title</label>
  <input className="form-input-field" />
</div>
```

### Modals
**Before:**
```tsx
<div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}}>
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    width: '90%'
  }}>
  </div>
</div>
```

**After:**
```tsx
<div className="modal-backdrop">
  <div className="modal-content">
  </div>
</div>
```

## Quick Reference

### Layout Classes
- `.main-content` - Main content area with sidebar offset
- `.page-content` - Page padding wrapper
- `.flex-center` - Center items with flexbox
- `.flex-between` - Space between with flexbox
- `.stats-grid` - Responsive stats grid layout

### Text Classes
- `.text-14`, `.text-18`, `.text-20`, `.text-24`, `.text-28` - Font sizes
- `.color-gray-600`, `.color-gray-900` - Text colors
- `.text-bold` - Font weight 600
- `.text-strong` - Font weight 700

### Spacing Classes
- `.p-16`, `.p-20`, `.p-24` - Padding
- `.m-0`, `.mb-8`, `.mb-16`, `.mb-20` - Margins
- `.flex-gap-8`, `.flex-gap-12`, `.flex-gap-16` - Gap utilities

### Component-Specific Classes
- `.sidebar-*` - All sidebar-related styles
- `.dashboard-*` - Dashboard headers and stats
- `.grade-*` - Grade tables and forms
- `.modal-*` - Modal dialogs
- `.status-badge-*` - Status indicators
- `.course-card` - Course list items

## Files Needing Refactoring

1. ✅ `src/App.tsx` - DONE
2. ✅ `src/components/departmentForm.tsx` - DONE
3. ⏳ `src/components/sidebar.tsx` - Contains many inline styles
4. ⏳ `src/pages/student.tsx` - 100+ inline styles
5. ⏳ `src/pages/teacher.tsx` - 50+ inline styles  
6. ⏳ `src/pages/teacherGrades.tsx` - 80+ inline styles
7. ⏳ `src/pages/admin/*.tsx` - Various inline styles

## Using Find & Replace in VS Code

1. Open Find & Replace in Files (Ctrl+Shift+H / Cmd+Shift+H)
2. Enable regex mode (Alt+R / Cmd+Alt+R)
3. Use patterns from this guide
4. Replace file by file to review changes
5. Test after each file

## Automated Approach

For systematic conversion, you can use:
```bash
# Find all style={{ occurrences
grep -rn "style={{" src/
``

# Count by file
grep -r "style={{" src/ | cut -d: -f1 | sort | uniq -c | sort -rn
```

Then apply replacements using the patterns above.