import os
import json
import re
from datetime import datetime

base_dir = r'C:\Users\Saurav Karunakaran\.gemini\antigravity-ide\brain'
output_dir = r'C:\Users\Saurav Karunakaran\OneDrive\Desktop\stock\market-platform\frontend_backup'

# Conversations to scan (all except current and ones with 0 frontend references)
conv_ids = [
    '09195e61-3b19-4f6d-960a-1baf72190f51',
    '0d25a122-cdd8-4c5d-be7b-d6f8990ddfe9',
    'c8ad87d0-034b-435c-9679-2f140eb28ed1',
    '17710b21-1586-4599-b33a-94361c7b7b47',
]

# Track ALL writes: file_path -> list of (code, step_index, conv_id)
all_writes = {}

for conv_id in conv_ids:
    transcript_path = os.path.join(base_dir, conv_id, '.system_generated', 'logs', 'transcript.jsonl')
    if not os.path.exists(transcript_path):
        print(f"Skipping {conv_id}: transcript not found")
        continue
    
    print(f"\nScanning conversation: {conv_id}")
    
    with open(transcript_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line_num, line in enumerate(f):
            try:
                step = json.loads(line)
                step_index = step.get('step_index', line_num)
                
                if 'tool_calls' not in step:
                    continue
                    
                for call in step['tool_calls']:
                    name = call.get('name', '')
                    args = call.get('args', {})
                    status = call.get('status', step.get('status', ''))
                    
                    # Only process successful write_to_file calls
                    if 'write_to_file' not in name and 'write_file' not in name:
                        continue
                    
                    target = args.get('TargetFile', '')
                    target_norm = target.replace('\\', '/').lower()
                    
                    if 'frontend/src/' not in target_norm:
                        continue
                    
                    code = args.get('CodeContent', '')
                    if not code or len(code) < 50:
                        continue
                    
                    # Extract relative path
                    idx = target.replace('\\', '/').index('frontend/src/')
                    rel_path = target.replace('\\', '/')[idx + len('frontend/src/'):]
                    rel_path = re.sub(r'[\"\'><\?\|]', '', rel_path).strip()
                    
                    if rel_path not in all_writes:
                        all_writes[rel_path] = []
                    all_writes[rel_path].append({
                        'code': code,
                        'step': step_index,
                        'conv': conv_id,
                        'size': len(code)
                    })
                    
            except Exception as e:
                pass

print(f"\n\n{'='*60}")
print(f"Found {len(all_writes)} unique frontend files across all conversations")
print(f"{'='*60}")

for path, writes in sorted(all_writes.items()):
    print(f"\n  {path}:")
    for i, w in enumerate(writes):
        print(f"    Version {i+1}: {w['size']} bytes (step {w['step']}, conv {w['conv'][:8]})")

# Save the LAST (most recent) version of each file
print(f"\n\nRestoring to: {output_dir}")
os.makedirs(output_dir, exist_ok=True)

restored = 0
for path, writes in sorted(all_writes.items()):
    # Get the last write (most recent version)
    last_write = writes[-1]
    code = last_write['code']
    
    out_path = os.path.join(output_dir, path.replace('/', os.sep))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(code)
    
    restored += 1
    print(f"  Restored: {path} ({last_write['size']} bytes)")

print(f"\nDone! Restored {restored} files to {output_dir}")
