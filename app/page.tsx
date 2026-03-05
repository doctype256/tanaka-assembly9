import * as fs from 'fs';
import * as path from 'path';

export default function StaticPage() {
  return (
    <iframe 
      src="/index.html" 
      style={{ width: '100%', height: '100vh', border: 'none' }} 
    />
  );
}