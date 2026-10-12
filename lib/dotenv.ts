export interface EnvLine {
  type: 'empty' | 'comment' | 'variable';
  key?: string;
  value?: string;
  comment?: string;
  raw: string;
}

export function parseEnv(envContent: string): EnvLine[] {
  const lines = envContent.split(/\r?\n/);
  return lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return { type: 'empty', raw: line };
    }
    if (trimmed.startsWith('#')) {
      return { type: 'comment', comment: trimmed.slice(1).trim(), raw: line };
    }

    const eqIdx = line.indexOf('=');
    if (eqIdx !== -1) {
      const key = line.slice(0, eqIdx).trim();
      const valAndComment = line.slice(eqIdx + 1).trim();
      let value = valAndComment;
      let inlineComment = '';

      if (valAndComment.startsWith('"') || valAndComment.startsWith("'")) {
        const quote = valAndComment[0];
        let endQuoteIdx = valAndComment.indexOf(quote, 1);
        while (endQuoteIdx !== -1 && valAndComment[endQuoteIdx - 1] === '\\') {
            endQuoteIdx = valAndComment.indexOf(quote, endQuoteIdx + 1);
        }
        
        if (endQuoteIdx !== -1) {
            value = valAndComment.slice(1, endQuoteIdx);
            const remainder = valAndComment.slice(endQuoteIdx + 1).trim();
            if (remainder.startsWith('#')) {
                inlineComment = remainder.slice(1).trim();
            }
        }
      } else {
        const hashIdx = valAndComment.indexOf('#');
        if (hashIdx !== -1) {
             value = valAndComment.slice(0, hashIdx).trim();
             inlineComment = valAndComment.slice(hashIdx + 1).trim();
        }
      }

      return {
        type: 'variable',
        key,
        value,
        comment: inlineComment || undefined,
        raw: line,
      };
    }

    return { type: 'empty', raw: line };
  });
}

export function stringifyEnv(envLines: EnvLine[]): string {
    return envLines.map(line => {
        if (line.type === 'variable') {
            let out = `${line.key}=${line.value}`;
            if (line.comment) {
                out += ` #${line.comment}`;
            }
            return out;
        }
        return line.raw;
    }).join('\n');
}
