import * as fs from 'fs';
import * as path from 'path';

export default function StaticPage() {
  const filePath = path.join(process.cwd(), 'public', 'profile.html');
  const htmlContent = fs.readFileSync(filePath, 'utf8');

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}