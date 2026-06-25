import os
import json
import re

base_dir = r'C:\Users\Saurav Karunakaran\.gemini\antigravity-ide\brain'
frontend_dir = r'C:\Users\Saurav Karunakaran\OneDrive\Desktop\stock\market-platform\frontend\src'

file_contents = {}

for root, dirs, files in os.walk(base_dir):
    if '.system_generated' not in root:
        continue
    for f in files:
        if f == 'transcript.jsonl':
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                    for line in file:
                        try:
                            step = json.loads(line)
                            if 'tool_calls' in step:
                                for call in step['tool_calls']:
                                    name = call.get('name', '')
                                    args = call.get('args', {})
                                    if 'write_to_file' in name:
                                        target = args.get('TargetFile', '')
                                        target_norm = target.replace('\\\\', '/').lower()
                                        if 'frontend/src/' in target_norm:
                                            # get real casing from target and clean it
                                            real_rel_path = target.replace('\\\\', '/').split('frontend/src/')[-1]
                                            real_rel_path = re.sub(r'[\"\'><\?\|]', '', real_rel_path).strip()
                                            
                                            code = args.get('CodeContent', '')
                                            
                                            # Unescape if it's double JSON encoded or contains raw newlines
                                            if code.startswith('\"') and code.endswith('\"'):
                                                try:
                                                    code = json.loads(code)
                                                except Exception:
                                                    pass
                                            elif r'\n' in code:
                                                code = code.encode('utf-8').decode('unicode_escape')
                                                
                                            if len(code) > 100:
                                                file_contents[real_rel_path] = code
                        except Exception:
                            pass
            except Exception:
                pass

print(f'Found {len(file_contents)} files in history.')
for k, v in file_contents.items():
    print(f'Restoring {k} ({len(v)} bytes)')
    out_path = os.path.join(frontend_dir, k)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        # One last check to remove wrapping quotes if they persisted
        if v.startswith('\"') and v.endswith('\"'):
            v = v[1:-1]
        f.write(v)

print('Successfully restored all exact frontend files from history!')
