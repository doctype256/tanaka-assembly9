import type { VercelRequest, VercelResponse } from "@vercel/node";
export default function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse>;
export declare function GET(): Promise<Response>;
