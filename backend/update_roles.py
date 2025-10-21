#!/usr/bin/env python3
"""
Script to update role strings in router files
"""
import re
from pathlib import Path

def update_file(filepath):
    """Update role strings in a file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Replace patterns
    replacements = [
        # Student, teacher, admin combination
        (r'require_roles\(\["student", "teacher", "admin"\]\)', 
         'require_roles("student", "teacher", "super_admin", "support_admin")'),
        
        (r'require_roles\(\["admin", "student", "teacher"\]\)', 
         'require_roles("student", "teacher", "super_admin", "support_admin")'),
        
        # Admin + teacher
        (r'require_roles\(\["admin", "teacher"\]\)', 
         'require_teacher_or_admin()'),
        
        # Student only
        (r'require_roles\(\["student"\]\)', 
         'require_student()'),
        
        # Admin only
        (r'require_roles\(\["admin"\]\)', 
         'require_admin()'),
        
        # Admin + finance_admin
        (r'require_roles\(\["admin", "finance_admin"\]\)', 
         'require_roles("super_admin", "finance_admin")'),
        
        # Admin + support_admin
        (r'require_roles\(\["admin", "support_admin"\]\)', 
         'require_roles("super_admin", "support_admin")'),
        
        # Admin + document_admin
        (r'require_roles\(\["admin", "document_admin"\]\)', 
         'require_roles("super_admin", "support_admin")'),
        
        # Student + admin + document_admin
        (r'require_roles\(\["student", "admin", "document_admin"\]\)', 
         'require_roles("student", "super_admin", "support_admin")'),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Update files
files_to_update = [
    'app/routers/documents.py',
    'app/routers/support.py',
    'app/routers/users.py',
    'app/routers/finance.py',
    'app/routers/admin_db.py',
]

for filepath in files_to_update:
    path = Path(filepath)
    if path.exists():
        if update_file(path):
            print(f'✅ Updated: {filepath}')
        else:
            print(f'ℹ️  No changes: {filepath}')
    else:
        print(f'❌ Not found: {filepath}')

print('\n✅ Role string updates complete!')
