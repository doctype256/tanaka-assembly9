import { NextResponse } from 'next/server';
export declare function GET(): Promise<NextResponse<{
    message: string;
}> | NextResponse<{
    error: string;
}>>;
export declare function POST(request: Request): Promise<NextResponse<{
    success: boolean;
}>>;
