import ast
import io
import pathlib
import subprocess
import sys
import tokenize
import black
check = '--check' in sys.argv
files = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], text=True).split('\0')
changed = 0
for name in sorted(set(files)):
    file = pathlib.Path(name)
    if not name.endswith('.py') or not file.is_file() or name.startswith('docs/'):
        continue
    source = file.read_text(encoding='utf-8-sig')
    expected = ast.dump(ast.parse(source), include_attributes=False)
    lines = source.splitlines(keepends=True)
    for token in reversed(list(tokenize.generate_tokens(io.StringIO(source).readline))):
        if token.type == tokenize.COMMENT:
            row, column = token.start
            end_row, end_column = token.end
            lines[row - 1] = lines[row - 1][:column] + lines[end_row - 1][end_column:]
    prepared = ''.join(lines)
    try:
        prepared = black.format_file_contents(prepared, fast=False, mode=black.Mode(line_length=400, string_normalization=False))
    except black.NothingChanged:
        pass
    protected = set()
    for token in tokenize.generate_tokens(io.StringIO(prepared).readline):
        if token.type == tokenize.STRING:
            protected.update(range(token.start[0], token.end[0] + 1))
    formatted = ''.join(line for index, line in enumerate(prepared.splitlines(keepends=True), 1) if line.strip() or index in protected)
    assert ast.dump(ast.parse(formatted), include_attributes=False) == expected, name
    if formatted == source:
        continue
    changed += 1
    if check:
        print(name, file=sys.stderr)
    else:
        file.write_text(formatted, encoding='utf-8', newline='\n')
print(f'{changed} Python files {"need formatting" if check else "formatted"}')
if check and changed:
    sys.exit(1)
